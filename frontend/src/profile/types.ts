import type { Listing, ServiceType, UserRole } from '../types';

export type ProfileUser = {
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  avatarUrl?: string | null;
};

export type ProfileListing = Listing & {
  providerId?: number;
  status?: 'approved' | 'pending' | 'rejected';
  serviceType?: ServiceType;
  createdAt?: string;
};

export type ListingEdit = {
  title: string;
  description: string;
  basePrice: number;
  guestCapacity?: number;
};
