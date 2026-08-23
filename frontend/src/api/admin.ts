import { api } from "./client";
import type { AdminOverview, AuditLog, Booking, ContactMessage, User } from "../types";

export const AdminApi = {
  overview: () => api<AdminOverview>("/api/admin/overview"),
  reservations: (status?: string) =>
    api<Booking[]>(`/api/admin/reservations${status ? `?status=${status}` : ""}`),
  updateReservation: (id: number, status: string, reason?: string) =>
    api<Booking>(`/api/admin/reservations/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status, reason }),
    }),
  users: () => api<User[]>("/api/admin/users"),
  messages: () => api<ContactMessage[]>("/api/admin/messages"),
  markRead: (id: number) => api(`/api/admin/messages/${id}/read`, { method: "PATCH" }),
  audit: () => api<AuditLog[]>("/api/admin/audit"),
  createCategory: (body: Record<string, unknown>) =>
    api("/api/categories", { method: "POST", body: JSON.stringify(body) }),
  createLocation: (body: Record<string, unknown>) =>
    api("/api/locations", { method: "POST", body: JSON.stringify(body) }),
};
