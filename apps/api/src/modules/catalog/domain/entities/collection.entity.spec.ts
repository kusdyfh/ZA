import { Collection, type CollectionProps } from './collection.entity';
import { Slug } from '../value-objects/slug.vo';
import { SeoMetadata } from '../value-objects/seo-metadata.vo';
import { InvalidDateRangeError, InvalidNameError } from '../errors/catalog.errors';

function buildCollection(overrides: Partial<CollectionProps> = {}): Collection {
  const props: CollectionProps = {
    id: 'col-1',
    storeId: 'store-1',
    name: 'New Arrivals',
    slug: Slug.fromRaw('new-arrivals'),
    description: null,
    isActive: true,
    startsAt: null,
    endsAt: null,
    seo: SeoMetadata.create({}),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
  return Collection.reconstitute(props);
}

describe('Collection.validateName', () => {
  it('throws for a blank name', () => {
    expect(() => Collection.validateName('')).toThrow(InvalidNameError);
  });
});

describe('Collection.validateSchedule / schedule()', () => {
  it('accepts an unset schedule', () => {
    expect(() => Collection.validateSchedule(null, null)).not.toThrow();
  });

  it('accepts an end date after the start date', () => {
    const start = new Date('2026-01-01');
    const end = new Date('2026-02-01');
    expect(() => Collection.validateSchedule(start, end)).not.toThrow();
  });

  it('rejects an end date before or equal to the start date', () => {
    const start = new Date('2026-02-01');
    expect(() => Collection.validateSchedule(start, new Date('2026-01-01'))).toThrow(
      InvalidDateRangeError,
    );
    expect(() => Collection.validateSchedule(start, start)).toThrow(InvalidDateRangeError);
  });

  it('schedule() applies validated dates to the entity', () => {
    const collection = buildCollection();
    const start = new Date('2026-01-01');
    const end = new Date('2026-02-01');
    collection.schedule(start, end);
    expect(collection.startsAt).toEqual(start);
    expect(collection.endsAt).toEqual(end);
  });
});

describe('Collection#isCurrentlyLive', () => {
  it('is false when deactivated, regardless of schedule', () => {
    const collection = buildCollection({ isActive: false });
    expect(collection.isCurrentlyLive(new Date('2026-06-01'))).toBe(false);
  });

  it('is true when active with no schedule window', () => {
    const collection = buildCollection({ isActive: true, startsAt: null, endsAt: null });
    expect(collection.isCurrentlyLive(new Date('2026-06-01'))).toBe(true);
  });

  it('is false before the start date', () => {
    const collection = buildCollection({
      isActive: true,
      startsAt: new Date('2026-06-01'),
      endsAt: null,
    });
    expect(collection.isCurrentlyLive(new Date('2026-05-01'))).toBe(false);
  });

  it('is false after the end date', () => {
    const collection = buildCollection({
      isActive: true,
      startsAt: null,
      endsAt: new Date('2026-06-01'),
    });
    expect(collection.isCurrentlyLive(new Date('2026-07-01'))).toBe(false);
  });

  it('is true within the schedule window', () => {
    const collection = buildCollection({
      isActive: true,
      startsAt: new Date('2026-06-01'),
      endsAt: new Date('2026-07-01'),
    });
    expect(collection.isCurrentlyLive(new Date('2026-06-15'))).toBe(true);
  });
});
