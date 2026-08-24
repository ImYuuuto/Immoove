import type { Listing, ServiceType } from '../types';

export type ProfileUser = {
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
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
