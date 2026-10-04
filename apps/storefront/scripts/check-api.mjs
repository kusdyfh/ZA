// Runs before `next build`. The storefront prerenders CMS pages and the sitemap
// from the live API, so a build without a reachable API cannot succeed. This
// checks that up front and says exactly what is wrong, instead of surfacing as
// `TypeError: fetch failed / ECONNREFUSED` after the compile step.
//
// It never calls process.exit(): on Windows that can abort Node (libuv
// assertion) while fetch handles are still closing. It sets process.exitCode
// and lets the event loop drain instead.
import { createRequire } from 'node:module';

// Same .env precedence as `next build` (this script runs before Next loads them).
const nextRequire = createRequire(createRequire(import.meta.url).resolve('next/package.json'));
nextRequire('@next/env').loadEnvConfig(process.cwd(), false);

const RETRY_WINDOW_MS = 90_000;
const RETRY_DELAY_MS = 5_000;
const ATTEMPT_TIMEOUT_MS = 10_000;
// Public, DB-backed endpoint that sitemap.ts also depends on: proves routing, the response envelope and the database.
const PROBE_PATH = '/catalog/storefront/collections';

const apiUrl = process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/+$/, '');

function fail(lines) {
  console.error(`\n[api-preflight] FAILED\n${lines.map((line) => `  ${line}`).join('\n')}\n`);
  process.exitCode = 1;
}

async function probe() {
  const url = `${apiUrl}${PROBE_PATH}`;
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(ATTEMPT_TIMEOUT_MS) });
    const text = await response.text();
    if (!response.ok) {
      return { ok: false, reason: `HTTP ${response.status} from ${url} - ${text.slice(0, 160).replace(/\s+/g, ' ')}` };
    }
    let body;
    try {
      body = JSON.parse(text);
    } catch {
      return { ok: false, reason: `${url} answered HTTP ${response.status} but not with JSON - this is not the ZA API (wrong host, or missing /v1 in NEXT_PUBLIC_API_URL?)` };
    }
    if (body?.success !== true) {
      return { ok: false, reason: `${url} answered HTTP ${response.status} but not with the ZA success envelope` };
    }
    return { ok: true };
  } catch (error) {
    const cause = error?.cause?.code ?? error?.cause?.message ?? error?.name ?? String(error);
    return { ok: false, reason: `could not connect to ${url} (${cause})` };
  }
}

async function waitForApi() {
  const startedAt = Date.now();
  for (let attempt = 1; ; attempt += 1) {
    const result = await probe();
    if (result.ok) {
      return { ok: true, attempt, seconds: ((Date.now() - startedAt) / 1000).toFixed(1) };
    }
    if (Date.now() - startedAt + RETRY_DELAY_MS >= RETRY_WINDOW_MS) {
      return result;
    }
    console.warn(`[api-preflight] attempt ${attempt} failed: ${result.reason}; retrying in ${RETRY_DELAY_MS / 1000}s (API may be cold-starting)`);
    await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
  }
}

if (!apiUrl) {
  fail([
    'NEXT_PUBLIC_API_URL is not set.',
    'Set it to the public base URL of the ZA API including /v1, e.g. https://api.example.com/v1',
    '(see apps/storefront/.env.example).',
  ]);
} else {
  const outcome = await waitForApi();
  if (outcome.ok) {
    console.log(`[api-preflight] OK ${apiUrl}${PROBE_PATH} reachable (attempt ${outcome.attempt}, ${outcome.seconds}s)`);
  } else {
    fail([
      `The API at NEXT_PUBLIC_API_URL (${apiUrl}) is not usable from this build environment: ${outcome.reason}`,
      '',
      'The storefront prerenders /about, /faq, /privacy-policy, /terms-of-service and /sitemap.xml from this API at build time, so check:',
      '  1. The API is deployed and publicly reachable from where this build runs (not localhost).',
      '  2. NEXT_PUBLIC_API_URL is the API base INCLUDING the /v1 prefix, and is set for the build scope.',
      "  3. The API's database is up and migrated (the probe is a DB-backed endpoint).",
    ]);
  }
}
