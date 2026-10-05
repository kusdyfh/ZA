import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProductGallery, selectGalleryMedia } from './product-gallery';
import type { ProductMedia } from '../types';

function item(
  id: string,
  sortOrder: number,
  colorId: string | null,
  isCover = false,
): ProductMedia {
  return {
    id,
    type: 'IMAGE',
    url: `/products/${id}.jpg`,
    altText: id,
    sortOrder,
    isCover,
    colorId,
  };
}

const media = [
  item('pink-1', 0, 'pink', true),
  item('pink-2', 1, 'pink'),
  item('teal-1', 2, 'teal'),
  item('teal-2', 3, 'teal'),
  item('teal-3', 4, 'teal'),
  item('shared', 5, null),
];

describe('selectGalleryMedia', () => {
  it('shows only the chosen color plus shared photos', () => {
    expect(selectGalleryMedia(media, 'teal').map((m) => m.id)).toEqual([
      'teal-1',
      'teal-2',
      'teal-3',
      'shared',
    ]);
  });

  it('falls back to every photo when the color has none of its own', () => {
    expect(selectGalleryMedia(media, 'black')).toHaveLength(6);
  });

  it('keeps cover-first ordering when no media is color-tagged', () => {
    const untagged = [item('a', 0, null), item('b', 1, null, true)];
    expect(selectGalleryMedia(untagged, null).map((m) => m.id)).toEqual([
      'b',
      'a',
    ]);
  });
});

describe('ProductGallery', () => {
  it('renders only the selected color and resets when the color changes', () => {
    const { rerender } = render(
      <ProductGallery media={media} productName="Scrub" colorId="pink" />,
    );
    expect(screen.getAllByRole('button', { name: /View image/ })).toHaveLength(
      3,
    );

    rerender(
      <ProductGallery media={media} productName="Scrub" colorId="teal" />,
    );
    expect(screen.getAllByRole('button', { name: /View image/ })).toHaveLength(
      4,
    );
    expect(screen.getByText('1 / 4')).toBeInTheDocument();
  });

  it('steps through images with next/previous and wraps around', async () => {
    const user = userEvent.setup();
    render(<ProductGallery media={media} productName="Scrub" colorId="pink" />);

    await user.click(screen.getByRole('button', { name: 'Next image' }));
    expect(screen.getByText('2 / 3')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Next image' }));
    await user.click(screen.getByRole('button', { name: 'Next image' }));
    expect(screen.getByText('1 / 3')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Previous image' }));
    expect(screen.getByText('3 / 3')).toBeInTheDocument();
  });

  it('hides the arrows for a single image', () => {
    render(
      <ProductGallery
        media={[item('only', 0, null, true)]}
        productName="Scrub"
      />,
    );
    expect(
      screen.queryByRole('button', { name: 'Next image' }),
    ).not.toBeInTheDocument();
  });
});
