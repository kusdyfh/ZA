const DEV_API_URL = 'http://localhost:4000/v1';
const DEV_SITE_URL = 'http://localhost:3000';
const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '[::1]', '0.0.0.0']);

export interface PublicConfigEnv {
  NEXT_PUBLIC_API_URL?: string;
  NEXT_PUBLIC_SITE_URL?: string;
  NODE_ENV?: string;
  NETLIFY?: string;
}

function parseHttpUrl(name: string, raw: string): URL {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error(
      `${name} is not a valid absolute URL: "${raw}". Expected something like https://example.com.`,
    );
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error(`${name} must be an http(s) URL, got "${raw}".`);
  }
  return url;
}

/**
 * The localhost fallbacks below exist only for `next dev` and tests. A
 * production build without these variables used to silently fall back to
 * localhost, which surfaced as an opaque `fetch failed / ECONNREFUSED` deep
 * in static generation — or, worse, as a deployed site whose browser calls
 * target the visitor's own machine. NEXT_PUBLIC_* values are inlined at build
 * time, so a missing value must fail the build, not the runtime.
 */
export function resolveApiBaseUrl(env: PublicConfigEnv): string {
  const raw = env.NEXT_PUBLIC_API_URL?.trim();

  if (!raw) {
    if (env.NODE_ENV === 'production') {
      throw new Error(
        'NEXT_PUBLIC_API_URL is not set for a production build. The storefront would fall back to ' +
          `${DEV_API_URL}, which cannot work once deployed. Set NEXT_PUBLIC_API_URL to the public base URL of ` +
          'the ZA API including its /v1 prefix (e.g. https://api.example.com/v1) in the build environment ' +
          '(Netlify: Site configuration > Environment variables, scope "Builds").',
      );
    }
    return DEV_API_URL;
  }

  const url = parseHttpUrl('NEXT_PUBLIC_API_URL', raw);

  if (env.NETLIFY === 'true') {
    if (LOCAL_HOSTNAMES.has(url.hostname)) {
      throw new Error(
        `NEXT_PUBLIC_API_URL points at "${url.hostname}" but this is a Netlify build. A deployed storefront ` +
          "cannot reach a local API; use the API's public https URL.",
      );
    }
    if (url.protocol !== 'https:') {
      throw new Error(
        `NEXT_PUBLIC_API_URL ("${raw}") must be https on Netlify: the site is served over https, so browsers ` +
          'block calls to an http API (mixed content).',
      );
    }
  }

  return raw.replace(/\/+$/, '');
}

/** Same rule as the API URL: canonical URLs, OG tags and the sitemap must never silently point at localhost in production. */
export function resolveSiteUrl(env: PublicConfigEnv): string {
  const raw = env.NEXT_PUBLIC_SITE_URL?.trim();

  if (!raw) {
    if (env.NODE_ENV === 'production') {
      throw new Error(
        'NEXT_PUBLIC_SITE_URL is not set for a production build. Canonical URLs, OpenGraph tags and sitemap.xml ' +
          `would point at ${DEV_SITE_URL}. Set it to the deployed origin (e.g. https://za-store.netlify.app).`,
      );
    }
    return DEV_SITE_URL;
  }

  parseHttpUrl('NEXT_PUBLIC_SITE_URL', raw);
  return raw.replace(/\/+$/, '');
}

// Each NEXT_PUBLIC_* reference must stay a literal `process.env.X` access so
// Next.js can inline it into the client bundle.
const env: PublicConfigEnv = {
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NODE_ENV: process.env.NODE_ENV,
  NETLIFY: process.env.NETLIFY,
};

export const API_BASE_URL = resolveApiBaseUrl(env);
export const SITE_URL = resolveSiteUrl(env);
