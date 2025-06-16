
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
  PRO_MONTHLY: process.env.RAZORPAY_PRO_MONTHLY_PLAN_ID || "plan_QhReRFpIgKH7uT",
  PRO_YEARLY: process.env.RAZORPAY_PRO_YEARLY_PLAN_ID || "plan_pro_yearly", 
  ENTERPRISE_MONTHLY: process.env.RAZORPAY_ENTERPRISE_MONTHLY_PLAN_ID || "plan_enterprise_monthly",
  ENTERPRISE_YEARLY: process.env.RAZORPAY_ENTERPRISE_YEARLY_PLAN_ID || "plan_enterprise_yearly",
};

// USD to INR conversion rate (approximate - you may want to use a live rate)
const USD_TO_INR_RATE = 83; // 1 USD = 83 INR (approximate)

// Pricing for plans (in paise - Razorpay uses paise as base unit)
// Converted from USD prices: $29 = ₹2407, $290 = ₹24070, $99 = ₹8217, $990 = ₹82170
export const PLAN_PRICING = {
  PRO_MONTHLY: Math.round(29 * USD_TO_INR_RATE * 100), // $29 = ₹2407 = 240700 paise
  PRO_YEARLY: Math.round(290 * USD_TO_INR_RATE * 100), // $290 = ₹24070 = 2407000 paise
  ENTERPRISE_MONTHLY: Math.round(99 * USD_TO_INR_RATE * 100), // $99 = ₹8217 = 821700 paise
  ENTERPRISE_YEARLY: Math.round(990 * USD_TO_INR_RATE * 100), // $990 = ₹82170 = 8217000 paise
};

// USD prices for display on website
export const USD_PRICES = {
  PRO_MONTHLY: 29,
  PRO_YEARLY: 290,
  ENTERPRISE_MONTHLY: 99,
  ENTERPRISE_YEARLY: 990,
};
