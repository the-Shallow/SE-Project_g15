import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import GroupDetail from './GroupDetail';
import { useCart } from '../../context/CartContext';
import * as groupsApi from '../../api/groups';
import * as ordersApi from '../../api/orders';
import { RESTAURANTS } from '../../utils/constants';

jest.mock('../../context/CartContext', () => ({
  useCart: jest.fn(),
}));

jest.mock('../../api/groups', () => ({
  getGroupPolls: jest.fn(),
  voteOnPoll: jest.fn(),
}));
jest.mock('../../api/orders', () => ({
  getGroupOrders: jest.fn(),
  placeGroupOrder: jest.fn(),
  deleteGroupOrder: jest.fn(),
}));

jest.mock('../../utils/constants', () => ({
  RESTAURANTS: [
    {
      id: 1,
      name: 'Testaurant',
      items: [
        { id: 101, name: 'Pizza', price: 10 },
        { id: 102, name: 'Burger', price: 8 },
      ],
    },
  ],
}));

jest.useFakeTimers();

describe('GroupDetail Component', () => {
  const mockGroup = {
    id: 123,
    name: 'Lunch Squad',
    organizer: 'Alice',
    members: ['Alice', 'Bob'],
    maxMembers: 5,
    nextOrderTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    deliveryType: 'Pickup',
    deliveryLocation: 'Student Center',
    restaurant_id: 1,
  };

  const mockCart = {
    addToCart: jest.fn(),
    cart: [],
    clearCart: jest.fn(),
  };

  const props = {
    group: mockGroup,
    onClose: jest.fn(),
    onEditGroup: jest.fn(),
    onCreatePoll: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.setItem('username', 'Bob');
    useCart.mockReturnValue(mockCart);
    ordersApi.getGroupOrders.mockResolvedValue([]);
    groupsApi.getGroupPolls.mockResolvedValue([]);
  });

  it('renders group details correctly', async () => {
    render(<GroupDetail {...props} />);
    expect(await screen.findByText('Lunch Squad')).toBeInTheDocument();
    expect(screen.getByText(/Alice, Bob/)).toBeInTheDocument();
    expect(screen.getByText(/Student Center/)).toBeInTheDocument();
    expect(screen.getByText(/Pickup/)).toBeInTheDocument();
  });

  it('loads and displays menu items from restaurant', async () => {
    render(<GroupDetail {...props} />);
    expect(await screen.findByText('Pizza')).toBeInTheDocument();
    expect(screen.getByText('Burger')).toBeInTheDocument();
  });

  it('toggles polls section on button click', async () => {
    render(<GroupDetail {...props} />);
    const toggleButton = screen.getByRole('button', { name: /View Polls/i });
    fireEvent.click(toggleButton);
    await waitFor(() => {
      expect(groupsApi.getGroupPolls).toHaveBeenCalledWith(123);
    });
    expect(await screen.findByText(/No polls yet/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Hide Polls/i }));
  });

  it('handles poll toggle errors gracefully', async () => {
    groupsApi.getGroupPolls.mockRejectedValueOnce(new Error('Failed'));
    render(<GroupDetail {...props} />);
    fireEvent.click(screen.getByRole('button', { name: /View Polls/i }));
    await waitFor(() => expect(screen.getByText(/error/i)).toBeInTheDocument());
  });

  it('calls placeGroupOrder when placing an order', async () => {
    const filledCart = {
      ...mockCart,
      cart: [{ id: 101, quantity: 2, restaurantId: 1 }],
    };
    useCart.mockReturnValue(filledCart);
    render(<GroupDetail {...props} />);
    const button = await screen.findByRole('button', { name: /Place \/ Update Order/i });
    window.alert = jest.fn();
    await act(async () => {
      fireEvent.click(button);
    });
    await waitFor(() => {
      expect(ordersApi.placeGroupOrder).toHaveBeenCalled();
    });
  });

  it('calls deleteGroupOrder when deleting order', async () => {
    const userOrder = {
      id: 999,
      username: 'Bob',
      items: [{ menuItemId: 101, quantity: 1 }],
    };
    ordersApi.getGroupOrders.mockResolvedValue([userOrder]);
    window.confirm = jest.fn(() => true);
    window.alert = jest.fn();
    render(<GroupDetail {...props} />);
    await waitFor(() => {
      expect(screen.getByText(/Delete My Order/i)).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText(/Delete My Order/i));
    await waitFor(() => expect(ordersApi.deleteGroupOrder).toHaveBeenCalled());
  });

  it('calls edit, close, and create poll callbacks', async () => {
    render(<GroupDetail {...props} />);
    fireEvent.click(screen.getByRole('button', { name: /Create Poll/i }));
    fireEvent.click(screen.getByRole('button', { name: /Close/i }));
    // Edit button visible only to organizer
    localStorage.setItem('username', 'Alice');
    render(<GroupDetail {...props} />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Edit Group/i })).toBeInTheDocument();
    });
  });

  it('updates countdown every second', async () => {
    render(<GroupDetail {...props} />);
    const countdown = await screen.findByText(/Countdown:/);
    expect(countdown).toBeInTheDocument();
    act(() => {
      jest.advanceTimersByTime(2000);
    });
    expect(screen.getByText(/Countdown:/)).toBeInTheDocument();
  });

  it('shows expired countdown as 00:00', async () => {
    const expiredGroup = { ...mockGroup, nextOrderTime: new Date(Date.now() - 1000).toISOString() };
    render(<GroupDetail {...props} group={expiredGroup} />);
    expect(await screen.findByText(/Countdown:/)).toBeInTheDocument();
  });
});
