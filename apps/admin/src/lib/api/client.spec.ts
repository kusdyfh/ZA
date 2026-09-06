import { buildQueryString } from './client';

describe('buildQueryString', () => {
  it('returns an empty string for no params', () => {
    expect(buildQueryString({})).toBe('');
  });

  it('omits undefined, null, and empty-string values', () => {
    expect(buildQueryString({ a: undefined, b: null, c: '', d: 'kept' })).toBe('?d=kept');
  });

  it('serializes numbers and booleans', () => {
    const query = buildQueryString({ page: 2, isFeatured: true });
    expect(query).toContain('page=2');
    expect(query).toContain('isFeatured=true');
  });

  it('prefixes with a single leading question mark', () => {
    const query = buildQueryString({ search: 'shirt', status: 'ACTIVE' });
    expect(query.startsWith('?')).toBe(true);
    expect(query.indexOf('?')).toBe(query.lastIndexOf('?'));
  });
});
