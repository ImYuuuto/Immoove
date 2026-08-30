import { request } from '../utils/request';
import type { PropertyDiscoveryOptions, PropertySearchResponse } from './types';

export function getPropertyDiscoveryOptions() {
  return request<PropertyDiscoveryOptions>('/property-discovery/options');
}

export function searchProperties(params: URLSearchParams) {
  return request<PropertySearchResponse>(`/listings/search?${params.toString()}`);
}
