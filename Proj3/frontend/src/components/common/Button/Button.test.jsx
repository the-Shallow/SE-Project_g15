// src/components/common/Button/Button.test.jsx
import { render, screen, fireEvent } from '@testing-library/react';
import Button from './Button';

describe('Button Component', () => {

  test('renders with children text', () => {
    render(<Button>Click Me</Button>);
    expect(screen.getByText('Click Me')).toBeInTheDocument();
  });

  test('calls onClick handler when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click Me</Button>);
    fireEvent.click(screen.getByText('Click Me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test('disables button when disabled prop is true', () => {
    render(<Button disabled>Click Me</Button>);
    expect(screen.getByText('Click Me')).toBeDisabled();
  });

  test('shows loading spinner when loading prop is true', () => {
    render(<Button loading>Click Me</Button>);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.queryByText('Click Me')).not.toBeInTheDocument();
  });

  test('applies fullWidth class when fullWidth is true', () => {
    render(<Button fullWidth>Click Me</Button>);
    expect(screen.getByText('Click Me')).toHaveClass('btn-full-width');
  });

  test('applies variant and size classes', () => {
    render(<Button variant="danger" size="large">Delete</Button>);
    const btn = screen.getByText('Delete');
    expect(btn).toHaveClass('btn-danger');
    expect(btn).toHaveClass('btn-large');
  });

});
