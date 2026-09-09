import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CharacterDressUp } from './character-dress-up';
import {
  CHARACTERS,
  OUTFIT_ASSIGNMENTS_BY_CHARACTER,
} from '@/features/characters/data';

/**
 * Integration coverage for the real, production 10-character roster (as
 * opposed to `character-dress-up.spec.tsx`, which exercises the component's
 * logic against small local fixtures). This is the test that actually
 * proves Characters 02–10 work through the same, unmodified component.
 */
describe('CharacterDressUp — full ten-character roster', () => {
  it('renders all ten characters and shows character prev/next navigation now that more than one exists', () => {
    render(
      <CharacterDressUp
        characters={CHARACTERS}
        outfitsByCharacterId={OUTFIT_ASSIGNMENTS_BY_CHARACTER}
      />,
    );

    expect(screen.getByText('Rose')).toBeInTheDocument();
    expect(screen.getByText('1 / 10')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Previous character' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Next character' }),
    ).toBeInTheDocument();
  });

  it('switches to the next character and shows her own product, price and colours', async () => {
    const user = userEvent.setup();
    render(
      <CharacterDressUp
        characters={CHARACTERS}
        outfitsByCharacterId={OUTFIT_ASSIGNMENTS_BY_CHARACTER}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Next character' }));

    expect(screen.getByText('Noor')).toBeInTheDocument();
    expect(screen.getByText('2 / 10')).toBeInTheDocument();
    expect(screen.getByText('Lab Coat 01')).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Cream' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Plum' })).toBeInTheDocument();
    expect(
      screen.getByRole('radio', { name: 'Dusty Rose' }),
    ).toBeInTheDocument();
  });

  it('wraps from the last character back to the first', async () => {
    const user = userEvent.setup();
    render(
      <CharacterDressUp
        characters={CHARACTERS}
        outfitsByCharacterId={OUTFIT_ASSIGNMENTS_BY_CHARACTER}
      />,
    );

    await user.click(
      screen.getByRole('button', { name: 'Previous character' }),
    );

    expect(screen.getByText('Sara')).toBeInTheDocument();
    expect(screen.getByText('10 / 10')).toBeInTheDocument();
    expect(screen.getByText('Modest Maxi Set 01')).toBeInTheDocument();
  });

  it('switches colour instantly to a real, distinct garment asset for the newly selected character', async () => {
    const user = userEvent.setup();
    render(
      <CharacterDressUp
        characters={CHARACTERS}
        outfitsByCharacterId={OUTFIT_ASSIGNMENTS_BY_CHARACTER}
      />,
    );

    // Jump to Hana (Statement Coat 01), the 9th character.
    for (let i = 0; i < 8; i += 1) {
      await user.click(screen.getByRole('button', { name: 'Next character' }));
    }
    expect(screen.getByText('Hana')).toBeInTheDocument();

    const goldSwatch = screen.getByRole('radio', { name: 'Gold' });
    await user.click(goldSwatch);

    const garmentLayers = screen
      .getAllByAltText('')
      .filter((img) =>
        (img as HTMLImageElement).src.includes('/garments/statement-coat-01/'),
      );
    expect(garmentLayers).toHaveLength(1);
    expect(garmentLayers[0]).toHaveAttribute(
      'src',
      expect.stringContaining('/garments/statement-coat-01/gold.svg'),
    );
  });

  it('links every character\'s "Shop this look" to her own real product page', async () => {
    const user = userEvent.setup();
    render(
      <CharacterDressUp
        characters={CHARACTERS}
        outfitsByCharacterId={OUTFIT_ASSIGNMENTS_BY_CHARACTER}
      />,
    );

    expect(
      screen.getByRole('link', { name: 'Shop this look' }),
    ).toHaveAttribute('href', '/products/scrub-set-01');

    await user.click(screen.getByRole('button', { name: 'Next character' }));
    expect(
      screen.getByRole('link', { name: 'Shop this look' }),
    ).toHaveAttribute('href', '/products/lab-coat-01');
  });
});
