import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SearchService } from '../search/search.service';
import type { User } from '@prisma/client';
import type { CreateConversationDto } from './dto/create-conversation.dto';
import type { AddMessageDto } from './dto/add-message.dto';

type Requester = Pick<User, 'id' | 'role' | 'serviceId'>;

@Injectable()
export class ConversationsService {
  constructor(
    private prisma: PrismaService,
    private searchService: SearchService,
  ) {}

  async findAll(userId: string) {
    return this.prisma.conversation.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true,
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { content: true, role: true },
        },
      },
    });
  }

  async findOne(id: string, userId: string) {
    const conv = await this.prisma.conversation.findUnique({
      where: { id },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
    if (!conv) throw new NotFoundException('Conversation introuvable');
    if (conv.userId !== userId) throw new ForbiddenException();
    return conv;
  }

  async create(dto: CreateConversationDto, requester: Requester) {
    const title =
      dto.query.length > 60 ? dto.query.slice(0, 60) + '…' : dto.query;

    const conv = await this.prisma.conversation.create({
      data: { userId: requester.id, title },
    });

    const results = await this.searchService.search(
      { query: dto.query },
      requester,
    );

    const [userMsg, assistantMsg] = await this.prisma.$transaction([
      this.prisma.message.create({
        data: { conversationId: conv.id, role: 'USER', content: dto.query },
      }),
      this.prisma.message.create({
        data: {
          conversationId: conv.id,
          role: 'ASSISTANT',
          content: `${results.length} résultat${results.length !== 1 ? 's' : ''} trouvé${results.length !== 1 ? 's' : ''}`,
          results: results,
        },
      }),
    ]);

    return { ...conv, messages: [userMsg, assistantMsg] };
  }

  async addMessage(id: string, dto: AddMessageDto, requester: Requester) {
    const conv = await this.prisma.conversation.findUnique({ where: { id } });
    if (!conv) throw new NotFoundException('Conversation introuvable');
    if (conv.userId !== requester.id) throw new ForbiddenException();

    const results = await this.searchService.search(
      { query: dto.query },
      requester,
    );

    const [userMsg, assistantMsg] = await this.prisma.$transaction([
      this.prisma.message.create({
        data: { conversationId: id, role: 'USER', content: dto.query },
      }),
      this.prisma.message.create({
        data: {
          conversationId: id,
          role: 'ASSISTANT',
          content: `${results.length} résultat${results.length !== 1 ? 's' : ''} trouvé${results.length !== 1 ? 's' : ''}`,
          results: results,
        },
      }),
    ]);

    await this.prisma.conversation.update({
      where: { id },
      data: { updatedAt: new Date() },
    });

    return [userMsg, assistantMsg];
  }

  async remove(id: string, userId: string) {
    const conv = await this.prisma.conversation.findUnique({ where: { id } });
    if (!conv) throw new NotFoundException('Conversation introuvable');
    if (conv.userId !== userId) throw new ForbiddenException();
    await this.prisma.conversation.delete({ where: { id } });
  }
}
