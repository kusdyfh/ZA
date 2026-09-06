import { InvalidNameError } from '../errors/inventory.errors';

export interface WarehouseProps {
  id: string;
  storeId: string;
  name: string;
  code: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/** Single warehouse today, extensible later — see docs/v2/adr/0014. */
export class Warehouse {
  private constructor(private props: WarehouseProps) {}

  static reconstitute(props: WarehouseProps): Warehouse {
    return new Warehouse(props);
  }

  static validateName(name: string): string {
    const trimmed = name.trim();
    if (!trimmed) {
      throw new InvalidNameError('Warehouse');
    }
    return trimmed;
  }

  static validateCode(code: string): string {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) {
      throw new InvalidNameError('Warehouse code');
    }
    return trimmed;
  }

  rename(name: string): void {
    this.props.name = Warehouse.validateName(name);
  }

  changeCode(code: string): void {
    this.props.code = Warehouse.validateCode(code);
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

  get code(): string {
    return this.props.code;
  }

  get isDefault(): boolean {
    return this.props.isDefault;
  }

  toProps(): WarehouseProps {
    return { ...this.props };
  }
}
