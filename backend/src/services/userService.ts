import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../config/db.js";
import type { User } from "@prisma/client";
import {
  validateRegistrationInput,
  type RegistrationInput,
} from "../utils/registrationValidation.js";
import { UserError } from "../errors/userError.js";

const JWT_SECRET = process.env.JWT_SECRET || "super_secret_key_change_me_in_production";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

type UserRole = "client" | "provider" | "admin";

export class UserService {
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  static async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  static generateToken(userId: number): string {
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);
  }

  static verifyToken(token: string): { userId: number } | null {
    try {
      return jwt.verify(token, JWT_SECRET) as { userId: number };
    } catch {
      return null;
    }
  }

  static async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } });
  }

  static async findByPhone(phone: string): Promise<User | null> {
    return prisma.user.findFirst({ where: { phone } });
  }

  static async findById(id: number): Promise<User | null> {
    return prisma.user.findUnique({ where: { userId: id } });
  }

  static async createUser(data: {
    firstName: string;
    lastName: string;
    email: string;
    passwordHash: string;
    phone?: string;
    role: UserRole;
  }): Promise<User> {
    return prisma.user.create({ data });
  }

  static async register(data: RegistrationInput): Promise<User> {
    const validated = validateRegistrationInput(data);

    const existingUser = await UserService.findByEmail(validated.email);
    if (existingUser) {
      throw new UserError("User with this email already exists", 409, {
        email: "An account with this email already exists",
      });
    }

    if (validated.phone) {
      const existingPhone = await UserService.findByPhone(validated.phone);
      if (existingPhone) {
        throw new UserError("User with this phone number already exists", 409, {
          phone: "An account with this phone number already exists",
        });
      }
    }

    const passwordHash = await UserService.hashPassword(validated.password);
    return UserService.createUser({
      firstName: validated.firstName,
      lastName: validated.lastName,
      email: validated.email,
      passwordHash,
      ...(validated.phone !== undefined && { phone: validated.phone }),
      role: validated.role,
    });
  }

  static async login(email: string, password: string): Promise<User> {
    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";

    if (!normalizedEmail || !password) {
      throw new UserError("Email and password are required", 400);
    }

    const user = await UserService.findByEmail(normalizedEmail);
    if (!user) {
      throw new UserError("Invalid email or password", 401);
    }

    const isPasswordValid = await UserService.comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UserError("Invalid email or password", 401);
    }

    return user;
  }

  static async getProfile(userId: number): Promise<User> {
    const user = await UserService.findById(userId);
    if (!user) {
      throw new UserError("User not found", 404);
    }
    return user;
  }
}
