/**
 * @file CartSidebar.test.jsx
 * Unit tests for CartSidebar component.
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import CartSidebar from './CartSidebar';
import { useCart } from '../../../context/CartContext';

// 🧩 Mock dependencies
jest.mock('../../../context/CartContext', () => ({
  useCart: jest.fn(),
}));

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Suppress window.alert popups during test runs
window.alert = jest.fn();

describe('CartSidebar Component', () => {
  const mockSetShowCart = jest.fn();
  const mockAddToCart = jest.fn();
  const mockRemoveFromCart = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const baseCartState = {
    cart: [],
    cartTotal: 0,
    showCart: true,
    setShowCart: mockSetShowCart,
    addToCart: mockAddToCart,
    removeFromCart: mockRemoveFromCart,
  };

  // ---------- RENDER TESTS ----------
  it('does not render when showCart is false', () => {
    useCart.mockReturnValue({ ...baseCartState, showCart: false });
    const { container } = render(<CartSidebar />, { wrapper: MemoryRouter });
    expect(container.firstChild).toBeNull();
  });

  it('renders empty cart message', () => {
    useCart.mockReturnValue({ ...baseCartState, cart: [] });
    render(<CartSidebar />, { wrapper: MemoryRouter });
    expect(screen.getByText(/Your cart is empty/i)).toBeInTheDocument();
  });

  // ---------- CART ITEM RENDERING ----------
  it('renders cart items and total', () => {
    useCart.mockReturnValue({
      ...baseCartState,
      cart: [{ id: 1, name: 'Burger', price: 5, quantity: 2 }],
      cartTotal: 10,
    });

    render(<CartSidebar selectedRestaurant={{ id: 1, name: 'Testaurant' }} />, {
      wrapper: MemoryRouter,
    });

    expect(screen.getByText('Burger')).toBeInTheDocument();
    expect(screen.getByText('$10.00')).toBeInTheDocument();
    expect(screen.getByText('Checkout')).toBeInTheDocument();
  });

  // ---------- BUTTON INTERACTIONS ----------
  it('calls removeFromCart and addToCart on + and − click', () => {
    useCart.mockReturnValue({
      ...baseCartState,
      cart: [{ id: 1, name: 'Pizza', price: 12, quantity: 1 }],
      cartTotal: 12,
    });

    render(<CartSidebar selectedRestaurant={{ id: 1 }} />, { wrapper: MemoryRouter });

    fireEvent.click(screen.getByText('−'));
    expect(mockRemoveFromCart).toHaveBeenCalledWith(1);

    fireEvent.click(screen.getByText('+'));
    expect(mockAddToCart).toHaveBeenCalledWith({
      id: 1,
      name: 'Pizza',
      price: 12,
      quantity: 1,
    });
  });

  // ---------- CHECKOUT BEHAVIOR ----------
  it('alerts if no restaurant selected', () => {
    useCart.mockReturnValue({
      ...baseCartState,
      cart: [{ id: 1, name: 'Item', price: 5, quantity: 1 }],
      cartTotal: 5,
    });

    render(<CartSidebar />, { wrapper: MemoryRouter });

    fireEvent.click(screen.getByText('Checkout'));
    expect(window.alert).toHaveBeenCalledWith('Please select a restaurant first!');
  });

  it('alerts if cart is empty', () => {
    useCart.mockReturnValue({
      ...baseCartState,
      cart: [],
      cartTotal: 0,
    });

    render(<CartSidebar selectedRestaurant={{ id: 1 }} />, { wrapper: MemoryRouter });

    fireEvent.click(screen.getByText('Checkout'));
    expect(window.alert).toHaveBeenCalledWith('Your cart is empty!');
  });

  it('navigates to order-options on successful checkout', () => {
    const cart = [{ id: 1, name: 'Burger', price: 5, quantity: 2 }];
    const selectedRestaurant = { id: 42, name: 'Best Burger' };

    useCart.mockReturnValue({
      ...baseCartState,
      cart,
      cartTotal: 10,
    });

    render(<CartSidebar selectedRestaurant={selectedRestaurant} />, {
      wrapper: MemoryRouter,
    });

    fireEvent.click(screen.getByText('Checkout'));

    expect(mockNavigate).toHaveBeenCalledWith('/order-options', {
      state: {
        cart,
        cartTotal: 10,
        restaurant: selectedRestaurant,
      },
    });
  });

  // ---------- CLOSE BEHAVIOR ----------
  it('closes cart when overlay or close button clicked', () => {
    useCart.mockReturnValue({
      ...baseCartState,
      cart: [],
    });

    render(<CartSidebar />, { wrapper: MemoryRouter });

    fireEvent.click(screen.getByRole('button', { name: '✕' }));
    expect(mockSetShowCart).toHaveBeenCalledWith(false);

    fireEvent.click(screen.getByText('Your Cart').closest('.cart-overlay'));
    expect(mockSetShowCart).toHaveBeenCalledWith(false);
  });
});
