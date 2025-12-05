import React, { useState } from 'react';
import { useRewards } from '../../context/RewardsContext';
import { redeemPoints, redeemCoupon } from '../../api/rewards';
import Button from '../../components/common/Button/Button';

function RewardsPage() {
  const { rewards, refreshRewards } = useRewards();
  const [pointsToUse, setPointsToUse] = useState(200);
  const [loading, setLoading] = useState(false);
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
    <div className="rewards-page">
      <h2>🎁 Rewards Dashboard</h2>
      <p>Your Balance: <strong>{rewards.points}</strong> pts</p>
      <p>Tier: {rewards.tier}</p>

      <section>
        <h3>Redeem Points</h3>
        <input
          type="number"
          value={pointsToUse}
          onChange={(e) => setPointsToUse(e.target.value)}
          min="200"
        />
        <Button disabled={loading} onClick={handleRedeemPoints}>
          Redeem Points
        </Button>
      </section>

      <section>
        <h3>Get Coupons</h3>
        <Button onClick={() => handleRedeemCoupon("percent_off")}>
          🎫 500 pts → 20% Off Coupon
        </Button>
        <Button onClick={() => handleRedeemCoupon("flat")}>
          🍕 400 pts → $4 Voucher
        </Button>
      </section>

      <section>
        <h3>Active Coupons</h3>
        <ul>
          {rewards.coupons && rewards.coupons.map(c => (
            <li key={c.code}>
              {c.code} — {c.type === "percent_off" ? `${c.value}% off` : `$${c.value} off`}  
              (expires: {new Date(c.expires_at).toLocaleDateString()})
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3>Recent Activity</h3>
        <ul>
          {rewards.ledger && rewards.ledger.map(l => (
            <li key={l.id}>
              [{l.type}] {l.points} pts — {l.meta.reason}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export default RewardsPage;
