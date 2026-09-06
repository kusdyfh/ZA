/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // @za/ui ships raw TSX (no build step) so its 'use client' directives
  // are compiled by Next's own SWC pipeline, not pre-processed by tsc
  // (which inserts a "use strict" prologue before 'use client', breaking
  // Next's directive detection — see the Epic 1 compliance report).
  transpilePackages: ['@za/ui'],
};

export default nextConfig;
