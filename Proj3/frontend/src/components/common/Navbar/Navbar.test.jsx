/**
 * @file Navbar.test.jsx
 * Tests for the Navbar component navigation and rendering behavior.
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import { useCart } from '../../../context/CartContext';

// 🧩 Mock the useCart hook
jest.mock('../../../context/CartContext', () => ({
  useCart: jest.fn(),
}));

// 🧩 Mock react-router useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('Navbar Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useCart.mockReturnValue({
      cartCount: 0,
      setShowCart: jest.fn(),
    });
  });

  // ---------- RENDER TEST ----------
  it('renders all nav buttons and brand text', () => {
    render(<Navbar />, { wrapper: MemoryRouter });

    expect(screen.getByText('FoodPool')).toBeInTheDocument();
    expect(screen.getByText('🏠 Home')).toBeInTheDocument();
    expect(screen.getByText('👥 My Groups')).toBeInTheDocument();
    expect(screen.getByText('🔍 Find Groups')).toBeInTheDocument();
    expect(screen.getByText('🛒')).toBeInTheDocument();
    expect(screen.getByText('👤')).toBeInTheDocument();
  });

  // ---------- NAVIGATION TESTS ----------
  it('navigates to /dashboard when brand is clicked', () => {
    render(<Navbar />, { wrapper: MemoryRouter });
    fireEvent.click(screen.getByText('FoodPool'));
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });

  it('calls onPageChange when inside dashboard', () => {
    const mockPageChange = jest.fn();
    render(<Navbar onPageChange={mockPageChange} currentPage="home" />, { wrapper: MemoryRouter });
    fireEvent.click(screen.getByText('👥 My Groups'));
    expect(mockPageChange).toHaveBeenCalledWith('mygroups');
  });

  it('navigates to /dashboard if onPageChange not provided', () => {
    render(<Navbar />, { wrapper: MemoryRouter });
    fireEvent.click(screen.getByText('🔍 Find Groups'));
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });

  it('navigates to /profile when profile button is clicked', () => {
    render(<Navbar />, { wrapper: MemoryRouter });
    fireEvent.click(screen.getByText('👤'));
    expect(mockNavigate).toHaveBeenCalledWith('/profile');
  });

  // ---------- CART TESTS ----------
  it('shows cart badge when cartCount > 0', () => {
    useCart.mockReturnValueOnce({
      cartCount: 3,
      setShowCart: jest.fn(),
    });

    render(<Navbar />, { wrapper: MemoryRouter });
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('opens cart when cart button clicked', () => {
    const mockSetShowCart = jest.fn();
    useCart.mockReturnValueOnce({
      cartCount: 1,
      setShowCart: mockSetShowCart,
    });

    render(<Navbar />, { wrapper: MemoryRouter });
    fireEvent.click(screen.getByText('🛒'));
    expect(mockSetShowCart).toHaveBeenCalledWith(true);
  });
});
