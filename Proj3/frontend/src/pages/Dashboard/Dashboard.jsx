// src/pages/Dashboard/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { useCart } from '../../context/CartContext';
import Navbar from '../../components/common/Navbar/Navbar';
import CartSidebar from '../../components/common/Cart/CartSidebar';
import RestaurantCard from '../../components/restaurant/RestaurantCard';
import MenuItemCard from '../../components/restaurant/MenuItemCard';
import GroupDetail from '../../components/group/GroupDetail';
import GroupCard from '../../components/group/GroupCard';
import EditGroupPage from '../EditGroup/EditGroupPage';
import Button from '../../components/common/Button/Button';
import { RESTAURANTS, PAGES } from '../../utils/constants';
import LocationPermission from '../../components/discovery/LocationPermission';
import CreatePollPage from '../Poll/CreatePollPage';
import { getUserGroups, getAllGroups, getGroupDetails, joinGroup } from '../../api/groups';
import RewardsWidget from '../../components/rewards/RewardsWidget';
import RewardsPage from '../Rewards/RewardsPage';
import { useRewards } from '../../context/RewardsContext';
import { redeemPoints, redeemCoupon } from '../../api/rewards';


import './Dashboard.css';

function Dashboard() {
  const [currentPage, setCurrentPage] = useState(PAGES.HOME);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const { addToCart } = useCart();
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [editingGroup, setEditingGroup] = useState(null);
  const [pollGroup, setPollGroup] = useState(null);

  // Backend state
  const [myGroups, setMyGroups] = useState([]);
  const [allGroups, setAllGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Filtering State
  const [filterStatus, setFilterStatus] = useState("all"); // all | open | closing | expired
  const [filterRestaurant, setFilterRestaurant] = useState("all");

  // const currentUser = 'Alice'; // Replace with actual logged-in user from auth context

  const currentUser = localStorage.getItem('username') || "Guest";
  // Fetch user's groups when navigating to MY_GROUPS
  useEffect(() => {
    if (currentPage === PAGES.MY_GROUPS) {
      fetchMyGroups();
    }
  }, [currentPage]);

  // Fetch all groups when navigating to FIND_GROUPS
  useEffect(() => {
    if (currentPage === PAGES.FIND_GROUPS) {
      fetchAllGroups();
    }
  }, [currentPage]);

  const fetchMyGroups = async () => {
    setLoading(true);
    setError('');
    try {
      const groups = await getUserGroups();
      setMyGroups(groups);
    } catch (err) {
      console.error('Error fetching my groups:', err);
      setError('Failed to load your groups');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllGroups = async () => {
    setLoading(true);
    setError('');
    try {
      const groups = await getAllGroups();
      // Filter out groups the user is already a member of
      // const availableGroups = groups.filter(g => !g.members.includes(currentUser));
      setAllGroups(groups);
    } catch (err) {
      console.error('Error fetching all groups:', err);
      setError('Failed to load groups');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    setSelectedRestaurant(null);
    setSelectedGroup(null);
  };

  const handleRestaurantClick = (restaurant) => {
    setSelectedRestaurant(restaurant);
  };

  const handleBackToRestaurants = () => {
    setSelectedRestaurant(null);
  };

  const handleViewGroup = async (group) => {
    try {
      const fullGroupData = await getGroupDetails(group.id);
      setSelectedGroup(fullGroupData);
    } catch (err) {
      console.error('Error fetching group details:', err);
      alert('Failed to load group details');
    }
  };

  const handleJoinGroup = async (group) => {
    if (window.confirm(`Do you want to join "${group.name}"?`)) {
      try {
        await joinGroup(group.id);
        alert(`Successfully joined ${group.name}!`);
        fetchAllGroups(); // Refresh the list
        fetchMyGroups(); // Update my groups as well
      } catch (err) {
        console.error('Error joining group:', err);
        alert(err.response?.data?.error || 'Failed to join group');
      }
    }
  };

  // Filter groups based on user selection
  const filteredGroups = allGroups
    // Exclude groups user already joined
    .filter((g) => !g.members.includes(currentUser))
    // Filter by restaurant
    .filter((g) => filterRestaurant === "all" || g.restaurant_id === parseInt(filterRestaurant))
    // Filter by order time status
    .filter((g) => {
      if (filterStatus === "all") return true;

      const deadline = new Date(g.nextOrderTime);
      const now = new Date();
      const diffMinutes = (deadline - now) / (1000 * 60);

      if (filterStatus === "open") return diffMinutes > 60;
      if (filterStatus === "closing") return diffMinutes <= 60 && diffMinutes > 0;
      if (filterStatus === "expired") return diffMinutes <= 0;
      return true;
    });

    const { rewards, refreshRewards } = useRewards();
          const [pointsToUse, setPointsToUse] = useState(200);
          // const [loading, setLoading] = useState(false);
          console.log(rewards);
        
          const handleRedeemPoints = async () => {
            setLoading(true);
            try {
              await redeemPoints(pointsToUse, "manual");
              await refreshRewards();
              alert(`Redeemed ${pointsToUse} points successfully!`);
            } catch (err) {
              alert(err.response?.data?.error || "Redemption failed");
            } finally {
              setLoading(false);
            }
          };
        
          const handleRedeemCoupon = async (type) => {
            setLoading(true);
            try {
              await redeemCoupon(type);
              await refreshRewards();
              alert(`Redeemed ${type} coupon successfully!`);
            } catch (err) {
              console.log(err);
              alert(err.response?.data?.error || "Coupon redemption failed");
            } finally {
              setLoading(false);
            }
          };


  return (
    <div className="dashboard-container">
      <Navbar currentPage={currentPage} onPageChange={handlePageChange} />

      <div className="main-content">
        <LocationPermission />
        {/* Home Page - Restaurant List */}
        {currentPage === PAGES.HOME && !selectedRestaurant && (
          <div>
            <h2 className="page-title">Restaurants Near You</h2>
            <RewardsWidget points={Number(localStorage.getItem("loyalty_points") || 0)} />
            <div className="restaurant-grid">
              {RESTAURANTS.map(restaurant => (
                <RestaurantCard
                  key={restaurant.id}
                  restaurant={restaurant}
                  onClick={handleRestaurantClick}
                />
              ))}
            </div>
          </div>
        )}

        {/* Home Page - Restaurant Detail */}
        {currentPage === PAGES.HOME && selectedRestaurant && (
          <div>
            <Button
              variant="secondary"
              onClick={handleBackToRestaurants}
              className="back-button"
            >
              ← Back to Restaurants
            </Button>

            <div className="restaurant-detail">
              <div className="restaurant-header">
                <div className="restaurant-emoji-large">{selectedRestaurant.image}</div>
                <div>
                  <h2 className="restaurant-title">{selectedRestaurant.name}</h2>
                  <div className="restaurant-info">
                    <span>⭐ {selectedRestaurant.rating}</span>
                    <span>📍 {selectedRestaurant.location}</span>
                  </div>
                  <div className="restaurant-offer-large">{selectedRestaurant.offers}</div>
                </div>
              </div>
            </div>

            <h3 className="menu-title">Menu Items</h3>
            <div className="menu-grid">
              {selectedRestaurant.items.map(item => (
                <MenuItemCard
                  key={item.id}
                  item={item}
                  restaurant={selectedRestaurant}
                  onAddToCart={addToCart}
                />
              ))}
            </div>
          </div>
        )}

        {/* My Groups Page */}
        {currentPage === PAGES.MY_GROUPS && (
          <div>
            {/* Inline Group Detail Card */}
            {selectedGroup && (
              <div className="mt-8">
                <GroupDetail
                  group={selectedGroup}
                  onClose={() => setSelectedGroup(null)}
                  onEditGroup={(grp) => {
                    setEditingGroup(grp);
                    setCurrentPage(PAGES.EDIT_GROUP);
                  }}
                  onCreatePoll={(grp) => {
                    setPollGroup(grp);
                    setCurrentPage(PAGES.CREATE_POLL);
                  }}
                />
              </div>
            )}

            {!selectedGroup && (
              <>
                <h2 className="page-title">My Groups</h2>

                {error && (
                  <div className="error-banner">
                    {error}
                    <Button variant="secondary" onClick={fetchMyGroups}>Retry</Button>
                  </div>
                )}

                {loading ? (
                  <div className="loading-state">
                    <p>Loading your groups...</p>
                  </div>
                ) : myGroups.length === 0 ? (
                  <div className="empty-state">
                    <p>You haven't joined any groups yet.</p>
                    <p className="empty-state-subtitle">
                      Browse available groups or create a pool when ordering!
                    </p>
                    <Button
                      variant="primary"
                      onClick={() => setCurrentPage(PAGES.FIND_GROUPS)}
                    >
                      Find Groups
                    </Button>
                  </div>
                ) : (
                  <div className="groups-grid">
                    {myGroups.map(group => (
                      <GroupCard
                        key={group.id}
                        group={group}
                        onAction={() => handleViewGroup(group)}
                        actionLabel="View Details"
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Find Groups Page */}
        {currentPage === PAGES.FIND_GROUPS && (
          <div>
            {/* <h2 className="page-title">Find Groups</h2> */}

            {error && (
              <div className="error-banner">
                {error}
                <Button variant="secondary" onClick={fetchAllGroups}>Retry</Button>
              </div>
            )}

            {/* Filter Controls */}
            <div className="filters-bar mb-4 flex gap-4 items-center">
              <div>
                <label className="font-medium mr-2">Status:</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="border rounded px-2 py-1"
                >
                  <option value="all">All</option>
                  <option value="open">Open</option>
                  <option value="closing">Closing Soon</option>
                  <option value="expired">Expired</option>
                </select>
              </div>

              <div>
                <label className="font-medium mr-2">Restaurant:</label>
                <select
                  value={filterRestaurant}
                  onChange={(e) => setFilterRestaurant(e.target.value)}
                  className="border rounded px-2 py-1"
                >
                  <option value="all">All</option>
                  {RESTAURANTS.map((r) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Filtered Results */}
            {loading ? (
              <div className="loading-state">
                <p>Loading available groups...</p>
              </div>
            ) : filteredGroups.length === 0 ? (
              <div className="empty-state">
                <p>No matching groups found.</p>
              </div>
            ) : (
              <div className="groups-grid">
                {filteredGroups.map(group => (
                  <GroupCard
                    key={group.id}
                    group={group}
                    isJoinable={true}
                    onAction={() => handleJoinGroup(group)}
                    actionLabel="Join Group"
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Edit Group Page */}
        {currentPage === PAGES.EDIT_GROUP && editingGroup && (
          <EditGroupPage
            group={editingGroup}
            onSave={(updatedGroup) => {
              console.log("Saved updated group", updatedGroup);

              // Instantly update the edited group in state
              setMyGroups((prevGroups) =>
                prevGroups.map((g) => (g.id === updatedGroup.id ? updatedGroup : g))
              );

              // If this group is currently open in detail view, update it too
              setSelectedGroup((prev) =>
                prev && prev.id === updatedGroup.id ? updatedGroup : prev
              );

              // Close edit page and refresh as backup (optional)
              setEditingGroup(null);
              setCurrentPage(PAGES.MY_GROUPS);
              fetchMyGroups(); // optional fallback to ensure backend sync
            }}
            onCancel={() => {
              setEditingGroup(null);
              setCurrentPage(PAGES.MY_GROUPS);
            }}
          />
        )}

        {/* Create Poll Page */}
        {currentPage === PAGES.CREATE_POLL && pollGroup && (
          <CreatePollPage
            group={pollGroup}
            onBack={() => {
              setPollGroup(null);
              setCurrentPage(PAGES.MY_GROUPS);
            }}
          />
        )}

        {currentPage === PAGES.REWARDS && (
        <div className="rewards-wrapper">

          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-purple-600 flex items-center justify-center">
              {/* <span className="text-white text-2xl">🎁</span> */}
            </div>
            <div>
              <h1 className="text-2xl font-bold">🎁 Rewards Dashboard</h1>
              <p className="text-gray-500">Redeem points and unlock exclusive perks</p>
            </div>
          </div>

          {/* Balance + Tier */}
          <div className="rewards-card mb-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-blue-600 text-3xl">🪙</span>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Your Balance</p>
                  <p className="text-4xl font-bold">{rewards.points} points</p>
                  {/* <p className="text-sm text-gray-500">points</p> */}
                </div>
              </div>

              <div className="text-right">
                <p className="text-sm text-gray-500 mb-1">Current Tier</p>
                <span className="px-4 py-2 rounded-lg border bg-yellow-100 text-yellow-700 font-semibold">
                  🏆 {rewards.tier}
                </span>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-6">

            {/* Redeem Points */}
            <div className="rewards-card">
              <h2 className="text-lg font-semibold mb-3">✨ Redeem Points</h2>

              <div className="flex gap-3 mb-3">
                <input
                  type="number"
                  className="border rounded px-3 py-2 w-full"
                  placeholder="Enter points (min 200)"
                  min={200}
                  value={pointsToUse}
                  onChange={(e) => setPointsToUse(Number(e.target.value))}
                />
                <Button onClick={handleRedeemPoints} disabled={loading}>
                  Redeem
                </Button>
              </div>

              <p className="text-xs text-gray-500">
                Minimum 200 points required for redemption
              </p>
            </div>

            {/* Coupons */}
            <div className="rewards-card">
              <h2 className="text-lg font-semibold mb-3">🎟️ Get Coupons</h2>

              <Button
                variant="outline"
                className="w-full flex gap-3 py-3 mb-3"
                onClick={() => handleRedeemCoupon("percent_off")}
                disabled={loading || rewards.points < 500}
              >
                <span className="text-2xl">🎫</span>
                <div className="text-left">
                  <p className="font-medium">20% Off Coupon</p>
                  <p className="text-xs text-gray-500">500 points</p>
                </div>
              </Button>

              <Button
                variant="outline"
                className="w-full flex gap-3 py-3"
                onClick={() => handleRedeemCoupon("flat")}
                disabled={loading || rewards.points < 400}
              >
                <span className="text-2xl">🍕</span>
                <div className="text-left">
                  <p className="font-medium">$4 Voucher</p>
                  <p className="text-xs text-gray-500">400 points</p>
                </div>
              </Button>
            </div>
          </div>

          {/* Active Coupons */}
          <div className="rewards-card mb-6">
            <h2 className="text-lg font-semibold mb-4">🎫 Active Coupons</h2>

            {rewards.coupons.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No active coupons</p>
            ) : (
              <div className="space-y-3">
                {rewards.coupons.map((c) => (
                  <div
                    key={c.code}
                    className="p-4 flex justify-between rounded-lg border bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                        🎟️
                      </div>
                      <div>
                        <p className="font-mono font-bold">{c.code}</p>
                        <p className="text-sm text-gray-500">
                          {c.type === "percent_off" ? `${c.value}% off` : `$${c.value} off`}
                        </p>
                      </div>
                    </div>

                    <span className="text-xs bg-gray-200 px-2 py-1 rounded">
                      Expires {new Date(c.expires_at).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
    </div>

    {/* Recent Activity */}
    <div className="rewards-card mb-12">
      <h2 className="text-lg font-semibold mb-4">📜 Recent Activity</h2>

      {rewards.ledger.map((entry, index) => (
        <div key={entry.id}>
          <div className="flex justify-between items-center py-2">
            <div className="flex items-center gap-3">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  entry.points > 0 ? "bg-green-100" : "bg-red-100"
                }`}
              >
                {entry.points > 0 ? "➕" : "➖"}
              </div>

              <p className="text-sm">
                {entry.type === "bonus" &&
                entry.meta.reason === "group_goal_points" ? (
                  <>
                    🎉 Group <b>{entry.meta.group_name}</b> hit $
                    {(entry.meta.milestone / 100).toFixed(0)}!
                  </>
                ) : (
                  <>[{entry.type}] {entry.meta && entry.meta.reason && entry.meta.reason.replace(/_/g, " ")}</>
                )}
              </p>
            </div>

            <span
              className={`font-semibold ${
                entry.points > 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {entry.points > 0 ? "+" : ""}
              {entry.points} pts
            </span>
          </div>

          {index < rewards.ledger.length - 1 && (
            <hr className="border-gray-200 my-2" />
          )}
        </div>
      ))}
    </div>

  </div>
)}
      </div>

      <CartSidebar selectedRestaurant={selectedRestaurant} />
    </div>
  );
}

export default Dashboard;