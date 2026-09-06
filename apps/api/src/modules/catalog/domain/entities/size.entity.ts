import { InvalidNameError } from '../errors/catalog.errors';

export interface SizeProps {
  id: string;
  storeId: string;
  label: string;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export class Size {
  private constructor(private props: SizeProps) {}

  static reconstitute(props: SizeProps): Size {
    return new Size(props);
  }

  static validateLabel(label: string): string {
    const trimmed = label.trim();
    if (!trimmed) {
      throw new InvalidNameError('Size');
    }
    return trimmed;
  }

  relabel(label: string): void {
    this.props.label = Size.validateLabel(label);
  }

  reorder(sortOrder: number): void {
    this.props.sortOrder = sortOrder;
  }

  get id(): string {
    return this.props.id;
  }

  get storeId(): string {
    return this.props.storeId;
  }

  get label(): string {
    return this.props.label;
  }

  get sortOrder(): number {
    return this.props.sortOrder;
  }

  toProps(): SizeProps {
    return { ...this.props };
  }
}
