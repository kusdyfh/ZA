import type { Slug } from '../value-objects/slug.vo';
import type { SeoMetadata } from '../value-objects/seo-metadata.vo';
import { InvalidNameError } from '../errors/catalog.errors';

export interface CategoryProps {
  id: string;
  storeId: string;
  name: string;
  slug: Slug;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  parentId: string | null;
  seo: SeoMetadata;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * The structural browse tree, up to 3 levels deep — see
 * docs/product/04-CATEGORIES.md. Depth/cycle validation lives in
 * `CategoryHierarchyPolicy` (needs the ancestor chain, which only the
 * use-case can load via the repository) — this entity only holds and
 * mutates its own fields.
 */
export class Category {
  private constructor(private props: CategoryProps) {}

  static reconstitute(props: CategoryProps): Category {
    return new Category(props);
  }

  static validateName(name: string): string {
    const trimmed = name.trim();
    if (!trimmed) {
      throw new InvalidNameError('Category');
    }
    return trimmed;
  }

  rename(name: string): void {
    this.props.name = Category.validateName(name);
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

  reorder(sortOrder: number): void {
    this.props.sortOrder = sortOrder;
  }

  reparent(parentId: string | null): void {
    this.props.parentId = parentId;
  }

  activate(): void {
    this.props.isActive = true;
  }

  deactivate(): void {
    this.props.isActive = false;
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

  get sortOrder(): number {
    return this.props.sortOrder;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get parentId(): string | null {
    return this.props.parentId;
  }

  get seo(): SeoMetadata {
    return this.props.seo;
  }

  toProps(): CategoryProps {
    return { ...this.props };
  }
}
