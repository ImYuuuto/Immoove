import { prisma } from "../config/db.js";

export class LocationService {
  static async getAll() {
    return prisma.location.findMany({
      orderBy: { cityName: "asc" },
    });
  }
}
