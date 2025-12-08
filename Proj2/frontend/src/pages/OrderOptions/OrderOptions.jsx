// src/pages/OrderOptions/OrderOptions.jsx
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Clock, Users, Zap, MapPin, TrendingDown, Leaf } from 'lucide-react';
import { createGroup, getAllGroups, joinGroup } from '../../api/groups';
import { placeGroupOrder, getGroupOrders, deleteGroupOrder, placeImmediateOrder } from '../../api/orders';
import { useRewards } from '../../context/RewardsContext';
import { quotePointsRedemption , getRewardSummary} from '../../api/rewards';
import { useCart } from '../../context/CartContext';
import { calculatePoints } from '../../components/restaurant/MenuItemCard';

function OrderOptionsModal() {
  const location = useLocation();
  const navigate = useNavigate();
  const { cart, cartTotal, restaurant } = location.state || {};
  const { clearCart } = useCart();

  const [selectedOption, setSelectedOption] = useState(null);
  const [poolTimeLimit, setPoolTimeLimit] = useState(15);
  const [maxMembers, setMaxMembers] = useState(8);
  const [deliveryLocation, setDeliveryLocation] = useState('');
  const [selectedPool, setSelectedPool] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [nearbyPools, setNearbyPools] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // const currentUser = 'Alice'; // Replace with actual logged-in user from auth context
  const currentUser = localStorage.getItem('username') || "Guest";
  const deliveryFee = 5.99;
  const estimatedDeliveryTime = "30-40 min";
  const { rewards, refreshRewards } = useRewards();
  const [redeemPoints, setRedeemPoints] = useState(0);
  const [couponCode, setCouponCode] = useState('');
  const [finalTotal, setFinalTotal] = useState(cartTotal + deliveryFee);

  // Fetch nearby pools when user selects "Join Pool"
  useEffect(() => {
    if (selectedOption === 'join') {
      fetchNearbyPools();
    }
  }, [selectedOption]);

  const fetchNearbyPools = async () => {
    setLoading(true);
    setError('');
    try {
      const allGroups = await getAllGroups();
      const nowUTC = new Date().getTime();
      const validGroups = allGroups
        .filter(g => {
          const groupTime = new Date(g.nextOrderTime).getTime();
          return groupTime > nowUTC;
        });
      // Filter groups:
      // 1. Same restaurant
      // 2. Not full
      // 3. Current user is NOT already a member
      const filtered = validGroups
        .filter(g =>
          g.restaurant_id === restaurant?.id &&
          g.members.length < g.maxMembers &&
          !g.members.includes(currentUser) // <-- exclude groups user is in
        )
        .map(g => ({
          id: g.id,
          groupData: g, // store full group data
          restaurantName: restaurant.name,
          restaurantEmoji: restaurant.image,
          organizerName: g.organizer,
          currentMembers: g.members.length,
          maxMembers: g.maxMembers,
          timeRemaining: calculateTimeRemaining(g.nextOrderTime),
          estimatedSavings: (deliveryFee / Math.max(g.members.length + 1, 2)).toFixed(2),
          deliveryLocation: g.deliveryLocation,
          distance: "0.5 km" // placeholder
        }));
      setNearbyPools(filtered);
    } catch (error) {
      console.error('Error fetching nearby pools:', error);
      setError('Failed to load nearby pools');
    } finally {
      setLoading(false);
    }
  };


  const calculateTimeRemaining = (nextOrderTime) => {
    const nowUTC = Date.now(); // UTC timestamp in ms
    const orderTimeUTC = new Date(nextOrderTime).getTime(); // parse ISO string (UTC)
    const diff = orderTimeUTC - nowUTC;

    if (diff <= 0) return "Expired";

    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes} min`;

    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m`;
  };

  const addPointsToUser = (earnedPoints) => {
  let current = Number(localStorage.getItem("loyalty_points")) || 0;
  const updated = current + earnedPoints;
  localStorage.setItem("loyalty_points", String(updated));
};


