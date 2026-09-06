import { useQuery } from '@tanstack/react-query';
import { apiFetch, apiFetchPaginated, buildQueryString } from '@/lib/api/client';
import type { ListParams } from '@/lib/api/list-params';
import type { Product, ProductVariant, PublicProductDetail } from './types';

const PRODUCTS_KEY = 'products';

export interface ProductListParams extends ListParams {
  categoryId?: string;
  brandId?: string;
  colorId?: string;
  sizeId?: string;
  isFeatured?: boolean;
  isBestSeller?: boolean;
  isNewArrival?: boolean;
  priceMin?: number;
  priceMax?: number;
}

/** All public catalog reads (ADR 0021) — never an admin-guarded endpoint (ADR 0022 rule). */
export function productsQueryOptions(params: ProductListParams = {}) {
  return {
    queryKey: [PRODUCTS_KEY, params],
    queryFn: () => apiFetchPaginated<Product>(`/catalog/storefront/products${buildQueryString(params)}`),
  };
}

export function useProductsQuery(params: ProductListParams = {}) {
  return useQuery(productsQueryOptions(params));
}

export function featuredProductsQueryOptions() {
  return {
    queryKey: [PRODUCTS_KEY, 'featured'],
    queryFn: () => apiFetch<Product[]>('/catalog/storefront/featured-products'),
  };
}

export function useFeaturedProductsQuery() {
  return useQuery(featuredProductsQueryOptions());
}

export function bestSellersQueryOptions() {
  return {
    queryKey: [PRODUCTS_KEY, 'best-sellers'],
    queryFn: () => apiFetch<Product[]>('/catalog/storefront/best-sellers'),
  };
}

export function useBestSellersQuery() {
  return useQuery(bestSellersQueryOptions());
}

export function newArrivalsQueryOptions() {
  return {
    queryKey: [PRODUCTS_KEY, 'new-arrivals'],
    queryFn: () => apiFetch<Product[]>('/catalog/storefront/new-arrivals'),
  };
}

export function useNewArrivalsQuery() {
  return useQuery(newArrivalsQueryOptions());
}

export function productBySlugQueryOptions(slug: string) {
  return {
    queryKey: [PRODUCTS_KEY, 'slug', slug],
    queryFn: () => apiFetch<Product>(`/catalog/storefront/products/${slug}`, { auth: false }),
  };
}

export function useProductBySlugQuery(slug: string) {
  return useQuery({ ...productBySlugQueryOptions(slug), enabled: Boolean(slug) });
}

export function productDetailQueryOptions(slug: string) {
  return {
    queryKey: [PRODUCTS_KEY, 'detail', slug],
    queryFn: () => apiFetch<PublicProductDetail>(`/catalog/storefront/products/${slug}/detail`, { auth: false }),
  };
}

export function useProductDetailQuery(slug: string) {
  return useQuery({ ...productDetailQueryOptions(slug), enabled: Boolean(slug) });
}

export function useProductVariantsQuery(productId: string) {
  return useQuery({
    queryKey: [PRODUCTS_KEY, productId, 'variants'],
    queryFn: () => apiFetch<ProductVariant[]>(`/catalog/storefront/products/${productId}/variants`, { auth: false }),
    enabled: Boolean(productId),
  });
}
