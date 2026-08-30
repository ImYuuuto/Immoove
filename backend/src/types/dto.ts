import { ListingStatus } from './db';
export interface GetListingsParams {
  page: number;
  limit: number;
  categoryId?: number;
  locationId?: number;
  providerId?: number;
  search?: string;
  slug?: string;
  status?: ListingStatus;
  featured?: boolean;
  publicOnly?: boolean;
}
export type ServiceType = 'VACATION_RENTAL' | 'CAR_RENTAL' | 'RESTAURANT_CAFE' | 'ACTIVITY';
export type UserRole = 'CLIENT' | 'OWNER' | 'ADMIN';
export interface ListingSearchParams { checkIn?: Date; checkOut?: Date; guests?: number; minPrice?: number; maxPrice?: number; serviceType?: ServiceType; page: number; limit: number; }
export interface CreateListingDto {
  providerId?: number;
  categoryId: number;
  locationId?: number;
  title: string;
  description?: string;
  basePrice: number;
  pricingUnit?: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  coverImageUrl?: string | null;
  imageUrls?: string[];
  featureIds?: number[];
  categoryIds?: number[];
  serviceType?: ServiceType;
  guestCapacity?: number;
}
export type UpdateListingDto = Partial<Omit<CreateListingDto, 'providerId'>>;
