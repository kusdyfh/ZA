import { Color, type ColorProps } from './color.entity';
import { InvalidHexColorError, InvalidNameError } from '../errors/catalog.errors';

function buildColor(overrides: Partial<ColorProps> = {}): Color {
  const props: ColorProps = {
    id: 'color-1',
    storeId: 'store-1',
    name: 'Navy Blue',
    hexCode: '#1B2A4A',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
  return Color.reconstitute(props);
}

describe('Color.validateName', () => {
  it('trims and returns a non-empty name', () => {
    expect(Color.validateName('  Navy Blue  ')).toBe('Navy Blue');
  });

  it('throws for a blank name', () => {
    expect(() => Color.validateName('   ')).toThrow(InvalidNameError);
  });
});

describe('Color.validateHexCode', () => {
  it('accepts a valid 6-digit hex code and uppercases it', () => {
    expect(Color.validateHexCode('#1b2a4a')).toBe('#1B2A4A');
  });

  it('rejects a value without the leading #', () => {
    expect(() => Color.validateHexCode('1B2A4A')).toThrow(InvalidHexColorError);
  });

  it('rejects a 3-digit shorthand hex code', () => {
    expect(() => Color.validateHexCode('#FFF')).toThrow(InvalidHexColorError);
  });

  it('rejects a non-hex value', () => {
    expect(() => Color.validateHexCode('#GGGGGG')).toThrow(InvalidHexColorError);
  });
});

describe('Color mutations', () => {
  it('rename validates and updates the name', () => {
    const color = buildColor();
    color.rename('Ceil Blue');
    expect(color.name).toBe('Ceil Blue');
  });

  it('changeHexCode validates and updates the hex code', () => {
    const color = buildColor();
    color.changeHexCode('#6699cc');
    expect(color.hexCode).toBe('#6699CC');
  });
});
