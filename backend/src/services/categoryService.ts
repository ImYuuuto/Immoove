import { prisma } from "../config/db.js";

export class CategoryService {
  static async getAll() {
    return prisma.serviceCategory.findMany({
      include: { features: true },
    });
  }

  static async getById(categoryId: number) {
    return prisma.serviceCategory.findUnique({
      where: { categoryId },
      include: { features: true },
    });
  }

  static async create(data: { name: string; slug: string; description?: string }) {
    return prisma.serviceCategory.create({ data });
  }

  static async update(categoryId: number, data: { name?: string; slug?: string; description?: string }) {
    return prisma.serviceCategory.update({ where: { categoryId }, data });
  }

  static async delete(categoryId: number) {
    return prisma.serviceCategory.delete({ where: { categoryId } });
  }
}