import { render, screen, fireEvent } from '@testing-library/react';
import { QuantityStepper } from './quantity-stepper';

describe('QuantityStepper', () => {
  it('calls onChange with an incremented value', () => {
    const onChange = jest.fn();
    render(<QuantityStepper value={2} onChange={onChange} />);
    fireEvent.click(screen.getByLabelText('Increase quantity'));
    expect(onChange).toHaveBeenCalledWith(3);
  });

  it('calls onChange with a decremented value', () => {
    const onChange = jest.fn();
    render(<QuantityStepper value={2} onChange={onChange} />);
    fireEvent.click(screen.getByLabelText('Decrease quantity'));
    expect(onChange).toHaveBeenCalledWith(1);
  });

  it('disables decrement at the minimum', () => {
    const onChange = jest.fn();
    render(<QuantityStepper value={1} onChange={onChange} min={1} />);
    expect(screen.getByLabelText('Decrease quantity')).toBeDisabled();
  });

  it('disables increment at the maximum', () => {
    const onChange = jest.fn();
    render(<QuantityStepper value={5} onChange={onChange} max={5} />);
    expect(screen.getByLabelText('Increase quantity')).toBeDisabled();
  });
});
