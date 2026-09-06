import { render, screen, fireEvent } from '@testing-library/react';
import { Accordion } from './accordion';

const items = [
  { key: 'a', title: 'Question A', content: 'Answer A' },
  { key: 'b', title: 'Question B', content: 'Answer B' },
];

describe('Accordion', () => {
  it('starts with all panels closed by default', () => {
    render(<Accordion items={items} />);
    expect(screen.queryByText('Answer A')).not.toBeInTheDocument();
  });

  it('opens a panel when its header is clicked', () => {
    render(<Accordion items={items} />);
    fireEvent.click(screen.getByRole('button', { name: 'Question A' }));
    expect(screen.getByText('Answer A')).toBeInTheDocument();
  });

  it('closes only the previous panel when a new one opens (single mode)', () => {
    render(<Accordion items={items} />);
    fireEvent.click(screen.getByRole('button', { name: 'Question A' }));
    fireEvent.click(screen.getByRole('button', { name: 'Question B' }));
    expect(screen.queryByText('Answer A')).not.toBeInTheDocument();
    expect(screen.getByText('Answer B')).toBeInTheDocument();
  });

  it('allows multiple open panels when allowMultiple is set', () => {
    render(<Accordion items={items} allowMultiple />);
    fireEvent.click(screen.getByRole('button', { name: 'Question A' }));
    fireEvent.click(screen.getByRole('button', { name: 'Question B' }));
    expect(screen.getByText('Answer A')).toBeInTheDocument();
    expect(screen.getByText('Answer B')).toBeInTheDocument();
  });

  it('merges buttonClassName/panelClassName with the defaults instead of replacing them', () => {
    render(
      <Accordion
        items={items}
        buttonClassName="text-brand-ink"
        panelClassName="text-brand-ink-muted"
      />,
    );
    const button = screen.getByRole('button', { name: 'Question A' });
    expect(button).toHaveClass('text-brand-ink', 'dark:text-neutral-100');

    fireEvent.click(button);
    expect(screen.getByText('Answer A')).toHaveClass('text-brand-ink-muted', 'dark:text-neutral-400');
  });
});
