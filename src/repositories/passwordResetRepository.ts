import { prisma } from './prisma';

export const passwordResetRepository = {
  create: (userId: string, token: string, expiresAt: Date) =>
    prisma.passwordResetToken.create({ data: { userId, token, expiresAt } }),
  findByToken: (token: string) =>
    prisma.passwordResetToken.findUnique({ where: { token }, include: { user: true } }),
  markAsUsed: (token: string) =>
    prisma.passwordResetToken.update({ where: { token }, data: { used: true } }),
  deleteByUserId: (userId: string) =>
    prisma.passwordResetToken.deleteMany({ where: { userId } })
};
