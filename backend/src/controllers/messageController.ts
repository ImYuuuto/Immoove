import { Request, Response, NextFunction } from "express";
import { prisma } from "../config/db.js";

export class MessageController {
  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, email, phone, subject, body, listingId } = req.body;
      if (!name || !email || !body) {
        res.status(400).json({ error: "Le nom, l'email et le message sont requis" });
        return;
      }
      const message = await prisma.contactMessage.create({
        data: {
          name: String(name),
          email: String(email),
          phone: phone ? String(phone) : undefined,
          subject: subject ? String(subject) : undefined,
          body: String(body),
          listingId: listingId ? Number(listingId) : undefined,
          userId: req.userId,
        },
      });
      res.status(201).json(message);
    } catch (error) {
      next(error);
    }
  }

  static async mine(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const messages = await prisma.contactMessage.findMany({
        where: { userId: req.userId! },
        orderBy: { createdAt: "desc" },
        include: { listing: { select: { listingId: true, title: true } } },
      });
      res.json(messages);
    } catch (error) {
      next(error);
    }
  }
}
