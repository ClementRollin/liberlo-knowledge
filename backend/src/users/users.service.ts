import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateUserDto } from './dto/create-user.dto';
import type { UpdateUserDto } from './dto/update-user.dto';
import type { Role } from '@prisma/client';

export interface CreatedUserWithPassword {
  id: string;
  email: string;
  role: Role;
  serviceId: string | null;
  isActive: boolean;
  createdAt: Date;
  generatedPassword: string;
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  private generateStrongPassword(): string {
    const charset =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    const bytes = randomBytes(16);
    return Array.from(bytes, (byte) => charset[byte % charset.length]).join('');
  }

  async createUser(dto: CreateUserDto): Promise<CreatedUserWithPassword> {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException(
        `Un compte avec l'adresse ${dto.email} existe déjà.`,
      );
    }

    const generatedPassword = this.generateStrongPassword();
    const passwordHash = await bcrypt.hash(generatedPassword, 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        role: dto.role,
        serviceId: dto.serviceId ?? null,
        isActive: true,
      },
    });

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      serviceId: user.serviceId,
      isActive: user.isActive,
      createdAt: user.createdAt,
      generatedPassword,
    };
  }

  findAllUsers() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        serviceId: true,
        isActive: true,
        createdAt: true,
        service: { select: { id: true, name: true, slug: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateUser(id: string, dto: UpdateUserDto) {
    await this.findUserOrThrow(id);
    return this.prisma.user.update({
      where: { id },
      data: dto,
      select: {
        id: true,
        email: true,
        role: true,
        serviceId: true,
        isActive: true,
        createdAt: true,
      },
    });
  }

  async deactivateUser(id: string) {
    await this.findUserOrThrow(id);
    return this.prisma.user.update({
      where: { id },
      data: { isActive: false },
      select: { id: true, email: true, isActive: true },
    });
  }

  private async findUserOrThrow(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException(`Utilisateur ${id} introuvable.`);
    return user;
  }
}
