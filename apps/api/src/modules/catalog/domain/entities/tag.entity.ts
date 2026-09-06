import type { Slug } from '../value-objects/slug.vo';
import { InvalidNameError } from '../errors/catalog.errors';

export interface TagProps {
  id: string;
  storeId: string;
  name: string;
  slug: Slug;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * No product spec document exists for Tag — kept intentionally minimal
 * (see schema.prisma's comment on the `Tag` model).
 */
export class Tag {
  private constructor(private props: TagProps) {}

  static reconstitute(props: TagProps): Tag {
    return new Tag(props);
  }

  static validateName(name: string): string {
    const trimmed = name.trim();
    if (!trimmed) {
      throw new InvalidNameError('Tag');
    }
    return trimmed;
  }

  rename(name: string): void {
    this.props.name = Tag.validateName(name);
  }

  changeSlug(slug: Slug): void {
    this.props.slug = slug;
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

  toProps(): TagProps {
    return { ...this.props };
  }
}
