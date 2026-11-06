export interface SeoMetadataProps {
  metaTitle: string | null;
  metaDescription: string | null;
  ogImageUrl: string | null;
}

export interface SeoMetadataInput {
  metaTitle?: string | null;
  metaDescription?: string | null;
  ogImageUrl?: string | null;
}

/**
 * Shared across Product/Category/Collection per docs/product/03-PRODUCTS.md
 * §SEO ("every product has a meta title and meta description... always
 * admin-overridable"). Auto-generated defaults (from name/description)
 * are computed by the calling use-case, not this VO — this VO only
 * normalizes and holds whatever was ultimately decided. `ogImageUrl`'s
 * "defaults to the primary product image" rule is enforced by
 * `SetProductMediaUseCase`, which keeps it synced to the cover image;
 * this VO just holds whatever value it's given.
 */
export class SeoMetadata {
  private constructor(private readonly props: SeoMetadataProps) {}

  static create(input: SeoMetadataInput): SeoMetadata {
    return new SeoMetadata({
      metaTitle: normalizeOptionalText(input.metaTitle),
      metaDescription: normalizeOptionalText(input.metaDescription),
      ogImageUrl: normalizeOptionalText(input.ogImageUrl),
    });
  }

  get metaTitle(): string | null {
    return this.props.metaTitle;
  }

  get metaDescription(): string | null {
    return this.props.metaDescription;
  }

  get ogImageUrl(): string | null {
    return this.props.ogImageUrl;
  }

  toProps(): SeoMetadataProps {
    return { ...this.props };
  }
}

function normalizeOptionalText(
  value: string | null | undefined,
): string | null {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}
