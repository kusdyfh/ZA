import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchBar } from './search-bar';

const pushMock = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}));

describe('SearchBar', () => {
  beforeEach(() => {
    pushMock.mockClear();
  });

  it('navigates to the shop page with the encoded query on submit', async () => {
    const user = userEvent.setup();
    render(<SearchBar />);

    await user.type(screen.getByLabelText('Search products'), 'scrub tops');
    await user.keyboard('{Enter}');

    expect(pushMock).toHaveBeenCalledWith('/shop?search=scrub%20tops');
  });

  it('navigates to the shop page with no query string when the search is empty', async () => {
    const user = userEvent.setup();
    render(<SearchBar />);

    await user.click(screen.getByLabelText('Search products'));
    await user.keyboard('{Enter}');

    expect(pushMock).toHaveBeenCalledWith('/shop');
  });

  it('calls onSubmitted after a search is submitted', async () => {
    const onSubmitted = jest.fn();
    const user = userEvent.setup();
    render(<SearchBar onSubmitted={onSubmitted} />);

    await user.type(screen.getByLabelText('Search products'), 'lab coat');
    await user.keyboard('{Enter}');

    expect(onSubmitted).toHaveBeenCalledTimes(1);
  });
});
