// src/tests/integration/CartIntegration.test.jsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { CartProvider, useCart } from '../../context/CartContext';
import CartSidebar from '../../components/common/Cart/CartSidebar';
import Button from '../../components/common/Button/Button';

// Mock component simulating adding items
const MockShop = () => {
  const { addToCart, setShowCart } = useCart();

  const handleAddItem = () => {
    addToCart({ id: 1, name: 'Burger', price: 5.5 });
    setShowCart(true);
  };

  return <Button onClick={handleAddItem}>Add Burger</Button>;
};

describe('🧠 Cart Integration Test — core shopping flow', () => {
  test('User can add item → see it in cart → see total → proceed to checkout', async () => {
    render(
      <CartProvider>
        <MemoryRouter>
          <MockShop />
          <CartSidebar selectedRestaurant={{ id: 'res1', name: 'BurgerPlace' }} />
        </MemoryRouter>
      </CartProvider>
    );

    // 1️⃣ Add item to cart
    fireEvent.click(screen.getByText('Add Burger'));

    // 2️⃣ Cart should appear with item
    expect(await screen.findByText('Your Cart')).toBeInTheDocument();
    expect(screen.getByText('Burger')).toBeInTheDocument();

    // 3️⃣ Quantity controls work
    fireEvent.click(screen.getByText('+'));
    expect(screen.getByText('2')).toBeInTheDocument();

    // 4️⃣ Total updates correctly ($5.5 × 2 = $11.00)
    expect(screen.getByText('$11.00')).toBeInTheDocument();

    // 5️⃣ Checkout button enabled and functional
    const checkoutButton = screen.getByRole('button', { name: /checkout/i });
    expect(checkoutButton).not.toBeDisabled();

    // Simulate checkout navigation (mock navigate)
    fireEvent.click(checkoutButton);

    // 6️⃣ No actual navigation here, but you could assert a call if mocked
    await waitFor(() => {
      expect(screen.getByText('Your Cart')).toBeInTheDocument();
    });
  });
});
