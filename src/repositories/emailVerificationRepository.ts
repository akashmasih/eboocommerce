import { prisma } from './prisma';

export const emailVerificationRepository = {
  create: (userId: string, token: string, expiresAt: Date) =>
    prisma.emailVerificationToken.create({ data: { userId, token, expiresAt } }),
  findByToken: (token: string) =>
    prisma.emailVerificationToken.findUnique({ where: { token }, include: { user: true } }),
  markAsUsed: (token: string) =>
    prisma.emailVerificationToken.update({ where: { token }, data: { used: true } }),
  deleteByUserId: (userId: string) =>
    prisma.emailVerificationToken.deleteMany({ where: { userId } })
};
