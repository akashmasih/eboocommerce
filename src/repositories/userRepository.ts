import { prisma } from './prisma';

export const userRepository = {
  createUser: (email: string, passwordHash: string, role: 'ADMIN' | 'SELLER' | 'CUSTOMER') =>
    prisma.user.create({ data: { email, passwordHash, role } }),
  findByEmail: (email: string) => prisma.user.findUnique({ where: { email } }),
  findById: (id: string) => prisma.user.findUnique({ where: { id } }),
  updatePassword: (id: string, passwordHash: string) =>
    prisma.user.update({ where: { id }, data: { passwordHash } }),
  verifyEmail: (id: string) =>
    prisma.user.update({
      where: { id },
      data: { emailVerified: true, emailVerifiedAt: new Date() }
    })
};
