import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { CartProvider, useCart } from './CartContext';

describe('CartContext', () => {
  const wrapper = ({ children }) => <CartProvider>{children}</CartProvider>;

  it('throws an error if useCart is called outside CartProvider', () => {
    const { result } = renderHook(() => useCart());
    expect(result.error).toEqual(Error('useCart must be used within CartProvider'));
  });

  it('adds new items and increments existing items correctly', () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.addToCart({ id: 1, price: 10, restaurantId: 5 });
    });
    expect(result.current.cart).toHaveLength(1);
    expect(result.current.cart[0].quantity).toBe(1);

    act(() => {
      result.current.addToCart({ id: 1, price: 10, restaurantId: 5 });
    });
    expect(result.current.cart[0].quantity).toBe(2);
  });

  it('removes one quantity when quantity > 1', () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.addToCart({ id: 2, price: 5, restaurantId: 1 });
      result.current.addToCart({ id: 2, price: 5, restaurantId: 1 });
    });

    expect(result.current.cart[0].quantity).toBe(2);

    act(() => {
      result.current.removeFromCart(2);
    });

    expect(result.current.cart[0].quantity).toBe(1);
  });

  it('removes item completely when quantity is 1', () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.addToCart({ id: 3, price: 7, restaurantId: 2 });
    });

    expect(result.current.cart).toHaveLength(1);

    act(() => {
      result.current.removeFromCart(3);
    });

    expect(result.current.cart).toHaveLength(0);
  });

  it('clears all items from the cart', () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.addToCart({ id: 4, price: 8, restaurantId: 3 });
      result.current.addToCart({ id: 5, price: 6, restaurantId: 3 });
    });
    expect(result.current.cart.length).toBe(2);

    act(() => {
      result.current.clearCart();
    });
    expect(result.current.cart).toEqual([]);
  });

  it('computes cartTotal and cartCount correctly', () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.addToCart({ id: 10, price: 5, restaurantId: 1 });
      result.current.addToCart({ id: 11, price: 15, restaurantId: 1 });
      result.current.addToCart({ id: 10, price: 5, restaurantId: 1 });
    });

    expect(result.current.cartTotal).toBe(25); // (2 * 5) + 15
    expect(result.current.cartCount).toBe(3);
  });

  it('toggles showCart state correctly', () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => result.current.setShowCart(true));
    expect(result.current.showCart).toBe(true);

    act(() => result.current.setShowCart(false));
    expect(result.current.showCart).toBe(false);
  });
});
