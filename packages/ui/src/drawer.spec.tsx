import { render, screen, fireEvent } from '@testing-library/react';
import { Drawer } from './drawer';

describe('Drawer', () => {
  it('renders nothing when closed', () => {
    render(<Drawer open={false} onClose={jest.fn()} title="Your cart" />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders its title and content when open', () => {
    render(
      <Drawer open onClose={jest.fn()} title="Your cart">
        <p>Cart contents</p>
      </Drawer>,
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Your cart')).toBeInTheDocument();
    expect(screen.getByText('Cart contents')).toBeInTheDocument();
  });

  it('calls onClose when the close button is clicked', () => {
    const onClose = jest.fn();
    render(<Drawer open onClose={onClose} title="Your cart" />);
    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when Escape is pressed', () => {
    const onClose = jest.fn();
    render(<Drawer open onClose={onClose} title="Your cart" />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });
});
