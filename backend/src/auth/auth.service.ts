import { Injectable, UnauthorizedException, NotFoundException, BadRequestException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcrypt'
import { PrismaService } from '../prisma/prisma.service'
import type { LoginDto } from './dto/login.dto'
import type { ActivateDto } from './dto/activate.dto'

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } })
    if (!user || !user.isActive) throw new UnauthorizedException('Identifiants incorrects')

    const valid = await bcrypt.compare(dto.password, user.passwordHash)
    if (!valid) throw new UnauthorizedException('Identifiants incorrects')

    const token = this.jwt.sign({ sub: user.id, email: user.email, role: user.role })

    return {
      access_token: token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        serviceId: user.serviceId,
        isActive: user.isActive,
      },
    }
  }

  async activate(dto: ActivateDto) {
    const user = await this.prisma.user.findUnique({
      where: { activationToken: dto.token },
    })

    if (!user) throw new NotFoundException('Token invalide')
    if (user.isActive) throw new BadRequestException('Compte déjà activé')

    const expired =
      user.activationTokenExpiresAt && user.activationTokenExpiresAt < new Date()
    if (expired) throw new BadRequestException('Token expiré')

    const passwordHash = await bcrypt.hash(dto.password, 10)

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        isActive: true,
        activationToken: null,
        activationTokenExpiresAt: null,
      },
    })

    return { message: 'Compte activé avec succès' }
  }
}
