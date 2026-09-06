import { render, screen, fireEvent } from '@testing-library/react';
import { Dialog } from './dialog';

describe('Dialog', () => {
  it('renders nothing when closed', () => {
    render(<Dialog open={false} onClose={jest.fn()} title="Test dialog" />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders its title and content when open', () => {
    render(
      <Dialog open onClose={jest.fn()} title="Add warehouse" description="Fill in the details">
        <p>Body content</p>
      </Dialog>,
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Add warehouse')).toBeInTheDocument();
    expect(screen.getByText('Fill in the details')).toBeInTheDocument();
    expect(screen.getByText('Body content')).toBeInTheDocument();
  });

  it('calls onClose when the close button is clicked', () => {
    const onClose = jest.fn();
    render(<Dialog open onClose={onClose} title="Test dialog" />);
    fireEvent.click(screen.getByRole('button', { name: /close dialog/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when Escape is pressed', () => {
    const onClose = jest.fn();
    render(<Dialog open onClose={onClose} title="Test dialog" />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });
});
