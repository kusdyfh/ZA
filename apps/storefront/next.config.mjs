// Product photos uploaded via the admin's drag-and-drop media feature are
// served straight off the API at `/uploads/products/...` (apps/api/src/main.ts's
// `useStaticAssets`), so next/image needs that same origin allow-listed —
// otherwise it throws "Invalid src prop ... hostname is not configured" and
// crashes the product detail page for every product with an uploaded photo.
// Derived from NEXT_PUBLIC_API_URL rather than hardcoded so it tracks
// whatever origin the API actually runs at (dev, staging, prod) automatically.
function apiOriginRemotePattern() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) return null;
  const { protocol, hostname, port } = new URL(apiUrl);
  return {
    protocol: protocol.replace(':', ''),
    hostname,
    ...(port ? { port } : {}),
    pathname: '/uploads/**',
  };
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // @za/ui ships raw TSX (no build step) so its 'use client' directives
  // are compiled by Next's own SWC pipeline, not pre-processed by tsc
  // (which inserts a "use strict" prologue before 'use client', breaking
  // Next's directive detection — see the Epic 1 compliance report).
  transpilePackages: ['@za/ui'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      // Dev/seed data placeholder domain (apps/api/prisma/seed.ts) — the
      // bytes don't actually resolve, but next/image still needs the
      // host allow-listed or it refuses to render the <Image> at all
      // (ADR 0022 §8).
      {
        protocol: 'https',
        hostname: 'images.za-store.local',
      },
      ...(apiOriginRemotePattern() ? [apiOriginRemotePattern()] : []),
    ],
  },
};

export default nextConfig;
