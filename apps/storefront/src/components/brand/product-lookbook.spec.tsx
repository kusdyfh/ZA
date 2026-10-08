import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProductLookbook } from './product-lookbook';
import type { Product } from '@/features/products/types';

function makeProduct(overrides: Partial<Product>): Product {
  return {
    id: 'product-1',
    name: 'Classic Scrub Top',
    slug: 'classic-scrub-top',
    sku: 'SKU-1',
    shortDescription: 'Soft and breathable.',
    description: null,
    status: 'ACTIVE',
    price: '39000',
    discountPrice: null,
    currency: 'IQD',
    categoryId: 'cat-1',
    brandId: null,
    isFeatured: false,
    isBestSeller: false,
    isNewArrival: false,
    isGiftBox: false,
    isVisibleInCatalog: true,
    metaTitle: null,
    metaDescription: null,
    ogImageUrl: null,
    ...overrides,
  };
}

const products = [
  makeProduct({
    id: 'p1',
    name: 'Top One',
    slug: 'top-one',
    discountPrice: '30000',
    price: '39000',
  }),
  makeProduct({
    id: 'p2',
    name: 'Pants Two',
    slug: 'pants-two',
    price: '42000',
    shortDescription: 'مريح',
  }),
  makeProduct({
    id: 'p3',
    name: 'Coat Three',
    slug: 'coat-three',
    price: '90000',
    ogImageUrl: '/products/coat.jpg',
  }),
  makeProduct({ id: 'p4', name: 'Fourth Piece', slug: 'fourth-piece' }),
];

const book = () => screen.getByRole('group', { name: 'The ZA Edit lookbook' });

async function openAndTurn(
  user: ReturnType<typeof userEvent.setup>,
  turns: number,
) {
  await user.click(screen.getByRole('button', { name: /open the book/i }));
  for (let i = 0; i < turns; i += 1) {
    await user.click(screen.getByRole('button', { name: 'Next page' }));
  }
}

/** The product links currently reachable (not inside an inert face). */
function reachableProductLinks(): string[] {
  return screen
    .getAllByRole('link', { hidden: true })
    .filter(
      (link) =>
        link.getAttribute('href')?.startsWith('/products/') &&
        !link.closest('[inert]'),
    )
    .map((link) => link.getAttribute('href')!);
}

describe('ProductLookbook', () => {
  it('renders nothing when there are no products', () => {
    const { container } = render(<ProductLookbook products={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the heading and a closed book with a cover', () => {
    render(<ProductLookbook products={products} />);

    expect(
      screen.getByRole('heading', { name: 'The ZA Edit' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /open the book/i }),
    ).toBeInTheDocument();
    expect(screen.getByText('Lookbook')).toBeInTheDocument();
  });

  it('features only the first three products', () => {
    render(<ProductLookbook products={products} />);

    const hrefs = screen
      .getAllByRole('link', { hidden: true })
      .map((link) => link.getAttribute('href'))
      .filter((href) => href?.startsWith('/products/'));

    expect(hrefs).toEqual([
      '/products/top-one',
      '/products/pants-two',
      '/products/coat-three',
    ]);
    expect(screen.queryByText('Fourth Piece')).not.toBeInTheDocument();
  });

  it('introduces the edit with the number of pieces', async () => {
    const user = userEvent.setup();
    render(<ProductLookbook products={products} />);
    await user.click(screen.getByRole('button', { name: /open the book/i }));

    expect(screen.getByText('3 pieces, one calm shift')).toBeInTheDocument();
  });

  it('gives each product a spread: its photo, then its details and a link to its page', async () => {
    const user = userEvent.setup();
    render(<ProductLookbook products={products} />);

    await openAndTurn(user, 1);
    expect(reachableProductLinks()).toEqual(['/products/top-one']);
    expect(screen.getByText('NO. 01')).toBeVisible();

    await user.click(screen.getByRole('button', { name: 'Next page' }));
    expect(reachableProductLinks()).toEqual(['/products/pants-two']);

    await user.click(screen.getByRole('button', { name: 'Next page' }));
    expect(reachableProductLinks()).toEqual(['/products/coat-three']);
  });

  it('shows a discount as the price with the old price struck through', async () => {
    const user = userEvent.setup();
    render(<ProductLookbook products={products} />);
    await openAndTurn(user, 1);

    expect(screen.getByText('IQD 30,000')).toBeInTheDocument();
    expect(screen.getByText('IQD 39,000')).toHaveClass('line-through');
  });

  it('lays out a description by its own language direction', async () => {
    const user = userEvent.setup();
    render(<ProductLookbook products={products} />);
    await openAndTurn(user, 2);

    expect(screen.getByText('مريح')).toHaveAttribute('dir', 'auto');
  });

  it('uses the product photo when there is one and a placeholder when there is not', async () => {
    const user = userEvent.setup();
    render(<ProductLookbook products={products} />);

    await openAndTurn(user, 1);
    expect(
      screen.queryByRole('img', { name: 'Top One' }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Next page' }));
    await user.click(screen.getByRole('button', { name: 'Next page' }));
    expect(screen.getByRole('img', { name: 'Coat Three' })).toBeInTheDocument();
  });

  it('closes on a closing note and offers the whole shop', async () => {
    const user = userEvent.setup();
    render(<ProductLookbook products={products} />);
    await openAndTurn(user, 4);

    expect(
      screen.getByText(/Clothes that show up for you/),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Shop all' })).toHaveAttribute(
      'href',
      '/shop',
    );
  });

  it('works with a single product', async () => {
    const user = userEvent.setup();
    render(<ProductLookbook products={[products[0]!]} />);
    await user.click(screen.getByRole('button', { name: /open the book/i }));

    expect(screen.getByText('One piece, one calm shift')).toBeInTheDocument();
    expect(book()).toBeInTheDocument();
  });
});
