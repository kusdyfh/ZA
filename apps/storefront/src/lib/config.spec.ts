import { resolveApiBaseUrl, resolveSiteUrl } from './config';

describe('resolveApiBaseUrl', () => {
  it('falls back to the local API outside production', () => {
    expect(resolveApiBaseUrl({ NODE_ENV: 'development' })).toBe(
      'http://localhost:4000/v1',
    );
    expect(resolveApiBaseUrl({ NODE_ENV: 'test' })).toBe(
      'http://localhost:4000/v1',
    );
  });

  it('refuses to fall back to localhost in a production build', () => {
    expect(() => resolveApiBaseUrl({ NODE_ENV: 'production' })).toThrow(
      /NEXT_PUBLIC_API_URL is not set/,
    );
    expect(() =>
      resolveApiBaseUrl({ NODE_ENV: 'production', NEXT_PUBLIC_API_URL: '   ' }),
    ).toThrow(/NEXT_PUBLIC_API_URL is not set/);
  });

  it('returns the configured URL without a trailing slash', () => {
    expect(
      resolveApiBaseUrl({
        NODE_ENV: 'production',
        NEXT_PUBLIC_API_URL: 'https://api.za.test/v1/',
      }),
    ).toBe('https://api.za.test/v1');
  });

  it('rejects values that are not http(s) URLs', () => {
    expect(() =>
      resolveApiBaseUrl({ NEXT_PUBLIC_API_URL: 'api.za.test/v1' }),
    ).toThrow(/not a valid absolute URL/);
    expect(() =>
      resolveApiBaseUrl({ NEXT_PUBLIC_API_URL: 'ftp://api.za.test/v1' }),
    ).toThrow(/http\(s\)/);
  });

  it('still allows a localhost API for a production build on a developer machine', () => {
    expect(
      resolveApiBaseUrl({
        NODE_ENV: 'production',
        NEXT_PUBLIC_API_URL: 'http://localhost:4100/v1',
      }),
    ).toBe('http://localhost:4100/v1');
  });

  it('rejects a localhost API on Netlify', () => {
    expect(() =>
      resolveApiBaseUrl({
        NODE_ENV: 'production',
        NETLIFY: 'true',
        NEXT_PUBLIC_API_URL: 'http://localhost:4000/v1',
      }),
    ).toThrow(/Netlify build/);
    expect(() =>
      resolveApiBaseUrl({
        NODE_ENV: 'production',
        NETLIFY: 'true',
        NEXT_PUBLIC_API_URL: 'https://127.0.0.1/v1',
      }),
    ).toThrow(/Netlify build/);
  });

  it('rejects a non-https API on Netlify (mixed content)', () => {
    expect(() =>
      resolveApiBaseUrl({
        NODE_ENV: 'production',
        NETLIFY: 'true',
        NEXT_PUBLIC_API_URL: 'http://api.za.test/v1',
      }),
    ).toThrow(/must be https/);
  });

  it('accepts a public https API on Netlify', () => {
    expect(
      resolveApiBaseUrl({
        NODE_ENV: 'production',
        NETLIFY: 'true',
        NEXT_PUBLIC_API_URL: 'https://api.za.test/v1',
      }),
    ).toBe('https://api.za.test/v1');
  });
});

describe('resolveSiteUrl', () => {
  it('falls back to localhost outside production only', () => {
    expect(resolveSiteUrl({ NODE_ENV: 'development' })).toBe(
      'http://localhost:3000',
    );
    expect(() => resolveSiteUrl({ NODE_ENV: 'production' })).toThrow(
      /NEXT_PUBLIC_SITE_URL is not set/,
    );
  });

  it('returns the configured origin without a trailing slash and validates it', () => {
    expect(
      resolveSiteUrl({
        NODE_ENV: 'production',
        NEXT_PUBLIC_SITE_URL: 'https://za-store.test/',
      }),
    ).toBe('https://za-store.test');
    expect(() =>
      resolveSiteUrl({ NEXT_PUBLIC_SITE_URL: 'za-store.test' }),
    ).toThrow(/not a valid absolute URL/);
  });
});
