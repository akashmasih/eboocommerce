import { prisma } from './prisma';

export const orderRepository = {
  create: (userId: string, items: { productId: string; quantity: number; price: number }[], total: number) =>
    prisma.order.create({
      data: { userId, total, items: { create: items } },
      include: { items: true }
    }),
  findById: (id: string) =>
    prisma.order.findUnique({ where: { id }, include: { items: true } }),
  findByUser: (userId: string) =>
    prisma.order.findMany({ where: { userId }, include: { items: true } }),
  updateStatus: (id: string, status: string) =>
    prisma.order.update({ where: { id }, data: { status: status as any } })
};
