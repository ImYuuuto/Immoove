import type { User } from "@prisma/client";

export type PublicUser = Pick<
  User,
  "userId" | "firstName" | "lastName" | "email" | "role" | "createdAt"
>;

export function toPublicUser(user: User): PublicUser {
  return {
    userId: user.userId,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
  };
}
