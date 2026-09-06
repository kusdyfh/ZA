import { Tag, type TagProps } from './tag.entity';
import { Slug } from '../value-objects/slug.vo';
import { InvalidNameError } from '../errors/catalog.errors';

function buildTag(overrides: Partial<TagProps> = {}): Tag {
  const props: TagProps = {
    id: 'tag-1',
    storeId: 'store-1',
    name: 'New',
    slug: Slug.fromRaw('new'),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
  return Tag.reconstitute(props);
}

describe('Tag', () => {
  it('validateName trims and rejects blank names', () => {
    expect(Tag.validateName('  New  ')).toBe('New');
    expect(() => Tag.validateName(' ')).toThrow(InvalidNameError);
  });

  it('rename validates and updates the name', () => {
    const tag = buildTag();
    tag.rename('Bestseller');
    expect(tag.name).toBe('Bestseller');
  });
});
