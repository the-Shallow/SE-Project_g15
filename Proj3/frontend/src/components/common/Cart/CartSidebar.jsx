// src/components/common/Cart/CartSidebar.jsx

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../../context/CartContext';
import Button from '../Button/Button';
import './CartSidebar.css';

const CartSidebar = ({ selectedRestaurant }) => {
  const navigate = useNavigate();
  const { cart, cartTotal, addToCart, removeFromCart, showCart, setShowCart } = useCart();

  const effectiveRestaurant =
  selectedRestaurant ||
  (cart.length > 0
    ? { id: cart[0].restaurantId, name: cart[0].restaurantName || "Unknown" }
    : null);

  const handleCheckout = () => {
    if (!effectiveRestaurant) {
      alert('Please select a restaurant first!');
      return;
    }
    if (cart.length === 0) {
      alert('Your cart is empty!');
      return;
    }

    navigate('/order-options', {
      state: {
        cart,
        cartTotal,
        restaurant: effectiveRestaurant
      }
    });
  };

  if (!showCart) return null;

  return (
    <div className="cart-overlay" onClick={() => setShowCart(false)}>
      <div className="cart-sidebar" onClick={(e) => e.stopPropagation()}>
        <div className="cart-header">
          <h2>Your Cart</h2>
          <button onClick={() => setShowCart(false)} className="close-cart">✕</button>
        </div>

        {cart.length === 0 ? (
          <p className="empty-cart">Your cart is empty</p>
        ) : (
          <>
            <div className="cart-items">
              {cart.map(item => (
                <div key={item.id} className="cart-item">
                  <div className="cart-item-header">
                    <h4>{item.name}</h4>
                    <span className="cart-item-total">
                      ${(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                  <div className="cart-item-controls">
                    <div className="quantity-controls">
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="qty-button minus"
                      >
                        −
                      </button>
                      <span className="quantity">{item.quantity}</span>
                      <button
                        onClick={() => addToCart(item)}
                        className="qty-button plus"
                      >
                        +
                      </button>
                    </div>
                    <span className="unit-price">${item.price} each</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="cart-footer">
              <div className="cart-total">
                <span>Total:</span>
                <span className="total-amount">${cartTotal.toFixed(2)}</span>
              </div>
              <Button
                variant="success"
                size="large"
                fullWidth
                onClick={handleCheckout}
                disabled={!effectiveRestaurant || cart.length === 0}
              >
                Checkout
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CartSidebar;