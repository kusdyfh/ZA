import type { Slug } from '../value-objects/slug.vo';
import { InvalidNameError } from '../errors/catalog.errors';

export interface BrandProps {
  id: string;
  storeId: string;
  name: string;
  slug: Slug;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * No product spec document exists for Brand — kept intentionally minimal
 * (see schema.prisma's comment on the `Brand` model).
 */
export class Brand {
  private constructor(private props: BrandProps) {}

  static reconstitute(props: BrandProps): Brand {
    return new Brand(props);
  }

  static validateName(name: string): string {
    const trimmed = name.trim();
    if (!trimmed) {
      throw new InvalidNameError('Brand');
    }
    return trimmed;
  }

  rename(name: string): void {
    this.props.name = Brand.validateName(name);
  }

  changeSlug(slug: Slug): void {
    this.props.slug = slug;
  }

  updateDescription(description: string | null): void {
    this.props.description = description;
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

  toProps(): BrandProps {
    return { ...this.props };
  }
}
