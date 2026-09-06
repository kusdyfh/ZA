'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';

/**
 * Shop/search/filter/sort state lives in the URL, not component state
 * — filtered results must be shareable/bookmarkable/back-button-safe.
 * Every value here maps directly onto `ProductListParams` (ADR 0021).
 */
export function useShopFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function getString(key: string): string | undefined {
    return searchParams.get(key) ?? undefined;
  }

  function getNumber(key: string): number | undefined {
    const value = searchParams.get(key);
    return value ? Number(value) : undefined;
  }

  function getBoolean(key: string): boolean | undefined {
    return searchParams.get(key) === 'true' ? true : undefined;
  }

  function setParams(updates: Record<string, string | undefined>, resetPage = true) {
    const next = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value === undefined || value === '') {
        next.delete(key);
      } else {
        next.set(key, value);
      }
    }
    if (resetPage) {
      next.delete('page');
    }
    router.push(`${pathname}?${next.toString()}`);
  }

  return {
    search: getString('search') ?? '',
    categoryId: getString('categoryId'),
    brandId: getString('brandId'),
    colorId: getString('colorId'),
    sizeId: getString('sizeId'),
    isFeatured: getBoolean('isFeatured'),
    isBestSeller: getBoolean('isBestSeller'),
    isNewArrival: getBoolean('isNewArrival'),
    priceMin: getNumber('priceMin'),
    priceMax: getNumber('priceMax'),
    sort: getString('sort'),
    page: getNumber('page') ?? 1,
    setParams,
  };
}
