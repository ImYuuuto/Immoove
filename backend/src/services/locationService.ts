import { prisma } from "../config/db.js";

export class LocationService {
  static async getAll() {
    return prisma.location.findMany({
      orderBy: { cityName: "asc" },
    });
  }

  static async create(data: { cityName: string; country: string; latitude?: number; longitude?: number }) {
    return prisma.location.create({ data });
  }

  static async update(locationId: number, data: { cityName?: string; country?: string }) {
    return prisma.location.update({ where: { locationId }, data });
  }

  static async delete(locationId: number) {
    return prisma.location.delete({ where: { locationId } });
  }
}
