import { CHARACTERS, OUTFIT_ASSIGNMENTS_BY_CHARACTER } from './data';

describe('Character System seed data', () => {
  it('has exactly the ten reusable base characters', () => {
    expect(CHARACTERS).toHaveLength(10);
    expect(CHARACTERS.map((c) => c.id)).toEqual([
      'rose',
      'noor',
      'lily',
      'maya',
      'farah',
      'amal',
      'dana',
      'yara',
      'hana',
      'sara',
    ]);
  });

  it('gives every character a complete, distinct layer + accessory asset set', () => {
    const seenUrls = new Set<string>();
    for (const character of CHARACTERS) {
      const { hairBackUrl, bodyUrl, hairFrontUrl } = character.assets;
      expect(hairBackUrl).toMatch(new RegExp(`^/characters/${character.id}/`));
      expect(bodyUrl).toMatch(new RegExp(`^/characters/${character.id}/`));
      expect(hairFrontUrl).toMatch(new RegExp(`^/characters/${character.id}/`));
      expect(character.accessoryUrl).toMatch(
        new RegExp(`^/characters/${character.id}/`),
      );

      // No character accidentally shares an asset path with another (a
      // copy-paste bug that would make two "distinct" characters render
      // identically on the shared rig).
      for (const url of [
        hairBackUrl,
        bodyUrl,
        hairFrontUrl,
        character.accessoryUrl!,
      ]) {
        expect(seenUrls.has(url)).toBe(false);
        seenUrls.add(url);
      }
    }
  });

  it('gives every character a real outfit assignment with at least 3 colours, each with its own authored asset', () => {
    for (const character of CHARACTERS) {
      const outfit = OUTFIT_ASSIGNMENTS_BY_CHARACTER[character.id];
      expect(outfit).toBeDefined();
      expect(outfit!.characterId).toBe(character.id);
      expect(outfit!.colors.length).toBeGreaterThanOrEqual(3);
      expect(outfit!.garmentAssets.length).toBe(outfit!.colors.length);

      // Every colour has a matching, distinct garment asset — the crux of
      // "never a CSS filter recolor": one real file per colour, not one
      // file reused with a different colour label.
      const colorIds = outfit!.colors.map((c) => c.id).sort();
      const assetColorIds = outfit!.garmentAssets.map((a) => a.colorId).sort();
      expect(assetColorIds).toEqual(colorIds);

      const assetUrls = new Set(outfit!.garmentAssets.map((a) => a.imageUrl));
      expect(assetUrls.size).toBe(outfit!.garmentAssets.length);

      for (const variant of outfit!.variants) {
        expect(variant.productId).toBe(outfit!.product.id);
      }
    }
  });

  it('never points two different products at the same garment asset file', () => {
    const allGarmentUrls = Object.values(
      OUTFIT_ASSIGNMENTS_BY_CHARACTER,
    ).flatMap((outfit) => outfit.garmentAssets.map((asset) => asset.imageUrl));
    expect(new Set(allGarmentUrls).size).toBe(allGarmentUrls.length);
  });
});
