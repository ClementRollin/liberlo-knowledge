import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import {
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';

const PASSWORD = 'Liberlo2026!';
// Low rounds for test speed
const HASH = bcrypt.hashSync(PASSWORD, 1);

const SERVICE = { id: 'svc-it', name: 'IT', slug: 'it' };

const activeUser = {
  id: 'user-1',
  email: 'alex@liberlo.com',
  passwordHash: HASH,
  role: 'COLLABORATOR' as const,
  serviceId: 'svc-it',
  isActive: true,
  activationToken: null,
  activationTokenExpiresAt: null,
  service: SERVICE,
  createdAt: new Date(),
};

describe('AuthService', () => {
  let service: AuthService;
  let mockPrisma: jest.Mocked<Pick<PrismaService, 'user'>>;
  let mockJwt: jest.Mocked<JwtService>;

  beforeEach(() => {
    mockPrisma = {
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    } as any;
    mockJwt = { sign: jest.fn().mockReturnValue('mock.jwt.token') } as any;
    service = new AuthService(
      mockPrisma as unknown as PrismaService,
      mockJwt as unknown as JwtService,
    );
  });

  describe('login', () => {
    it('should return access_token and user on valid credentials', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(activeUser);

      const result = await service.login({ email: activeUser.email, password: PASSWORD });

      expect(result.access_token).toBe('mock.jwt.token');
      expect(result.user.id).toBe('user-1');
      expect(result.user.role).toBe('COLLABORATOR');
    });

    it('should include service info when user belongs to a service', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(activeUser);

      const result = await service.login({ email: activeUser.email, password: PASSWORD });

      expect(result.user.service).toEqual(SERVICE);
    });

    it('should return null service for users without service', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
        ...activeUser,
        serviceId: null,
        service: null,
      });

      const result = await service.login({ email: activeUser.email, password: PASSWORD });

      expect(result.user.service).toBeNull();
    });

    it('should throw UnauthorizedException when user is not found', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.login({ email: 'nobody@liberlo.com', password: PASSWORD }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when user account is inactive', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
        ...activeUser,
        isActive: false,
      });

      await expect(
        service.login({ email: activeUser.email, password: PASSWORD }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException on wrong password', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(activeUser);

      await expect(
        service.login({ email: activeUser.email, password: 'wrongpassword' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should sign JWT with correct payload', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(activeUser);

      await service.login({ email: activeUser.email, password: PASSWORD });

      expect(mockJwt.sign).toHaveBeenCalledWith({
        sub: activeUser.id,
        email: activeUser.email,
        role: activeUser.role,
      });
    });
  });

  describe('activate', () => {
    const pendingUser = {
      ...activeUser,
      isActive: false,
      activationToken: 'uuid-token-123',
      activationTokenExpiresAt: new Date(Date.now() + 3_600_000),
    };

    it('should activate an account and return success message', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(pendingUser);
      (mockPrisma.user.update as jest.Mock).mockResolvedValue({ ...pendingUser, isActive: true });

      const result = await service.activate({ token: pendingUser.activationToken!, password: 'NewPass1!' });

      expect(result.message).toBe('Compte activé avec succès');
      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: pendingUser.id },
          data: expect.objectContaining({ isActive: true }),
        }),
      );
    });

    it('should clear the activation token after activation', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(pendingUser);
      (mockPrisma.user.update as jest.Mock).mockResolvedValue({});

      await service.activate({ token: pendingUser.activationToken!, password: 'NewPass1!' });

      const updateCall = (mockPrisma.user.update as jest.Mock).mock.calls[0][0];
      expect(updateCall.data.activationToken).toBeNull();
      expect(updateCall.data.activationTokenExpiresAt).toBeNull();
    });

    it('should throw NotFoundException for unknown token', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.activate({ token: 'bad-token', password: 'Pass1!' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when account is already active', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(activeUser);

      await expect(
        service.activate({ token: 'some-token', password: 'Pass1!' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when token is expired', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
        ...pendingUser,
        activationTokenExpiresAt: new Date(Date.now() - 1),
      });

      await expect(
        service.activate({ token: pendingUser.activationToken!, password: 'Pass1!' }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
