import React from "react";
import "./RewardsWidget.css";

const getTier = (points) => {
  if (points >= 700) return "Platinum";
  if (points >= 300) return "Gold";
  if (points >= 100) return "Silver";
  return "Bronze";
};

const getCashbackPercent = (tier) => {
  return {
    Bronze: 1,
    Silver: 2,
    Gold: 3,
    Platinum: 5,
  }[tier];
};

const nextTierInfo = (points) => {
  if (points >= 700) return { nextTier: "Max tier reached", remaining: 0 };
  if (points >= 300) return { nextTier: "Platinum", remaining: 700 - points };
  if (points >= 100) return { nextTier: "Gold", remaining: 300 - points };
  return { nextTier: "Silver", remaining: 100 - points };
};

function RewardsWidget({ points = 0 }) {
  const tier = getTier(points);
  const cashback = getCashbackPercent(tier);
  const { nextTier, remaining } = nextTierInfo(points);

  return (
    <div className="rewards-widget">
      <div className="rewards-header">
        <span className="rewards-title">Your Rewards</span>
        <span className={`tier-badge tier-${tier.toLowerCase()}`}>{tier}</span>
      </div>

      <div className="rewards-body">
        <div className="rewards-row">
          <span>Points</span>
          <span className="rewards-strong">{points}</span>
        </div>
        <div className="rewards-row">
          <span>Cashback</span>
          <span className="rewards-strong">{cashback}%</span>
        </div>

        {remaining > 0 ? (
          <div className="rewards-next">
            Next tier: <b>{nextTier}</b> in {remaining} pts
          </div>
        ) : (
          <div className="rewards-next">🎉 {nextTier}</div>
        )}
      </div>
    </div>
  );
}

export default RewardsWidget;
