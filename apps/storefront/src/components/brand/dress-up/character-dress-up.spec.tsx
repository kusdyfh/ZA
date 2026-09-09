import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CharacterDressUp } from './character-dress-up';
import type {
  Character,
  CharacterOutfitAssignment,
} from '@/features/characters/types';

const rose: Character = {
  id: 'rose',
  name: 'Rose',
  role: 'Fashion',
  assets: {
    hairBackUrl: '/characters/rose/hair-back.svg',
    bodyUrl: '/characters/rose/body.svg',
    hairFrontUrl: '/characters/rose/hair-front.svg',
  },
  accessoryUrl: '/characters/rose/accessory-ribbon.svg',
};

const roseOutfit: CharacterOutfitAssignment = {
  characterId: 'rose',
  product: {
    id: 'scrub-set-01',
    name: 'Scrub Set 01',
    slug: 'scrub-set-01',
    sku: 'ZA-SCR-001',
    shortDescription: null,
    description: null,
    status: 'ACTIVE',
    price: '129.00',
    discountPrice: null,
    currency: 'USD',
    categoryId: 'scrubs',
    brandId: null,
    isFeatured: true,
    isBestSeller: false,
    isNewArrival: true,
    isGiftBox: false,
    isVisibleInCatalog: true,
    metaTitle: null,
    metaDescription: null,
    ogImageUrl: null,
  },
  variants: [],
  colors: [
    { id: 'pink', name: 'Pink', hexCode: '#C96B82' },
    { id: 'purple', name: 'Purple', hexCode: '#8E6FA8' },
    { id: 'black', name: 'Black', hexCode: '#2B2B2E' },
    { id: 'blue', name: 'Blue', hexCode: '#35577A' },
  ],
  garmentAssets: [
    { colorId: 'pink', imageUrl: '/garments/scrub-set-01/pink.svg' },
    { colorId: 'purple', imageUrl: '/garments/scrub-set-01/purple.svg' },
    { colorId: 'black', imageUrl: '/garments/scrub-set-01/black.svg' },
    { colorId: 'blue', imageUrl: '/garments/scrub-set-01/blue.svg' },
  ],
};

describe('CharacterDressUp', () => {
  it('renders nothing when there are no characters', () => {
    const { container } = render(
      <CharacterDressUp characters={[]} outfitsByCharacterId={{}} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the character, her default colour, and her real product info', () => {
    render(
      <CharacterDressUp
        characters={[rose]}
        outfitsByCharacterId={{ rose: roseOutfit }}
      />,
    );

    expect(screen.getByText('Rose')).toBeInTheDocument();
    expect(screen.getByText('Fashion')).toBeInTheDocument();
    expect(screen.getByText('Scrub Set 01')).toBeInTheDocument();
    expect(screen.getByText(/Pink/)).toBeInTheDocument();

    // The stage renders several alt="" layers (hair-back, hair-front, garment, accessory); find the garment one by src.
    const garmentLayers = screen
      .getAllByAltText('')
      .filter((img) => (img as HTMLImageElement).src.includes('/garments/'));
    expect(garmentLayers).toHaveLength(1);
    expect(garmentLayers[0]).toHaveAttribute(
      'src',
      '/garments/scrub-set-01/pink.svg',
    );
  });

  it('switches the garment asset instantly when a different colour is selected, with no other layer changing', async () => {
    const user = userEvent.setup();
    render(
      <CharacterDressUp
        characters={[rose]}
        outfitsByCharacterId={{ rose: roseOutfit }}
      />,
    );

    await user.click(screen.getByRole('radio', { name: 'Blue' }));

    const garmentLayers = screen
      .getAllByAltText('')
      .filter((img) => (img as HTMLImageElement).src.includes('/garments/'));
    expect(garmentLayers).toHaveLength(1);
    expect(garmentLayers[0]).toHaveAttribute(
      'src',
      '/garments/scrub-set-01/blue.svg',
    );
    expect(screen.getByText(/Blue/)).toBeInTheDocument();
    expect(screen.getByAltText('Rose')).toHaveAttribute(
      'src',
      '/characters/rose/body.svg',
    );
  });

  it('links "Shop this look" to the real product page', () => {
    render(
      <CharacterDressUp
        characters={[rose]}
        outfitsByCharacterId={{ rose: roseOutfit }}
      />,
    );

    expect(
      screen.getByRole('link', { name: 'Shop this look' }),
    ).toHaveAttribute('href', '/products/scrub-set-01');
  });

  it('renders the character on her neutral base layer with no colour/product controls when she has no outfit assignment yet', () => {
    render(<CharacterDressUp characters={[rose]} outfitsByCharacterId={{}} />);

    expect(screen.getByText('Rose')).toBeInTheDocument();
    expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: 'Shop this look' }),
    ).not.toBeInTheDocument();
  });

  it('does not render character prev/next arrows for a single character', () => {
    render(
      <CharacterDressUp
        characters={[rose]}
        outfitsByCharacterId={{ rose: roseOutfit }}
      />,
    );

    expect(
      screen.queryByRole('button', { name: 'Previous character' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Next character' }),
    ).not.toBeInTheDocument();
  });
});
