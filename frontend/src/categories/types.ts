import type { Listing } from '../types';

export type Category = {
  categoryId: number;
  name: string;
  slug: string;
  listingCount?: number;
};

export type CategoryListingsResponse = {
  category: Omit<Category, 'listingCount'>;
  items: Listing[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

export type PropertyDiscoveryOptions = {
  propertyTypes: Array<{ propertyTypeId: number; name: string; slug: string }>;
  regions: Array<{ regionId: number; name: string }>;
  cities: Array<{ cityId: number; regionId: number; name: string }>;
  areas: Array<{ areaId: number; cityId: number; name: string }>;
  amenities: Array<{ featureId: number; name: string }>;
};

export type PropertySearchResponse = {
  items: Listing[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
};
