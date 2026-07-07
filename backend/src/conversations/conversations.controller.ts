import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Request,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ConversationsService } from './conversations.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { AddMessageDto } from './dto/add-message.dto';
import { JwtGuard } from '../auth/guards/jwt.guard';
import type { User } from '@prisma/client';

@UseGuards(JwtGuard)
@Controller('conversations')
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Get()
  findAll(@Request() req: { user: User }) {
    return this.conversationsService.findAll(req.user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req: { user: User }) {
    return this.conversationsService.findOne(id, req.user.id);
  }

  @Post()
  create(@Body() dto: CreateConversationDto, @Request() req: { user: User }) {
    return this.conversationsService.create(dto, req.user);
  }

  @Post(':id/messages')
  addMessage(
    @Param('id') id: string,
    @Body() dto: AddMessageDto,
    @Request() req: { user: User },
  ) {
    return this.conversationsService.addMessage(id, dto, req.user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @Request() req: { user: User }) {
    return this.conversationsService.remove(id, req.user.id);
  }
}
