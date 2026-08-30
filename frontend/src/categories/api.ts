import { request } from '../utils/request';
import type {
  Category,
  CategoryListingsResponse,
  PropertyDiscoveryOptions,
  PropertySearchResponse,
} from './types';

export async function getCategories() {
  const result = await request<Category[] | { items: Category[] }>('/categories');
  return Array.isArray(result) ? result : result.items;
}

export function getCategoryListings(slug: string, page: number, limit = 20) {
  return request<CategoryListingsResponse>(
    `/categories/${encodeURIComponent(slug)}/listings?page=${page}&limit=${limit}`,
  );
}

export function getPropertyDiscoveryOptions() {
  return request<PropertyDiscoveryOptions>('/property-discovery/options');
}

export function searchProperties(params: URLSearchParams) {
  return request<PropertySearchResponse>(`/listings/search?${params.toString()}`);
}
