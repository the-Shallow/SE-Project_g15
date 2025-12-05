// src/components/common/Input/Input.test.jsx
import { render, screen, fireEvent } from '@testing-library/react';
import Input from './Input';

describe('Input Component', () => {

  test('renders input with placeholder', () => {
    render(<Input placeholder="Enter name" />);
    const input = screen.getByPlaceholderText('Enter name');
    expect(input).toBeInTheDocument();
  });

  test('calls onChange handler when typing', () => {
    const handleChange = jest.fn();
    render(<Input value="" onChange={handleChange} />);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Hello' } });
    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  test('renders input with value', () => {
    render(<Input value="Test Value" />);
    expect(screen.getByDisplayValue('Test Value')).toBeInTheDocument();
  });

  test('displays error message when error prop is passed', () => {
    render(<Input error="Required field" />);
    expect(screen.getByText('Required field')).toBeInTheDocument();
  });

  test('input is disabled when disabled prop is true', () => {
    render(<Input disabled />);
    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  test('renders with custom className', () => {
    render(<Input className="custom-class" />);
    expect(screen.getByRole('textbox').parentElement).toHaveClass('custom-class');
  });

});
