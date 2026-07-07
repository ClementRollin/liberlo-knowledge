import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';

describe('UsersService', () => {
  let service: UsersService;
  let mockPrisma: {
    user: {
      findUnique: jest.Mock;
      create: jest.Mock;
      findMany: jest.Mock;
      update: jest.Mock;
    };
  };

  beforeEach(async () => {
    mockPrisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  describe('createUser', () => {
    it('should throw ConflictException when email already exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'existing' });

      await expect(
        service.createUser({ email: 'exists@liberlo.com', role: Role.COLLABORATOR }),
      ).rejects.toThrow(ConflictException);
    });

    it('should create user and return a 16-character generated password', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        id: 'new-id',
        email: 'nouveau@liberlo.com',
        role: Role.COLLABORATOR,
        serviceId: null,
        isActive: true,
        createdAt: new Date(),
      });

      const result = await service.createUser({
        email: 'nouveau@liberlo.com',
        role: Role.COLLABORATOR,
      });

      expect(result.email).toBe('nouveau@liberlo.com');
      expect(result.generatedPassword).toHaveLength(16);
      expect(result.isActive).toBe(true);
      expect(mockPrisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: 'nouveau@liberlo.com',
            isActive: true,
          }),
        }),
      );
    });

    it('should pass serviceId to prisma when provided', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        id: 'new-id',
        email: 'resp@liberlo.com',
        role: Role.RESPONSABLE,
        serviceId: 'svc-1',
        isActive: true,
        createdAt: new Date(),
      });

      await service.createUser({
        email: 'resp@liberlo.com',
        role: Role.RESPONSABLE,
        serviceId: 'svc-1',
      });

      expect(mockPrisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ serviceId: 'svc-1' }),
        }),
      );
    });
  });

  describe('deactivateUser', () => {
    it('should throw NotFoundException when user does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.deactivateUser('unknown-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should set isActive to false', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'abc' });
      mockPrisma.user.update.mockResolvedValue({
        id: 'abc',
        email: 'test@liberlo.com',
        isActive: false,
      });

      const result = await service.deactivateUser('abc');

      expect(result.isActive).toBe(false);
      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { isActive: false } }),
      );
    });
  });
});
