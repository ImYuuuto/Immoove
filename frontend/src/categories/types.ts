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
