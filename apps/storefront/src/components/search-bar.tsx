'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';

export function SearchBar({ className, onSubmitted }: { className?: string; onSubmitted?: () => void }) {
  const router = useRouter();
  const [query, setQuery] = useState('');

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = query.trim();
    router.push(trimmed ? `/shop?search=${encodeURIComponent(trimmed)}` : '/shop');
    onSubmitted?.();
  }

  return (
    <form onSubmit={onSubmit} role="search" className={className}>
      <label htmlFor="storefront-search" className="sr-only">
        Search products
      </label>
      <div className="relative">
        <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" aria-hidden="true" />
        <input
          id="storefront-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search products..."
          className="h-10 w-full rounded-full border border-neutral-300 bg-white ps-9 pe-4 text-sm text-neutral-900 placeholder:text-neutral-400 focus-visible:outline-none focus-visible:border-pink-500 focus-visible:shadow-focus dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
        />
      </div>
    </form>
  );
}
