import { injectable } from 'inversify';
import container from '../../config/ioc.config';
import { TYPES_COMMON } from '../../config/ioc.types';
import { PrismaService } from '../../services/prisma.service';
import { Role, User, UserRoleMapping } from '../../prisma/generated/prisma/client';

type UserWithRoles = User & { userRoles: (UserRoleMapping & { role: Role })[] };

@injectable()
export class AuthRepository {
  constructor(private prisma = container.get<PrismaService>(TYPES_COMMON.PrismaService)) {}

  async findByUsername(username: string): Promise<UserWithRoles | null> {
    return this.prisma.user.findUnique({
      where: { username },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  async findByEmail(email: string): Promise<UserWithRoles | null> {
    return this.prisma.user.findUnique({
      where: { email },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  async findByIdWithRoles(userId: string): Promise<UserWithRoles | null> {
    return this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  async findRoleByName(name: string): Promise<Role | null> {
    return this.prisma.role.findUnique({
      where: { name },
    });
  }

  async createUser(username: string, email: string, password: string, roleId: string): Promise<UserWithRoles> {
    return this.prisma.user.create({
      data: {
        username,
        email,
        password,
        userRoles: {
          create: {
            roleId,
          },
        },
      },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });
  }
}
