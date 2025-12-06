import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import OrderOptionsModal from './OrderOptions';
import * as groupApi from '../../api/groups';
import * as orderApi from '../../api/orders';
import { useCart } from '../../context/CartContext';

jest.mock('../../context/CartContext');
jest.mock('../../api/groups');
jest.mock('../../api/orders');

describe('OrderOptionsModal', () => {
  const mockCart = [
    { id: 1, name: 'Pizza', quantity: 2 },
    { id: 2, name: 'Burger', quantity: 1 }
  ];

  beforeEach(() => {
    useCart.mockReturnValue({
      cart: mockCart,
      cartTotal: 30,
      clearCart: jest.fn(),
    });
  });

  test('renders initial options', () => {
    render(<MemoryRouter><OrderOptionsModal /></MemoryRouter>);

    expect(screen.getByText(/order now/i)).toBeInTheDocument();
    expect(screen.getByText(/create a pool/i)).toBeInTheDocument();
    expect(screen.getByText(/join a pool/i)).toBeInTheDocument();
  });

  test('Order Now flow calls placeImmediateOrder', async () => {
    groupApi.createGroup.mockResolvedValueOnce({ id: 1 });
    orderApi.placeImmediateOrder.mockResolvedValueOnce({});

    render(<MemoryRouter><OrderOptionsModal /></MemoryRouter>);

    fireEvent.click(screen.getByText(/order now/i));

    fireEvent.change(screen.getByPlaceholderText(/default/i), { target: { value: 'Building A' } });
    fireEvent.click(screen.getByText(/confirm & place order/i));

    await waitFor(() => {
      expect(groupApi.createGroup).toHaveBeenCalled();
      expect(orderApi.placeImmediateOrder).toHaveBeenCalled();
      expect(useCart().clearCart).toHaveBeenCalled();
    });

    expect(screen.getByText(/order placed successfully/i)).toBeInTheDocument();
  });

  test('Create Pool flow calls createGroup and placeGroupOrder', async () => {
    groupApi.createGroup.mockResolvedValueOnce({ id: 2 });
    orderApi.placeGroupOrder.mockResolvedValueOnce({});

    render(<MemoryRouter><OrderOptionsModal /></MemoryRouter>);

    fireEvent.click(screen.getByText(/create a pool/i));
    fireEvent.change(screen.getByPlaceholderText(/e\.g\., building a/i), { target: { value: 'Office' } });
    fireEvent.click(screen.getByText(/create pool & wait/i));

    await waitFor(() => {
      expect(groupApi.createGroup).toHaveBeenCalled();
      expect(orderApi.placeGroupOrder).toHaveBeenCalled();
      expect(useCart().clearCart).toHaveBeenCalled();
    });

    expect(screen.getByText(/pool created/i)).toBeInTheDocument();
  });

  test('Join Pool flow fetches nearby pools and joins', async () => {
    groupApi.getAllGroups.mockResolvedValueOnce([
      { id: 3, restaurant_id: 1, name: 'Test Pool', members: [], maxMembers: 5, nextOrderTime: new Date(Date.now() + 60000).toISOString(), organizer: 'Alice', deliveryLocation: 'Office' }
    ]);
    groupApi.joinGroup.mockResolvedValueOnce({});
    orderApi.placeGroupOrder.mockResolvedValueOnce({});

    render(<MemoryRouter><OrderOptionsModal /></MemoryRouter>);

    fireEvent.click(screen.getByText(/join a pool/i));

    await waitFor(() => screen.getByText(/test pool/i));
    fireEvent.click(screen.getByText(/join this pool/i));

    await waitFor(() => {
      expect(groupApi.joinGroup).toHaveBeenCalledWith(3);
      expect(orderApi.placeGroupOrder).toHaveBeenCalled();
      expect(useCart().clearCart).toHaveBeenCalled();
    });

    expect(screen.getByText(/joined pool successfully/i)).toBeInTheDocument();
  });

  test('shows error if delivery location is empty for Order Now', async () => {
    render(<MemoryRouter><OrderOptionsModal /></MemoryRouter>);

    fireEvent.click(screen.getByText(/order now/i));
    fireEvent.click(screen.getByText(/confirm & place order/i));

    await waitFor(() => {
      expect(screen.getByText(/please enter a delivery location/i)).toBeInTheDocument();
    });
  });

  test('handles empty cart gracefully', () => {
    useCart.mockReturnValue({ cart: [], cartTotal: 0, clearCart: jest.fn() });

    render(<MemoryRouter><OrderOptionsModal /></MemoryRouter>);

    expect(screen.getByText(/no order data/i)).toBeInTheDocument();
  });
});
