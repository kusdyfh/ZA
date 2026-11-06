import { useQuery } from '@tanstack/react-query';
import {
  apiFetch,
  apiFetchPaginated,
  buildQueryString,
} from '@/lib/api/client';
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
  /** Matches products curated into this homepage section (admin-controlled) — see ProductPlacement. */
  placement?: string;
  priceMin?: number;
  priceMax?: number;
}

/** All public catalog reads (ADR 0021) — never an admin-guarded endpoint (ADR 0022 rule). */
export function productsQueryOptions(params: ProductListParams = {}) {
  return {
    queryKey: [PRODUCTS_KEY, params],
    queryFn: () =>
      apiFetchPaginated<Product>(
        `/catalog/storefront/products${buildQueryString(params)}`,
      ),
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

/**
 * One of the homepage's named, admin-curated sections (Home Hero, Art /
 * Story Wall, 10 Products Showcase, The Book/ZA Edit, Doll Dress-Up) —
 * each queries its own `placement` independently, so curating a product
 * into one never pulls it into another. `limit` just caps the request;
 * each section still decides locally how many of the results it uses.
 */
export function productsByPlacementQueryOptions(placement: string, limit = 10) {
  return {
    queryKey: [PRODUCTS_KEY, 'placement', placement, limit],
    queryFn: async () => {
      const result = await apiFetchPaginated<Product>(
        `/catalog/storefront/products${buildQueryString({ placement, limit })}`,
      );
      return result.data;
    },
  };
}

export function useProductsByPlacementQuery(placement: string, limit = 10) {
  return useQuery(productsByPlacementQueryOptions(placement, limit));
}

export function productBySlugQueryOptions(slug: string) {
  return {
    queryKey: [PRODUCTS_KEY, 'slug', slug],
    queryFn: () =>
      apiFetch<Product>(`/catalog/storefront/products/${slug}`, {
        auth: false,
      }),
  };
}

export function useProductBySlugQuery(slug: string) {
  return useQuery({
    ...productBySlugQueryOptions(slug),
    enabled: Boolean(slug),
  });
}

export function productDetailQueryOptions(slug: string) {
  return {
    queryKey: [PRODUCTS_KEY, 'detail', slug],
    queryFn: () =>
      apiFetch<PublicProductDetail>(
        `/catalog/storefront/products/${slug}/detail`,
        { auth: false },
      ),
  };
}

export function useProductDetailQuery(slug: string) {
  return useQuery({
    ...productDetailQueryOptions(slug),
    enabled: Boolean(slug),
  });
}

export function useProductVariantsQuery(productId: string) {
  return useQuery({
    queryKey: [PRODUCTS_KEY, productId, 'variants'],
    queryFn: () =>
      apiFetch<ProductVariant[]>(
        `/catalog/storefront/products/${productId}/variants`,
        { auth: false },
      ),
    enabled: Boolean(productId),
  });
}
