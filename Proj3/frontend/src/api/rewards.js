import api from './axios';

export const getRewardSummary = async () => {
  const res = await api.get('/rewards/summary');
  return res.data;
};

export const quotePointsRedemption = async (points, subtotalCents) => {
  const res = await api.post('/rewards/quote', {
    points_to_use: points,
    order_subtotal_cents: subtotalCents
  },
{
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
  return res.data;
};

export const redeemPoints = async (points, reason = "manual") => {
  const res = await api.post('/rewards/redeem', {
    points_to_use: points,
    reason
  });
  return res.data;
};

export const redeemCoupon = async (type, restaurant_id = null) => {
  const res = await api.post('/rewards/redeem-coupon', {
    type,
    restaurant_id
  });
  return res.data;
};
