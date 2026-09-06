import { InvalidHexColorError, InvalidNameError } from '../errors/catalog.errors';

const HEX_COLOR_PATTERN = /^#[0-9A-Fa-f]{6}$/;

export interface ColorProps {
  id: string;
  storeId: string;
  name: string;
  hexCode: string;
  createdAt: Date;
  updatedAt: Date;
}

export class Color {
  private constructor(private props: ColorProps) {}

  static reconstitute(props: ColorProps): Color {
    return new Color(props);
  }

  static validateName(name: string): string {
    const trimmed = name.trim();
    if (!trimmed) {
      throw new InvalidNameError('Color');
    }
    return trimmed;
  }

  static validateHexCode(hexCode: string): string {
    const normalized = hexCode.trim().toUpperCase();
    if (!HEX_COLOR_PATTERN.test(normalized)) {
      throw new InvalidHexColorError(hexCode);
    }
    return normalized;
  }

  rename(name: string): void {
    this.props.name = Color.validateName(name);
  }

  changeHexCode(hexCode: string): void {
    this.props.hexCode = Color.validateHexCode(hexCode);
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

  get hexCode(): string {
    return this.props.hexCode;
  }

  toProps(): ColorProps {
    return { ...this.props };
  }
}
