import { api } from "./client";
import type { Booking, Category, Listing, Location, Pagination, User } from "../types";

export const AuthApi = {
  login: (email: string, password: string) =>
    api<User>("/api/users/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  register: (body: Record<string, unknown>) =>
    api<User>("/api/users/register", { method: "POST", body: JSON.stringify(body) }),
  logout: () => api("/api/users/logout", { method: "POST" }),
  profile: () => api<User>("/api/users/profile"),
};

export const CatalogApi = {
  categories: () => api<Category[]>("/api/categories"),
  locations: () => api<Location[]>("/api/locations"),
  listings: (params: Record<string, string | number | undefined> = {}) => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== "") q.set(k, String(v));
    });
    return api<{ items: Listing[]; pagination: Pagination }>(`/api/listings?${q}`);
  },
  listing: (id: number) => api<Listing>(`/api/listings/${id}`),
  propose: (body: Record<string, unknown>) =>
    api<Listing>("/api/listings", { method: "POST", body: JSON.stringify(body) }),
  update: (id: number, body: Record<string, unknown>) =>
    api<Listing>(`/api/listings/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  setStatus: (id: number, status: string, reason?: string) =>
    api<Listing>(`/api/listings/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status, reason }),
    }),
  remove: (id: number) => api(`/api/listings/${id}`, { method: "DELETE" }),
};

export const BookingApi = {
  mine: () => api<Booking[]>("/api/bookings"),
  create: (body: Record<string, unknown>) =>
    api<Booking>("/api/bookings", { method: "POST", body: JSON.stringify(body) }),
  cancel: (id: number) => api<Booking>(`/api/bookings/${id}/cancel`, { method: "PATCH" }),
};

export const SavedApi = {
  list: () => api<Listing[]>("/api/saved"),
  add: (id: number) => api(`/api/saved/${id}`, { method: "POST" }),
  remove: (id: number) => api(`/api/saved/${id}`, { method: "DELETE" }),
};

export const MessageApi = {
  send: (body: Record<string, unknown>) =>
    api("/api/messages", { method: "POST", body: JSON.stringify(body) }),
  mine: () => api("/api/messages/mine"),
};
