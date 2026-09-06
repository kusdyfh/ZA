import type { Slug } from '../value-objects/slug.vo';
import type { SeoMetadata } from '../value-objects/seo-metadata.vo';
import { InvalidDateRangeError, InvalidNameError } from '../errors/catalog.errors';

export interface CollectionProps {
  id: string;
  storeId: string;
  name: string;
  slug: Slug;
  description: string | null;
  isActive: boolean;
  startsAt: Date | null;
  endsAt: Date | null;
  seo: SeoMetadata;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Curated, cross-category merchandising groups — see
 * docs/product/05-COLLECTIONS.md. `isCurrentlyLive()` is the entity's own
 * computed rule (deactivated flag + schedule window) since it only needs
 * the entity's own fields; "excludes archived products" is a separate,
 * read-time filter applied by the use-case that lists a collection's
 * products (it needs each Product's status, which this entity doesn't
 * hold).
 */
export class Collection {
  private constructor(private props: CollectionProps) {}

  static reconstitute(props: CollectionProps): Collection {
    return new Collection(props);
  }

  static validateName(name: string): string {
    const trimmed = name.trim();
    if (!trimmed) {
      throw new InvalidNameError('Collection');
    }
    return trimmed;
  }

  static validateSchedule(startsAt: Date | null, endsAt: Date | null): void {
    if (startsAt && endsAt && endsAt <= startsAt) {
      throw new InvalidDateRangeError();
    }
  }

  rename(name: string): void {
    this.props.name = Collection.validateName(name);
  }

  changeSlug(slug: Slug): void {
    this.props.slug = slug;
  }

  updateDescription(description: string | null): void {
    this.props.description = description;
  }

  updateSeo(seo: SeoMetadata): void {
    this.props.seo = seo;
  }

  schedule(startsAt: Date | null, endsAt: Date | null): void {
    Collection.validateSchedule(startsAt, endsAt);
    this.props.startsAt = startsAt;
    this.props.endsAt = endsAt;
  }

  activate(): void {
    this.props.isActive = true;
  }

  deactivate(): void {
    this.props.isActive = false;
  }

  isCurrentlyLive(now: Date = new Date()): boolean {
    if (!this.props.isActive) {
      return false;
    }
    if (this.props.startsAt && now < this.props.startsAt) {
      return false;
    }
    if (this.props.endsAt && now > this.props.endsAt) {
      return false;
    }
    return true;
  }

  get id(): string {
    return this.props.id;
  }

  get storeId(): string {
    return this.props.storeId;
  }

  get name(): string {
    return this.props.name;
  }

  get slug(): Slug {
    return this.props.slug;
  }

  get description(): string | null {
    return this.props.description;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get startsAt(): Date | null {
    return this.props.startsAt;
  }

  get endsAt(): Date | null {
    return this.props.endsAt;
  }

  get seo(): SeoMetadata {
    return this.props.seo;
  }

  toProps(): CollectionProps {
    return { ...this.props };
  }
}
