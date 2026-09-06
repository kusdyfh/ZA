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
    ],
  },
};

export default nextConfig;
