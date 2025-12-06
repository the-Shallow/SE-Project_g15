// src/components/group/GroupDetail.jsx
import React, { useEffect, useState } from 'react';
import Button from '../common/Button/Button';
import './GroupDetail.css';
import MenuItemCard from '../restaurant/MenuItemCard';
import { useCart } from '../../context/CartContext';
import { RESTAURANTS } from '../../utils/constants';
import { getGroupPolls, voteOnPoll } from '../../api/groups';
import { getGroupOrders, placeGroupOrder, deleteGroupOrder } from '../../api/orders';


const GroupDetail = ({ group, onClose, onEditGroup, onCreatePoll }) => {
  const [polls, setPolls] = useState([]);
  const [showPolls, setShowPolls] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');
  const [loading, setLoading] = useState(false);
  const { addToCart, cart, clearCart } = useCart();
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [groupOrders, setGroupOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [showOtherOrders, setShowOtherOrders] = useState(false);

  const currentUser = localStorage.getItem('username') || "Guest"; // Replace with actual logged-in user
  // Get menu for this group
  const groupMenu = selectedRestaurant?.items || group?.menu || [];

  // Fetch polls when component mounts or showPolls changes
  useEffect(() => {
    if (showPolls && group?.id) {
      fetchPolls();
    }
  }, [showPolls, group?.id]);

  // Setup countdown timer in EST/EDT
  useEffect(() => {
    if (!group?.nextOrderTime) return;

    const updateCountdown = () => {
      const remaining = calculateTimeRemainingEST(group.nextOrderTime);
      setTimeLeft(remaining);
    };

    updateCountdown(); // Initialize immediately
    const interval = setInterval(updateCountdown, 1000); // Update every second

    return () => clearInterval(interval);
  }, [group?.nextOrderTime]);

  // Calculate time remaining in EST/EDT
  const calculateTimeRemainingEST = (nextOrderTime) => {
    // Convert backend UTC time to EST/EDT
    const orderTime = new Date(nextOrderTime).toLocaleString("en-US", {
      timeZone: "America/New_York",
    });
    const orderTimeDate = new Date(orderTime); // EST/EDT Date object

    // Current time in EST/EDT
    const now = new Date(
      new Date().toLocaleString("en-US", { timeZone: "America/New_York" })
    );

    let diff = orderTimeDate - now;

    if (diff <= 0) return "Expired";

    const hours = Math.floor(diff / (1000 * 60 * 60));
    diff -= hours * 1000 * 60 * 60;
    const minutes = Math.floor(diff / (1000 * 60));
    diff -= minutes * 1000 * 60;
    const seconds = Math.floor(diff / 1000);

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };


  // Load restaurant data
  useEffect(() => {
    if (group?.restaurant_id) {
      const restaurant = RESTAURANTS.find(r => r.id === group.restaurant_id);
      setSelectedRestaurant(restaurant);
    }
  }, [group?.restaurant_id]);

  /// Fetch group orders whenever group ID changes
  useEffect(() => {
    if (group?.id) fetchOrders();
  }, [group?.id]);

  const fetchOrders = async () => {
    setLoadingOrders(true);
    try {
      const orders = await getGroupOrders(group.id);

      // Normalize order items and timestamps if needed
      const normalizedOrders = orders.map(order => ({
        ...order,
        items: order.items.map(item => ({
          ...item,
          // Ensure consistent naming
          menuItemName: item.menu_item_name || item.menuItemName,
        })),
        nextOrderTime: order.next_order_time || order.nextOrderTime,
      }));

      setGroupOrders(normalizedOrders);
    } catch (err) {
      console.error('Error fetching group orders:', err);
      // Optional: show a user-friendly error
      alert('Failed to load group orders. Please try again.');
    } finally {
      setLoadingOrders(false);
    }
  };

  // Place or update order
  // Place or update order
  const handlePlaceOrder = async () => {
    const now = new Date();
    const orderTime = new Date(group.nextOrderTime);

    if (orderTime - now <= 0) {
      return alert('Cannot place order. The group order has expired.');
    }

    if (!selectedRestaurant) return alert('Select a restaurant first!');

    const cartItems = cart.filter(
      i => i.restaurantId === selectedRestaurant.id
    );
    console.log("Cart items for this restaurant:", cartItems); // DEBUG

    if (cartItems.length === 0) return alert('No items in cart to place order!');

    const formattedItems = cartItems.map(item => ({
      menuItemId: item.id, // <-- camelCase
      quantity: item.quantity,
    }));

    setLoadingOrders(true);
    try {
      await placeGroupOrder(group.id, {
        items: formattedItems,
        nextOrderTime: group.nextOrderTime
      });

      alert('Order placed successfully!');
      clearCart();
      fetchOrders();
    } catch (err) {
      console.error('Error placing order:', err);
      alert(err.response?.data?.error || 'Failed to place order');
    } finally {
      setLoadingOrders(false);
    }
  };


  // Delete order
  const handleDeleteOrder = async () => {
    if (!window.confirm('Are you sure you want to delete your order?')) return;

    setLoadingOrders(true);
    try {
      await deleteGroupOrder(group.id);
      alert('Order deleted successfully!');
      fetchOrders();
    } catch (err) {
      console.error('Error deleting order:', err);
      alert(err.response?.data?.error || 'Failed to delete order');
    } finally {
      setLoadingOrders(false);
    }
  };


  const fetchPolls = async () => {
    setLoading(true);
    try {
      const pollsData = await getGroupPolls(group.id);
      setPolls(pollsData);
    } catch (error) {
      console.error('Error fetching polls:', error);
      alert('Failed to load polls');
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (poll, optionIndex) => {
    try {
      const optionId = poll.options[optionIndex].id || optionIndex; // Fallback to index if no ID
      await voteOnPoll(poll.id, currentUser, optionId);

      // Refresh polls to show updated votes
      await fetchPolls();
    } catch (error) {
      console.error('Error voting on poll:', error);
      alert(error.response?.data?.error || 'Failed to vote');
    }
  };

  if (!group) return null;

  const calculateTimeRemaining = (nextOrderTime) => {
    const now = Date.now(); // ms UTC
    const orderTime = new Date(nextOrderTime).getTime(); // ms UTC
    let diff = orderTime - now;

    if (diff <= 0) return "Expired";

    const hours = Math.floor(diff / (1000 * 60 * 60));
    diff -= hours * (1000 * 60 * 60);
    const minutes = Math.floor(diff / (1000 * 60));
    diff -= minutes * (1000 * 60);
    const seconds = Math.floor(diff / 1000);

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };



  const getStatus = () => {
    const membersCount = Array.isArray(group.members) ? group.members.length : 0;
    const max = group.maxMembers || 10;

    const now = new Date();
    const orderTime = new Date(group.nextOrderTime); // UTC from backend
    const diffMinutes = (orderTime - now) / 60000;

    if (membersCount >= max) return 'Full';
    if (diffMinutes <= 0) return 'Expired';
    if (diffMinutes <= 15) return 'Closing soon';
    return 'Open';
  };



  const getUserVotedOption = (poll) => {
    if (!poll.votedUsers || !poll.votedUsers.includes(currentUser)) {
      return -1;
    }
    // Find which option the user voted for
    // This requires additional backend logic to track user votes per option
    return -1; // For now, return -1
  };

  // Wrap addToCart to automatically set restaurantId
  const handleAddToCart = (item) => {
    if (!selectedRestaurant) return alert('Restaurant not loaded yet!');

    // Check if cart already has items from another restaurant
    if (cart.length > 0 && cart.some(ci => ci.restaurantId !== selectedRestaurant.id)) {
      if (!window.confirm("Your cart has items from another restaurant. Clear cart and add this item?")) {
        return;
      }
      clearCart(); // Clear cart if user confirms
    }

    // Force the restaurantId to the group's restaurant
    const itemWithRestaurant = { ...item, restaurantId: selectedRestaurant.id };
    addToCart(itemWithRestaurant);
  };



  return (
    <div className="group-detail-card">
      {/* Header */}
      <div className="group-detail-header">
        <h2 className="group-detail-name">{group.name}</h2>

        <div className="group-detail-tags">
          {/* Status tag */}
          <span
            className="group-detail-status"
            style={{
              background:
                getStatus() === 'Full'
                  ? '#fee2e2'
                  : getStatus() === 'Closing soon'
                    ? '#fef3c7'
                    : '#d1fae5',
              color:
                getStatus() === 'Full'
                  ? '#b91c1c'
                  : getStatus() === 'Closing soon'
                    ? '#78350f'
                    : '#059669',
            }}
          >
            {getStatus()}
          </span>

          {/* Admin tag */}
          {group.organizer === currentUser && (
            <span className="group-detail-admin-tag">Admin</span>
          )}
        </div>
      </div>

      {/* Info */}
      <p className="group-detail-info">
        <strong>Restaurant:</strong> {selectedRestaurant?.name || "Loading..."}
      </p>
      <p className="group-detail-info">
        <strong>Organizer:</strong> {group.organizer}
      </p>
      <p className="group-detail-info">
        <strong>Members:</strong>{' '}
        {Array.isArray(group.members) ? group.members.join(', ') : group.members} (
        {Array.isArray(group.members) ? group.members.length : 0}/{group.maxMembers})
      </p>
      <p className="group-detail-info">
        <strong>Delivery Type:</strong> {group.deliveryType}
      </p>
      <p className="group-detail-info">
        <strong>Next Order:</strong>{" "}
        {new Date(group.nextOrderTime).toLocaleString("en-US", {
          timeZone: "America/New_York",
          hour12: true,
        })}
      </p>

      <p className="group-detail-info">
        <strong>Delivery Location:</strong> {group.deliveryLocation}
      </p>
      <p className="group-detail-info">
        <strong>Countdown:</strong> {timeLeft}
      </p>

      {/* Menu */}
      <h3 className="menu-title">Menu Items</h3>
      {selectedRestaurant ? (
        <div className="menu-grid">
          {selectedRestaurant.items.map(item => (
            <MenuItemCard
              key={item.id}
              item={{ ...item, restaurantId: selectedRestaurant.id }}
              restaurant={selectedRestaurant}
              onAddToCart={handleAddToCart}
            />
          ))}
        </div>
      ) : (
        <p>Loading menu...</p>
      )}

      {/* Display Group Orders */}
      <h3 className="menu-title">Orders in this Group</h3>
      {loadingOrders ? (
        <p>Loading orders...</p>
      ) : groupOrders.length === 0 ? (
        <p>No orders placed yet.</p>
      ) : (
        <div className="orders-list">
          {(() => {
            const userOrder = groupOrders.find(o => o.username === currentUser);
            const otherOrders = groupOrders.filter(o => o.username !== currentUser);

            const calculateTotal = (order) => {
              return order.items.reduce((sum, item) => {
                const menuItem = groupMenu.find(m => m.id === item.menuItemId);
                return sum + (menuItem?.price || 0) * item.quantity;
              }, 0);
            };

            return (
              <>
                {/* User's order */}
                {userOrder && (
                  <div className="order-card user-order">
                    <p><strong>{userOrder.username}</strong>'s order (You):</p>
                    <ul>
                      {userOrder.items.map(item => {
                        const menuItem = groupMenu.find(m => m.id === item.menuItemId);
                        return (
                          <li key={item.menuItemId}>
                            {item.quantity} x {menuItem?.name || 'Item'}
                            {item.specialInstructions ? ` (Notes: ${item.specialInstructions})` : ''}
                          </li>
                        );
                      })}
                    </ul>
                    <p><strong>Total:</strong> ${calculateTotal(userOrder).toFixed(2)}</p>
                    <button className="delete-order-btn" onClick={handleDeleteOrder}>
                      Delete My Order
                    </button>
                  </div>
                )}

                {/* Toggle other orders */}
                {otherOrders.length > 0 && (
                  <div className="other-orders-section">
                    <button
                      className="toggle-orders-btn"
                      onClick={() => setShowOtherOrders(prev => !prev)}
                    >
                      {showOtherOrders ? 'Hide other orders' : `View ${otherOrders.length} other order(s)`}
                    </button>

                    {showOtherOrders && (
                      <div className="other-orders-list">
                        {otherOrders.map(order => (
                          <div key={order.id} className="order-card">
                            <p><strong>{order.username}</strong>'s order:</p>
                            <ul>
                              {order.items.map(item => {
                                const menuItem = groupMenu.find(m => m.id === item.menuItemId);
                                return (
                                  <li key={item.menuItemId}>
                                    {item.quantity} x {menuItem?.name || 'Item'}
                                    {item.specialInstructions ? ` (Notes: ${item.specialInstructions})` : ''}
                                  </li>
                                );
                              })}
                            </ul>
                            <p><strong>Total:</strong> ${calculateTotal(order).toFixed(2)}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            );
          })()}
        </div>
      )}



      {/* Toggle Polls Visibility */}
      <div style={{ margin: '20px 0' }}>
        <Button
          variant="secondary"
          onClick={() => setShowPolls(prev => !prev)}
        >
          {showPolls ? 'Hide Polls' : 'View Polls'}
        </Button>
      </div>

      {/* Polls */}
      {showPolls && (
        <div className="poll-section">
          <h3 className="poll-title">Group Polls</h3>

          {loading ? (
            <p>Loading polls...</p>
          ) : polls.length === 0 ? (
            <p className="text-gray-600 italic">No polls yet. Create one to get started!</p>
          ) : (
            polls.map(poll => {
              const userVotedIndex = getUserVotedOption(poll);

              return (
                <div key={poll.id} className="poll-card">
                  <div className="poll-header">
                    <p className="poll-question">{poll.question}</p>
                    <p className="poll-meta">
                      Created by <span className="poll-author">{poll.createdBy}</span> {/* on {" "} */}
                      {/* <span className="poll-date">
                        {new Date(poll.createdOn).toLocaleString("en-US", {
                          timeZone: "America/New_York",
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true,
                        })}
                      </span> */}
                    </p>
                  </div>

                  <div className="poll-options">
                    {poll.options.map((opt, i) => (
                      <button
                        key={i}
                        className={`poll-option ${userVotedIndex === i ? "selected" : ""}`}
                        onClick={() => handleVote(poll, i)}
                      >
                        <div className="poll-option-content">
                          <span className="poll-option-text">{opt.text}</span>
                          <span className="poll-option-votes">{opt.votes} votes</span>
                        </div>
                      </button>
                    ))}
                  </div>

                  {poll.votedUsers?.length > 0 && (
                    <p className="poll-voters">
                      <strong>Voted on by: </strong> {poll.votedUsers.join(", ")}
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}



      {/* Actions */}
      <div className="group-detail-actions">
        <Button
          variant="primary"
          onClick={() => onCreatePoll(group)}
        >
          Create Poll
        </Button>

        <Button
          variant="success"
          onClick={handlePlaceOrder}
          disabled={getStatus() === 'Expired'}>
          Place / Update Order
        </Button>


        {/* Show Edit button only for group owner */}
        {group.organizer === currentUser && (
          <Button
            variant="primary"
            onClick={() => onEditGroup(group)}
          >
            Edit Group
          </Button>
        )}

        {onClose && (
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        )}
      </div>
    </div>
  );
};

export default GroupDetail;