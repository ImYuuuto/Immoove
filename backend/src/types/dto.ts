import { ListingStatus } from './db';
export interface GetListingsParams {
  page: number;
  limit: number;
  categoryId?: number;
  locationId?: number;
  areaId?: number;
  propertyTypeId?: number;
  providerId?: number;
  search?: string;
  slug?: string;
  status?: ListingStatus;
  featured?: boolean;
  publicOnly?: boolean;
}
export type ServiceType = 'VACATION_RENTAL' | 'CAR_RENTAL' | 'RESTAURANT_CAFE' | 'ACTIVITY';
export type UserRole = 'CLIENT' | 'OWNER' | 'ADMIN';
export interface ListingSearchParams {
  checkIn?: Date;
  checkOut?: Date;
  guests?: number;
  minPrice?: number;
  maxPrice?: number;
  serviceType?: ServiceType;
  regionId?: number;
  cityId?: number;
  areaId?: number;
  propertyType?: string;
  bedrooms?: number;
  bathrooms?: number;
  amenityIds?: number[];
  minRating?: number;
  instantAvailable?: boolean;
  page: number;
  limit: number;
}
export interface CreateListingDto {
  providerId?: number;
  categoryId: number;
  locationId?: number;
  areaId?: number;
  propertyTypeId?: number;
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
  bedrooms?: number;
  bathrooms?: number;
}
export type UpdateListingDto = Partial<Omit<CreateListingDto, 'providerId'>>;
