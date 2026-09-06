import { SeoMetadata } from './seo-metadata.vo';

describe('SeoMetadata', () => {
  it('trims provided text fields', () => {
    const seo = SeoMetadata.create({ metaTitle: '  Title  ', metaDescription: '  Desc  ' });
    expect(seo.metaTitle).toBe('Title');
    expect(seo.metaDescription).toBe('Desc');
  });

  it('normalizes an empty or whitespace-only string to null', () => {
    const seo = SeoMetadata.create({ metaTitle: '   ', metaDescription: '' });
    expect(seo.metaTitle).toBeNull();
    expect(seo.metaDescription).toBeNull();
  });

  it('normalizes undefined/missing fields to null', () => {
    const seo = SeoMetadata.create({});
    expect(seo.metaTitle).toBeNull();
    expect(seo.metaDescription).toBeNull();
    expect(seo.ogImageUrl).toBeNull();
  });

  it('holds an ogImageUrl when provided', () => {
    const seo = SeoMetadata.create({ ogImageUrl: 'https://example.com/image.jpg' });
    expect(seo.ogImageUrl).toBe('https://example.com/image.jpg');
  });
});