const handlePreviewRedemption = async () => {
  const subtotalCents = Math.round((cartTotal + deliveryFee) * 100);

  let newTotal = cartTotal + deliveryFee;
  let discountDetails = [];

  try {
    // 🔹 Redeem Points preview
    if (redeemPoints >= 200) {
      const data = await quotePointsRedemption(redeemPoints, subtotalCents);
      const discount = data.credit_value_cents / 100;
      newTotal -= discount;
      discountDetails.push(`-${discount.toFixed(2)} via points`);
    }

    // 🔹 Coupon preview (if entered)
    if (couponCode.trim()) {
      // const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/rewards/summary`, {
      //   headers: {
      //     Authorization: `Bearer ${localStorage.getItem("token")}`,
      //   },
      // });
      const summary = await getRewardSummary();
      // const summary = await res.json();
      const coupon = summary.coupons.find(c => c.code === couponCode);

      if (coupon && !coupon.used) {
        let couponDiscount = 0;
        if (coupon.type === "percent_off") {
          couponDiscount = newTotal * (coupon.value / 100);
        } else if (coupon.type === "flat") {
          couponDiscount = coupon.value;
        }
        newTotal -= couponDiscount;
        discountDetails.push(`-${couponDiscount.toFixed(2)} via coupon`);
      } else {
        alert("⚠️ Invalid or expired coupon code.");
      }
    }

    // 🔹 Clamp total and update UI
    newTotal = Math.max(newTotal, 0);
    setFinalTotal(newTotal);

    if (discountDetails.length > 0)
      alert(`Applied: ${discountDetails.join(" + ")}. New Total: $${newTotal.toFixed(2)}`);
    else
      alert("No valid discounts applied.");
  } catch (err) {
    console.error("Discount preview failed:", err);
    alert("Failed to preview discount.");
  }
};



  const handleOrderNow = async () => {
    if (!deliveryLocation.trim()) {
      setError('Please enter a delivery location');
      return;
    }
    setLoading(true);
    setError('');

    try {
      // Create a temporary solo group for "Immediate Order"
      const group = await createGroup({
        name: `${restaurant.name} Solo - ${currentUser}`,
        restaurant_id: restaurant.id,
        deliveryType: 'Solo',
        deliveryLocation: deliveryLocation || 'Default',
        nextOrderTime: new Date().toISOString(), // technically ignored by immediate API
        maxMembers: 1
      });

      // Map cart items to backend format
      const items = cart.map(item => ({
        menuItemId: item.id,                      // <--- key difference
        quantity: item.quantity || 1,
        specialInstructions: item.specialInstructions || ''
      }));

      // Use the new immediate order API
      // await placeImmediateOrder(group.id, items);
      await placeImmediateOrder(group.id, {
        items,
        redeemPoints,
        coupon_code: couponCode || null
      });
      await refreshRewards();
      setRedeemPoints(0);
      setCouponCode('');
      setFinalTotal(cartTotal + deliveryFee);
      const reward = calculatePoints(cartTotal, 1, restaurant.reward_multiplier, {
    streak_count: rewards.streak,
    tier_multiplier: rewards.tier_multiplier,
  });
      addPointsToUser(reward);

      setShowSuccess(true);
      clearCart();
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (err) {
      console.error('Error placing order:', err);
      setError(err.response?.data?.error || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };


  const handleCreatePool = async () => {
    if (!deliveryLocation.trim()) {
      setError('Please enter a delivery location');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Compute the absolute deadline for the pool
      const nextOrderTimeUTC = new Date(Date.now() + poolTimeLimit * 60000).toISOString();

      const items = cart.map(item => ({
        menuItemId: item.id,
        quantity: item.quantity || 1,
        specialInstructions: item.specialInstructions || ''
      }));

      const groupData = {
        name: `${restaurant.name} Pool - ${currentUser}`,
        restaurant_id: restaurant.id,
        deliveryType: 'Split',
        deliveryLocation,
        nextOrderTime: nextOrderTimeUTC,
        maxMembers
      };

      // Create the pool — backend will store `next_order_time` correctly
      const newGroup = await createGroup(groupData);

      // Place organizer's order using the same `nextOrderTime`
      // await placeGroupOrder(newGroup.id, {
      //   nextOrderTime: nextOrderTimeUTC,
      //   items
      // });
      await placeGroupOrder(newGroup.id, {
        nextOrderTime: nextOrderTimeUTC,
        items,
        redeemPoints,
        coupon_code: couponCode || null
      });
      await refreshRewards();
      setRedeemPoints(0);
      setCouponCode('');
      setFinalTotal(cartTotal + deliveryFee);
      const reward = calculatePoints(cartTotal, maxMembers, restaurant.reward_multiplier,{
    streak_count: rewards.streak,
    tier_multiplier: rewards.tier_multiplier,
  });
      addPointsToUser(reward);

      setShowSuccess(true);
      clearCart();
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (err) {
      console.error('Error creating pool:', err);
      setError(err.response?.data?.error || 'Failed to create pool');
    } finally {
      setLoading(false);
    }
  };


  const handleJoinPool = async (pool) => {
    setLoading(true);
    setError('');
    try {
      await joinGroup(pool.id);

      // Place the joining user's order
      await placeGroupOrder(pool.id, {
        nextOrderTime: pool.groupData.nextOrderTime, // ISO string from backend
        items: cart.map(item => ({
          menuItemId: item.id,
          quantity: item.quantity || 1,
          specialInstructions: item.specialInstructions || ''
        }))
      });

      const poolSize = pool.groupData.members.length + 1;
      const reward = calculatePoints(cartTotal, poolSize, restaurant.reward_multiplier,{
    streak_count: rewards.streak,
    tier_multiplier: rewards.tier_multiplier,
  });
      addPointsToUser(reward);


      setSelectedPool(pool);
      setShowSuccess(true);
      clearCart();
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (err) {
      console.error('Error joining pool:', err);
      setError(err.response?.data?.error || 'Failed to join pool');
    } finally {
      setLoading(false);
    }
  };

  // Guard clause if no cart data
  if (!cart || !restaurant) {
    return (
      <div style={styles.container}>
        <div style={styles.modal}>
          <div style={styles.header}>
            <h2 style={styles.title}>No Order Data</h2>
            <p style={styles.subtitle}>Please add items to cart first</p>
          </div>
          <button style={styles.confirmButton} onClick={() => navigate('/dashboard')}>
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.modal}>
        {/* Header */}
        <div style={styles.header}>
          <h2 style={styles.title}>How would you like to order?</h2>
          <p style={styles.subtitle}>Choose the best option for your order</p>
        </div>

        {/* Order Summary */}
        <div style={styles.orderSummary}>
          <div style={styles.summaryRow}>
            <span>Order Total</span>
            <span style={styles.boldText}>${cartTotal.toFixed(2)}</span>
          </div>
          <div style={styles.summaryRow}>
            <span>Delivery Fee</span>
            <span>${deliveryFee.toFixed(2)}</span>
          </div>
          <div style={{ ...styles.summaryRow, ...styles.totalRow }}>
            <span style={styles.boldText}>Total</span>
            <span style={styles.totalAmount}>${(cartTotal + deliveryFee).toFixed(2)}</span>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div style={styles.errorMessage}>
            {error}
          </div>
        )}

        {/* Options Grid */}
        {!selectedOption && (
          <div style={styles.optionsGrid}>
            {/* Order Now */}
            <div
              style={styles.optionCard}
              onClick={() => setSelectedOption('now')}
            >
              <div style={styles.optionIcon}>
                <Zap size={32} color="#2563eb" />
              </div>
              <h3 style={styles.optionTitle}>Order Now</h3>
              <p style={styles.optionDescription}>
                Place your order immediately and get it delivered solo
              </p>
              <div style={styles.optionBadge}>
                <Clock size={16} />
                <span>{estimatedDeliveryTime}</span>
              </div>
              <div style={styles.optionDetails}>
              <div style={styles.rewardPreview}>
                ⭐ Earn ~{calculatePoints(cartTotal, 1, restaurant.reward_multiplier,{
    streak_count: rewards.streak,
    tier_multiplier: rewards.tier_multiplier,
  })} points
              </div>
                <div>Full delivery fee: ${deliveryFee.toFixed(2)}</div>
              </div>
              <button style={styles.optionButton}>
                Order Now
              </button>
            </div>

            {/* Create Pool */}
            <div
              style={{ ...styles.optionCard, ...styles.recommendedCard }}
              onClick={() => setSelectedOption('create')}
            >
              <div style={styles.recommendedBadge}>
                Recommended
              </div>
              <div style={styles.optionIcon}>
                <Users size={32} color="#059669" />
              </div>
              <h3 style={styles.optionTitle}>Create a Pool</h3>
              <p style={styles.optionDescription}>
                Start a new pool and save money when others join
              </p>
              <div style={styles.optionBadge}>
                <TrendingDown size={16} />
                <span>Save up to 80%</span>
              </div>
              <div style={styles.optionDetails}>
              <div style={styles.rewardPreview}>
                ⭐ Potential: ~{calculatePoints(cartTotal, maxMembers, restaurant.reward_multiplier,{
    streak_count: rewards.streak,
    tier_multiplier: rewards.tier_multiplier,
  })} points
              </div>
              <p style={{ fontSize: '12px', color: '#6b7280' }}>
                (Assuming {maxMembers} members join)
              </p>
                <div>Set time limit for others to join</div>
                <div>Split delivery costs</div>
              </div>
              <button style={{ ...styles.optionButton, ...styles.createButton }}>
                Create Pool
              </button>
            </div>

            {/* Join Pool */}
            <div
              style={styles.optionCard}
              onClick={() => setSelectedOption('join')}
            >
              <div style={styles.optionIcon}>
                <MapPin size={32} color="#7c3aed" />
              </div>
              <h3 style={styles.optionTitle}>Join a Pool</h3>
              <p style={styles.optionDescription}>
                Join an existing pool nearby and save instantly
              </p>
              <div style={styles.optionBadge}>
                <Users size={16} />
                <span>Browse available pools</span>
              </div>
              <div style={styles.optionDetails}>
                <div>Instant savings</div>
                <div>Meet new people</div>
              </div>
              <button style={{ ...styles.optionButton, ...styles.joinButton }}>
                Browse Pools
              </button>
            </div>
          </div>
        )}

        {/* Order Now Confirmation */}
        {selectedOption === 'now' && !showSuccess && (
          <div style={styles.detailView}>
            <button style={styles.backButton} onClick={() => setSelectedOption(null)}>
              ← Back to options
            </button>

            <div style={styles.confirmCard}>
              <Zap size={48} color="#2563eb" style={{ marginBottom: '16px' }} />
              <h3 style={styles.confirmTitle}>Confirm Immediate Order</h3>
              <p style={styles.confirmText}>
                Your order will be placed right away and delivered to your location.
              </p>

              <div style={styles.confirmDetails}>
                <div style={styles.confirmRow}>
                  <span>Estimated Delivery</span>
                  <span style={styles.boldText}>{estimatedDeliveryTime}</span>
                </div>
                <div style={styles.confirmRow}>
                  <span>Total Amount</span>
                  <span style={styles.boldText}>${(cartTotal + deliveryFee).toFixed(2)}</span>
                </div>
              </div>

              <div style={styles.configSection}>
                <label style={styles.label}>
                  Delivery Location
                  <span style={styles.labelHelper}>Where should the order be delivered?</span>
                </label>
                <input
                  type="text"
                  value={deliveryLocation}
                  onChange={(e) => setDeliveryLocation(e.target.value)}
                  placeholder="Default"
                  style={styles.input}
                />
              </div>

              {/* Reward Options */}
<div style={{ marginTop: '20px', textAlign: 'left' }}>
  <h4 style={{ fontWeight: '600', color: '#1f2937' }}>💎 Use Your Rewards</h4>
  <p style={{ color: '#6b7280' }}>Available Points: {rewards.points}</p>

  <label style={{ display: 'block', marginTop: '8px' }}>Redeem Points:</label>
  <input
    type="number"
    min="0"
    max={rewards.points}
    value={redeemPoints}
    onChange={(e) => setRedeemPoints(Number(e.target.value))}
    style={styles.input}
    placeholder="e.g., 500"
  />

  <label style={{ display: 'block', marginTop: '12px' }}>Coupon Code:</label>
  <input
    type="text"
    value={couponCode}
    onChange={(e) => setCouponCode(e.target.value)}
    placeholder="Optional"
    style={styles.input}
  />

  <button
    onClick={handlePreviewRedemption}
    style={{
      marginTop: '6px',
      background: '#e0f2fe',
      border: '1px solid #2563eb',
      padding: '8px 12px',
      borderRadius: '6px',
      cursor: 'pointer'
    }}
  >
    Preview Discount
  </button>

  {finalTotal !== cartTotal + deliveryFee && (
  <p style={{ marginTop: '12px', fontWeight: '600', color: '#2563eb' }}>
    🎉 New Total After Discounts: ${finalTotal.toFixed(2)}
  </p>
)}

  <p style={{ marginTop: '12px', fontWeight: '600', color: '#2563eb' }}>
    Final Payable: ${finalTotal.toFixed(2)}
  </p>
</div>



              <button
                style={styles.confirmButton}
                onClick={handleOrderNow}
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Confirm & Place Order'}
              </button>
            </div>
          </div>
        )}

        {/* Create Pool Configuration */}
        {selectedOption === 'create' && !showSuccess && (
          <div style={styles.detailView}>
            <button style={styles.backButton} onClick={() => setSelectedOption(null)}>
              ← Back to options
            </button>

            <div style={styles.confirmCard}>
              <Users size={48} color="#059669" style={{ marginBottom: '16px' }} />
              <h3 style={styles.confirmTitle}>Configure Your Pool</h3>
              <p style={styles.confirmText}>
                Set parameters for your pool. If no one joins within the time limit, your order will be placed automatically.
              </p>

              <div style={styles.configSection}>
                <label style={styles.label}>
                  Delivery Location
                  <span style={styles.labelHelper}>Where should the order be delivered?</span>
                </label>
                <input
                  type="text"
                  value={deliveryLocation}
                  onChange={(e) => setDeliveryLocation(e.target.value)}
                  placeholder="e.g., Building A, Floor 3"
                  style={styles.input}
                />
              </div>

              <div style={styles.configSection}>
                <label style={styles.label}>
                  Time Limit
                  <span style={styles.labelHelper}>How long to wait for others?</span>
                </label>
                <div style={styles.sliderContainer}>
                  <input
                    type="range"
                    min="5"
                    max="30"
                    step="5"
                    value={poolTimeLimit}
                    onChange={(e) => setPoolTimeLimit(parseInt(e.target.value))}
                    style={styles.slider}
                  />
                  <div style={styles.sliderValue}>
                    <Clock size={16} />
                    <span>{poolTimeLimit} minutes</span>
                  </div>
                </div>
              </div>

              {/* Reward Options */}
<div style={{ marginTop: '20px', textAlign: 'left' }}>
  <h4 style={{ fontWeight: '600', color: '#1f2937' }}>💎 Use Your Rewards</h4>
  <p style={{ color: '#6b7280' }}>Available Points: {rewards.points}</p>

  <label style={{ display: 'block', marginTop: '8px' }}>Redeem Points:</label>
  <input
    type="number"
    min="0"
    max={rewards.points}
    value={redeemPoints}
    onChange={(e) => setRedeemPoints(Number(e.target.value))}
    style={styles.input}
    placeholder="e.g., 500"
  />

  <label style={{ display: 'block', marginTop: '12px' }}>Coupon Code:</label>
  <input
    type="text"
    value={couponCode}
    onChange={(e) => setCouponCode(e.target.value)}
    placeholder="Optional"
    style={styles.input}
  />

  <button
    onClick={handlePreviewRedemption}
    style={{
      marginTop: '6px',
      background: '#e0f2fe',
      border: '1px solid #2563eb',
      padding: '8px 12px',
      borderRadius: '6px',
      cursor: 'pointer'
    }}
  >
    Preview Discount
  </button>

  {finalTotal !== cartTotal + deliveryFee && (
  <p style={{ marginTop: '12px', fontWeight: '600', color: '#2563eb' }}>
    🎉 New Total After Discounts: ${finalTotal.toFixed(2)}
  </p>
)}

  <p style={{ marginTop: '12px', fontWeight: '600', color: '#2563eb' }}>
    Final Payable: ${finalTotal.toFixed(2)}
  </p>
</div>


              <div style={styles.configSection}>
                <label style={styles.label}>
                  Maximum Members
                  <span style={styles.labelHelper}>Cap the pool size</span>
                </label>
                <div style={styles.sliderContainer}>
                  <input
                    type="range"
                    min="2"
                    max="15"
                    step="1"
                    value={maxMembers}
                    onChange={(e) => setMaxMembers(parseInt(e.target.value))}
                    style={styles.slider}
                  />
                  <div style={styles.sliderValue}>
                    <Users size={16} />
                    <span>{maxMembers} people</span>
                  </div>
                </div>
              </div>

              <div style={styles.savingsEstimate}>
                <Leaf size={20} color="#059669" />
                <div>
                  <div style={styles.savingsTitle}>Estimated Savings</div>
                  <div style={styles.savingsAmount}>
                    ${(deliveryFee * 0.75).toFixed(2)} - ${(deliveryFee * 0.9).toFixed(2)}
                  </div>
                  <div style={styles.savingsNote}>Based on 3-5 members joining</div>
                </div>
              </div>

              <button
                style={{ ...styles.confirmButton, backgroundColor: '#059669' }}
                onClick={handleCreatePool}
                disabled={loading || !deliveryLocation.trim()}
              >
                {loading ? 'Creating Pool...' : 'Create Pool & Wait'}
              </button>
            </div>
          </div>
        )}

        {/* Join Pool - Browse Pools */}
        {selectedOption === 'join' && !showSuccess && (
          <div style={styles.detailView}>
            <button style={styles.backButton} onClick={() => setSelectedOption(null)}>
              ← Back to options
            </button>

            <h3 style={styles.sectionTitle}>Available Pools Nearby</h3>
            <p style={styles.sectionSubtitle}>Join a pool and save on delivery costs instantly</p>

            {loading ? (
              <div style={styles.loadingMessage}>Loading available pools...</div>
            ) : nearbyPools.length === 0 ? (
              <div style={styles.emptyState}>
                <p>No active pools found for {restaurant.name}</p>
                <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '8px' }}>
                  Be the first to create one!
                </p>
                <button
                  style={{ ...styles.confirmButton, marginTop: '16px' }}
                  onClick={() => setSelectedOption('create')}
                >
                  Create a Pool
                </button>
              </div>
            ) : (
              <div style={styles.poolsList}>
                {nearbyPools.map(pool => (
                  <div key={pool.id} style={styles.poolCard}>
                    <div style={styles.poolHeader}>
                      <div style={styles.poolRestaurant}>
                        <span style={styles.restaurantEmoji}>{pool.restaurantEmoji}</span>
                        <div>
                          <div style={styles.poolRestaurantName}>{pool.restaurantName}</div>
                          <div style={styles.poolOrganizer}>by {pool.organizerName}</div>
                        </div>
                      </div>
                      <div style={styles.timeRemaining}>
                        <Clock size={16} />
                        <span>{pool.timeRemaining}</span>
                      </div>
                    </div>

                    <div style={styles.poolStats}>
                      <div style={styles.poolStat}>
                        <Users size={16} color="#6b7280" />
                        <span>{pool.currentMembers}/{pool.maxMembers} members</span>
                      </div>
                      <div style={styles.poolStat}>
                        <MapPin size={16} color="#6b7280" />
                        <span>{pool.distance}</span>
                      </div>
                    </div>

                    <div style={styles.poolLocation}>
                      <MapPin size={14} />
                      <span>{pool.deliveryLocation}</span>
                    </div>

                    {/* Reward Options */}
<div style={{ marginTop: '20px', textAlign: 'left' }}>
  <h4 style={{ fontWeight: '600', color: '#1f2937' }}>💎 Use Your Rewards</h4>
  <p style={{ color: '#6b7280' }}>Available Points: {rewards.points}</p>

  <label style={{ display: 'block', marginTop: '8px' }}>Redeem Points:</label>
  <input
    type="number"
    min="0"
    max={rewards.points}
    value={redeemPoints}
    onChange={(e) => setRedeemPoints(Number(e.target.value))}
    style={styles.input}
    placeholder="e.g., 500"
  />

  <label style={{ display: 'block', marginTop: '12px' }}>Coupon Code:</label>
  <input
    type="text"
    value={couponCode}
    onChange={(e) => setCouponCode(e.target.value)}
    placeholder="Optional"
    style={styles.input}
  />

  <button
    onClick={handlePreviewRedemption}
    style={{
      marginTop: '6px',
      background: '#e0f2fe',
      border: '1px solid #2563eb',
      padding: '8px 12px',
      borderRadius: '6px',
      cursor: 'pointer'
    }}
  >
    Preview Discount
  </button>

  {finalTotal !== cartTotal + deliveryFee && (
  <p style={{ marginTop: '12px', fontWeight: '600', color: '#2563eb' }}>
    🎉 New Total After Discounts: ${finalTotal.toFixed(2)}
  </p>
)}

  <p style={{ marginTop: '12px', fontWeight: '600', color: '#2563eb' }}>
    Final Payable: ${finalTotal.toFixed(2)}
  </p>
</div>


                    <div style={styles.poolSavings}>
                    <div style={styles.poolRewards}>
                      ⭐ Earn ~{calculatePoints(cartTotal, pool.currentMembers + 1, restaurant.reward_multiplier,{
    streak_count: rewards.streak,
    tier_multiplier: rewards.tier_multiplier,
  })} points
                    </div>
                      <TrendingDown size={18} color="#059669" />
                      <span>Save ${pool.estimatedSavings} on delivery</span>
                    </div>

                    <button
                      style={styles.joinPoolButton}
                      onClick={() => handleJoinPool(pool)}
                      disabled={loading || pool.groupData.members.includes(currentUser)}
                    >
                      {loading ? 'Joining...' : pool.groupData.members.includes(currentUser) ? 'Already Joined' : 'Join This Pool'}
                    </button>

                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Success Message */}
        {showSuccess && (
          <div style={styles.successOverlay}>
            <div style={styles.successCard}>
              <div style={styles.successIcon}>✓</div>
              <h3 style={styles.successTitle}>
                {selectedOption === 'now' && 'Order Placed Successfully!'}
                {selectedOption === 'create' && 'Pool Created!'}
                {selectedOption === 'join' && 'Joined Pool Successfully!'}
              </h3>
              <p style={styles.successText}>
                {selectedOption === 'now' && 'Your order is being prepared and will be delivered soon.'}
                {selectedOption === 'create' && `Waiting for others to join. Order will auto-place in ${poolTimeLimit} min.`}
                {selectedOption === 'join' && 'You\'re now part of this pool. Redirecting to dashboard...'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(to bottom right, #e0f2fe, #dbeafe)',
    padding: '40px 20px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start'
  },
  modal: {
    width: '100%',
    maxWidth: '1200px',
    background: 'white',
    borderRadius: '16px',
    boxShadow: '0 20px 50px rgba(0,0,0,0.1)',
    overflow: 'hidden'
  },
  header: {
    padding: '32px',
    borderBottom: '1px solid #e5e7eb',
    textAlign: 'center'
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#1f2937',
    margin: '0 0 8px 0'
  },
  subtitle: {
    fontSize: '16px',
    color: '#6b7280',
    margin: 0
  },
  orderSummary: {
    padding: '24px 32px',
    background: '#f9fafb',
    borderBottom: '1px solid #e5e7eb'
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '12px',
    fontSize: '16px',
    color: '#4b5563'
  },
  totalRow: {
    paddingTop: '12px',
    borderTop: '2px solid #d1d5db',
    marginTop: '8px',
    marginBottom: 0
  },
  boldText: {
    fontWeight: '600',
    color: '#1f2937'
  },
  totalAmount: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#2563eb'
  },
  errorMessage: {
    margin: '20px 32px',
    padding: '12px 16px',
    background: '#fee2e2',
    color: '#b91c1c',
    borderRadius: '8px',
    fontSize: '14px'
  },
  optionsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '24px',
    padding: '32px'
  },
  optionCard: {
    background: 'white',
    border: '2px solid #e5e7eb',
    borderRadius: '12px',
    padding: '24px',
    cursor: 'pointer',
    transition: 'all 0.3s',
    position: 'relative'
  },
  recommendedCard: {
    borderColor: '#059669',
    background: 'linear-gradient(to bottom, #d1fae5, white)'
  },
  recommendedBadge: {
    position: 'absolute',
    top: '-12px',
    right: '24px',
    background: '#059669',
    color: 'white',
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600'
  },
  optionIcon: {
    marginBottom: '16px'
  },
  optionTitle: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: '8px'
  },
  optionDescription: {
    fontSize: '14px',
    color: '#6b7280',
    marginBottom: '16px',
    lineHeight: '1.5'
  },
  optionBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    background: '#f3f4f6',
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '14px',
    color: '#4b5563',
    marginBottom: '16px'
  },
  optionDetails: {
    fontSize: '13px',
    color: '#6b7280',
    marginBottom: '20px',
    lineHeight: '1.8'
  },
  optionButton: {
    width: '100%',
    background: '#2563eb',
    color: 'white',
    border: 'none',
    padding: '12px',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background 0.3s'
  },
  createButton: {
    background: '#059669'
  },
  joinButton: {
    background: '#7c3aed'
  },
  detailView: {
    padding: '32px'
  },
  backButton: {
    background: 'none',
    border: 'none',
    color: '#2563eb',
    fontSize: '16px',
    cursor: 'pointer',
    marginBottom: '24px',
    fontWeight: '500'
  },
  confirmCard: {
    background: '#f9fafb',
    borderRadius: '12px',
    padding: '32px',
    textAlign: 'center',
    maxWidth: '600px',
    margin: '0 auto'
  },
  confirmTitle: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: '12px'
  },
  confirmText: {
    fontSize: '16px',
    color: '#6b7280',
    marginBottom: '24px',
    lineHeight: '1.6'
  },
  confirmDetails: {
    background: 'white',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '24px'
  },
  confirmRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '12px 0',
    fontSize: '16px',
    color: '#4b5563'
  },
  confirmButton: {
    width: '100%',
    background: '#2563eb',
    color: 'white',
    border: 'none',
    padding: '16px',
    borderRadius: '8px',
    fontSize: '18px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background 0.3s'
  },
  configSection: {
    marginBottom: '24px',
    textAlign: 'left'
  },
  label: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    fontSize: '16px',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '12px'
  },
  labelHelper: {
    fontSize: '13px',
    fontWeight: '400',
    color: '#6b7280'
  },
  input: {
    width: '100%',
    padding: '12px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '16px',
    boxSizing: 'border-box'
  },
  sliderContainer: {
    background: 'white',
    padding: '16px',
    borderRadius: '8px'
  },
  slider: {
    width: '100%',
    height: '6px',
    borderRadius: '3px',
    outline: 'none',
    marginBottom: '12px'
  },
  sliderValue: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontSize: '16px',
    fontWeight: '600',
    color: '#059669'
  },
  savingsEstimate: {
    display: 'flex',
    gap: '16px',
    background: '#d1fae5',
    padding: '16px',
    borderRadius: '8px',
    marginBottom: '24px',
    textAlign: 'left'
  },
  savingsTitle: {
    fontSize: '14px',
    color: '#065f46',
    marginBottom: '4px'
  },
  savingsAmount: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#059669',
    marginBottom: '4px'
  },
  savingsNote: {
    fontSize: '12px',
    color: '#047857'
  },
  sectionTitle: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: '8px'
  },
  sectionSubtitle: {
    fontSize: '16px',
    color: '#6b7280',
    marginBottom: '24px'
  },
  loadingMessage: {
    textAlign: 'center',
    padding: '40px',
    fontSize: '16px',
    color: '#6b7280'
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px',
    background: '#f9fafb',
    borderRadius: '12px',
    marginTop: '20px'
  },
  poolsList: {
    display: 'grid',
    gap: '16px'
  },
  poolCard: {
    background: '#f9fafb',
    border: '2px solid #e5e7eb',
    borderRadius: '12px',
    padding: '20px',
    transition: 'all 0.3s'
  },
  poolHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '16px'
  },
  poolRestaurant: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center'
  },
  restaurantEmoji: {
    fontSize: '40px'
  },
  poolRestaurantName: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#1f2937'
  },
  poolOrganizer: {
    fontSize: '14px',
    color: '#6b7280'
  },
  timeRemaining: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    background: '#fef3c7',
    color: '#92400e',
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '14px',
    fontWeight: '600'
  },
  poolStats: {
    display: 'flex',
    gap: '24px',
    marginBottom: '12px'
  },
  poolStat: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '14px',
    color: '#6b7280'
  },
  poolLocation: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '14px',
    color: '#6b7280',
    marginBottom: '12px'
  },
  poolSavings: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: '#d1fae5',
    color: '#065f46',
    padding: '10px 16px',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: '600',
    marginBottom: '16px'
  },
  joinPoolButton: {
    width: '100%',
    background: '#7c3aed',
    color: 'white',
    border: 'none',
    padding: '12px',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background 0.3s'
  },
  successOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000
  },
  successCard: {
    background: 'white',
    borderRadius: '16px',
    padding: '48px',
    textAlign: 'center',
    maxWidth: '400px',
    boxShadow: '0 20px 50px rgba(0,0,0,0.2)'
  },
  successIcon: {
    width: '64px',
    height: '64px',
    background: '#d1fae5',
    color: '#059669',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '32px',
    fontWeight: 'bold',
    margin: '0 auto 24px'
  },
  successTitle: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: '12px'
  },
  successText: {
    fontSize: '16px',
    color: '#6b7280',
    lineHeight: '1.6'
  }
};

export default OrderOptionsModal;
