
import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is required');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
});

// Price IDs for your subscription plans
export const PRICE_IDS = {
  PRO_MONTHLY: process.env.STRIPE_PRO_MONTHLY_PRICE_ID || "price_1RZIf4QTNPgFvxI8M9zhGGYp",
  PRO_YEARLY: process.env.STRIPE_PRO_YEARLY_PRICE_ID || "price_1RZIf4QTNPgFvxI8M9zhGGYp",
  ENTERPRISE_MONTHLY: process.env.STRIPE_ENTERPRISE_MONTHLY_PRICE_ID || "price_1QYy4JQTNP6FvxI8OeztV7sJ",
  ENTERPRISE_YEARLY: process.env.STRIPE_ENTERPRISE_YEARLY_PRICE_ID || "price_1QYy4cQTNP6FvxI8i2p3w5rG",
};
