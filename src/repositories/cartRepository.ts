import { prisma } from './prisma';

export const cartRepository = {
  findByUserId: (userId: string) =>
    prisma.cart.findFirst({ where: { userId }, include: { items: true } }),
  findByGuestId: (guestId: string) =>
    prisma.cart.findFirst({ where: { guestId }, include: { items: true } }),
  create: (data: { userId?: string; guestId?: string }) =>
    prisma.cart.create({ data, include: { items: true } }),
  addItem: (cartId: string, productId: string, quantity: number) =>
    prisma.cartItem.upsert({
      where: { cartId_productId: { cartId, productId } },
      update: { quantity: { increment: quantity } },
      create: { cartId, productId, quantity }
    }),
  updateItem: (cartId: string, productId: string, quantity: number) =>
    prisma.cartItem.update({
      where: { cartId_productId: { cartId, productId } },
      data: { quantity }
    }),
  removeItem: (cartId: string, productId: string) =>
    prisma.cartItem.delete({ where: { cartId_productId: { cartId, productId } } }),
  findById: (cartId: string) =>
    prisma.cart.findUnique({ where: { id: cartId }, include: { items: true } })
};
