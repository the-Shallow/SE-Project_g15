// src/pages/EditGroup/EditGroupPage.jsx
import React, { useState } from "react";
import Button from "../../components/common/Button/Button";
import { RESTAURANTS } from "../../utils/constants";
import { updateGroup } from "../../api/groups";
import "./EditGroupPage.css";

const EditGroupPage = ({ group, onSave, onCancel }) => {
  const [restaurantId, setRestaurantId] = useState(group.restaurant_id);
  const [deliveryLocation, setDeliveryLocation] = useState(group.deliveryLocation);
  const [nextOrderTime, setNextOrderTime] = useState(
    new Date(group.nextOrderTime).toISOString().slice(0, 16)
  );
  const [maxMembers, setMaxMembers] = useState(group.maxMembers || 10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    console.log("Saving group update...");
    setLoading(true);
    setError('');

    try {
      const updatedData = {
        restaurant_id: parseInt(restaurantId),
        deliveryLocation,
        nextOrderTime: new Date(nextOrderTime).toISOString(),
        maxMembers: parseInt(maxMembers)
      };
      console.log("Payload:", updatedData);

      const updatedGroup = await updateGroup(group.id, updatedData);
      alert('Group updated successfully!');
      console.log("Response:", updatedGroup);
      onSave(updatedGroup);
    } catch (err) {
      console.error('Error updating group:', err);
      setError(err.response?.data?.error || 'Failed to update group');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="edit-group-container">
      <h2>Edit Group Details</h2>

      {error && (
        <div className="error-message">{error}</div>
      )}

      <div className="form-group">
        <label htmlFor="restaurant">Restaurant</label>
        <select
          id="restaurant"
          value={restaurantId}
          onChange={(e) => setRestaurantId(e.target.value)}
          className="form-select"
        >
          {RESTAURANTS.map(r => (
            <option key={r.id} value={r.id}>{r.image} {r.name}</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="deliveryLocation">Delivery Location</label>
        <input
          id="deliveryLocation"
          type="text"
          value={deliveryLocation}
          onChange={(e) => setDeliveryLocation(e.target.value)}
          className="form-input"
          placeholder="Enter delivery location"
        />
      </div>

      <div className="form-group">
        <label htmlFor="nextOrderTime">Next Order Time</label>
        <input
          id="nextOrderTime"
          type="datetime-local"
          value={nextOrderTime}
          onChange={(e) => setNextOrderTime(e.target.value)}
          className="form-input"
        />
      </div>

      <div className="form-group">
        <label htmlFor="maxMembers">Max Members</label>
        <input
          id="maxMembers"
          type="number"
          value={maxMembers}
          onChange={(e) => setMaxMembers(e.target.value)}
          className="form-input"
          min="2"
          max="50"
        />
      </div>

      <div className="edit-group-actions">
        <Button 
          variant="success" 
          onClick={handleSave}
          loading={loading}
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
        <Button 
          variant="secondary" 
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
};

export default EditGroupPage;
