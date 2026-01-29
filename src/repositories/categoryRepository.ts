import { prisma } from './prisma';
import { CategoryStatus, Prisma } from '@prisma/client';

export const categoryRepository = {
  list: (status?: CategoryStatus) => {
    const where: Prisma.CategoryWhereInput = {};
    if (status) where.status = status;
    return prisma.category.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: { parent: true }
    });
  },
  findById: (id: string) =>
    prisma.category.findUnique({
      where: { id },
      include: { parent: true, children: true }
    }),
  findBySlug: (slug: string) =>
    prisma.category.findUnique({
      where: { slug },
      include: { parent: true, children: true }
    }),
  findByParent: (parentId: string | null) => {
    const where: Prisma.CategoryWhereInput =
      parentId === null ? { parentId: null } : { parentId };
    return prisma.category.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: { parent: true }
    });
  },
  create: (data: Prisma.CategoryCreateInput) =>
    prisma.category.create({ data, include: { parent: true } }),
  update: (id: string, data: Prisma.CategoryUpdateInput) =>
    prisma.category.update({
      where: { id },
      data,
      include: { parent: true, children: true }
    }),
  remove: (id: string) => prisma.category.delete({ where: { id } }),
  hasChildren: async (id: string) => {
    const count = await prisma.category.count({ where: { parentId: id } });
    return count > 0;
  }
};
