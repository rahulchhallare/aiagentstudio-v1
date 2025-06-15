
import Razorpay from 'razorpay';

if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  throw new Error('RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are required');
}

export const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Plan IDs for your subscription plans
export const PLAN_IDS = {
  PRO_MONTHLY: process.env.RAZORPAY_PRO_MONTHLY_PLAN_ID || "plan_pro_monthly",
  PRO_YEARLY: process.env.RAZORPAY_PRO_YEARLY_PLAN_ID || "plan_pro_yearly", 
  ENTERPRISE_MONTHLY: process.env.RAZORPAY_ENTERPRISE_MONTHLY_PLAN_ID || "plan_enterprise_monthly",
  ENTERPRISE_YEARLY: process.env.RAZORPAY_ENTERPRISE_YEARLY_PLAN_ID || "plan_enterprise_yearly",
};

// Pricing for plans (in paise - Razorpay uses paise as base unit)
export const PLAN_PRICING = {
  PRO_MONTHLY: 2900, // ₹29
  PRO_YEARLY: 29000, // ₹290
  ENTERPRISE_MONTHLY: 9900, // ₹99
  ENTERPRISE_YEARLY: 99000, // ₹990
};
