import { prisma } from './prisma';

export const tokenRepository = {
  createRefreshToken: (userId: string, token: string, expiresAt: Date) =>
    prisma.refreshToken.create({ data: { userId, token, expiresAt } }),
  findRefreshToken: (token: string) => prisma.refreshToken.findUnique({ where: { token } }),
  deleteRefreshToken: (token: string) => prisma.refreshToken.delete({ where: { token } })
};
