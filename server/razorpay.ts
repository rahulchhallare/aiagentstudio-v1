
import Razorpay from 'razorpay';

if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  throw new Error('RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are required');
}

export const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Plan IDs for your subscription plans - these should be set in your Replit secrets
export const PLAN_IDS = {
  PRO_MONTHLY: process.env.RAZORPAY_PRO_MONTHLY_PLAN_ID,
  PRO_YEARLY: process.env.RAZORPAY_PRO_YEARLY_PLAN_ID,
  ENTERPRISE_MONTHLY: process.env.RAZORPAY_ENTERPRISE_MONTHLY_PLAN_ID,
  ENTERPRISE_YEARLY: process.env.RAZORPAY_ENTERPRISE_YEARLY_PLAN_ID,
};

// Validate that all required plan IDs are set
const missingPlanIds = Object.entries(PLAN_IDS).filter(([key, value]) => !value);
if (missingPlanIds.length > 0) {
  console.warn('Missing Razorpay plan IDs:', missingPlanIds.map(([key]) => key));
  console.warn('Subscription creation will fall back to payment links for missing plan IDs.');
  console.warn('Please set these environment variables in Replit Secrets:');
  missingPlanIds.forEach(([key]) => {
    console.warn(`- RAZORPAY_${key}_PLAN_ID`);
  });
}

// Cache for exchange rate (refreshed every hour)
let cachedExchangeRate: { rate: number; timestamp: number } | null = null;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

// Function to get live USD to INR exchange rate
async function getUSDToINRRate(): Promise<number> {
  // Check if we have a valid cached rate
  if (cachedExchangeRate && 
      Date.now() - cachedExchangeRate.timestamp < CACHE_DURATION) {
    console.log('Using cached exchange rate:', cachedExchangeRate.rate);
    return cachedExchangeRate.rate;
  }

  try {
    // Using exchangerate-api.com (free tier: 1500 requests/month)
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
    
    if (!response.ok) {
      throw new Error(`Exchange rate API error: ${response.status}`);
    }
    
    const data = await response.json();
    const rate = data.rates.INR;
    
    if (!rate || typeof rate !== 'number') {
      throw new Error('Invalid exchange rate data received');
    }
    
    // Cache the rate
    cachedExchangeRate = {
      rate: rate,
      timestamp: Date.now()
    };
    
    console.log('Fetched new exchange rate:', rate);
    return rate;
    
  } catch (error) {
    console.error('Failed to fetch live exchange rate:', error);
    
    // Fallback to cached rate if available
    if (cachedExchangeRate) {
      console.log('Using cached fallback rate:', cachedExchangeRate.rate);
      return cachedExchangeRate.rate;
    }
    
    // Final fallback to hardcoded rate
    console.log('Using hardcoded fallback rate: 83');
    return 83;
  }
}

// Centralized pricing configuration
export const USD_PRICES = {
  PRO_MONTHLY: 19,
  PRO_YEARLY: 183, // $19 * 12 * 0.8 (20% discount) = $182.4 rounded to $183
  ENTERPRISE_MONTHLY: 50,
  ENTERPRISE_YEARLY: 480, // $50 * 12 * 0.8 (20% discount) = $480
};

// Function to get plan pricing with live rates
export async function getPlanPricing() {
  const exchangeRate = await getUSDToINRRate();
  
  return {
    PRO_MONTHLY: Math.round(USD_PRICES.PRO_MONTHLY * exchangeRate * 100), // Convert to paise
    PRO_YEARLY: Math.round(USD_PRICES.PRO_YEARLY * exchangeRate * 100),
    ENTERPRISE_MONTHLY: Math.round(USD_PRICES.ENTERPRISE_MONTHLY * exchangeRate * 100),
    ENTERPRISE_YEARLY: Math.round(USD_PRICES.ENTERPRISE_YEARLY * exchangeRate * 100),
  };
}

// Static pricing for immediate use (will be updated by live rates)
export const PLAN_PRICING = {
  PRO_MONTHLY: Math.round(USD_PRICES.PRO_MONTHLY * 83 * 100), // ₹1,577 (fallback)
  PRO_YEARLY: Math.round(USD_PRICES.PRO_YEARLY * 83 * 100), // ₹15,189 (fallback)
  ENTERPRISE_MONTHLY: Math.round(USD_PRICES.ENTERPRISE_MONTHLY * 83 * 100), // ₹4,150 (fallback)
  ENTERPRISE_YEARLY: Math.round(USD_PRICES.ENTERPRISE_YEARLY * 83 * 100), // ₹39,840 (fallback)
};

// Function to fetch plan pricing directly from Razorpay
export async function getRazorpayPlanPricing(planId: string): Promise<number> {
  try {
    const plan = await razorpay.plans.fetch(planId);
    return plan.item.amount; // Amount in paise
  } catch (error) {
    console.error(`Failed to fetch Razorpay plan ${planId}:`, error);
    throw new Error(`Unable to fetch plan pricing for ${planId}`);
  }
}

// Helper function to get USD price by plan ID
export function getUSDPriceByPlanId(planId: string): number {
  switch (planId) {
    case 'pro-monthly':
      return USD_PRICES.PRO_MONTHLY;
    case 'pro-yearly':
      return USD_PRICES.PRO_YEARLY;
    case 'enterprise-monthly':
      return USD_PRICES.ENTERPRISE_MONTHLY;
    case 'enterprise-yearly':
      return USD_PRICES.ENTERPRISE_YEARLY;
    default:
      return 0;
  }
}

// Helper function to get INR amount by plan ID
export async function getINRAmountByPlanId(planId: string): Promise<number> {
  const pricing = await getPlanPricing();
  
  switch (planId) {
    case 'pro-monthly':
      return pricing.PRO_MONTHLY;
    case 'pro-yearly':
      return pricing.PRO_YEARLY;
    case 'enterprise-monthly':
      return pricing.ENTERPRISE_MONTHLY;
    case 'enterprise-yearly':
      return pricing.ENTERPRISE_YEARLY;
    default:
      return 0;
  }
}

// Subscription management functions
export async function createRazorpayCustomer(email: string, name: string, userId: number) {
  try {
    // First check if customer already exists
    const existingCustomers = await razorpay.customers.all({
      email: email,
      count: 1
    });
    
    if (existingCustomers.items && existingCustomers.items.length > 0) {
      console.log('Using existing Razorpay customer:', existingCustomers.items[0].id);
      return existingCustomers.items[0];
    }
    
    // Create new customer if none exists
    const customer = await razorpay.customers.create({
      name: name,
      email: email,
      contact: '',
      notes: {
        userId: userId.toString()
      }
    });
    
    console.log('Created new Razorpay customer:', customer.id);
    return customer;
  } catch (error) {
    console.error('Error handling Razorpay customer:', error);
    
    // If error is about existing customer, try to fetch it
    if (error.error && error.error.description && error.error.description.includes('already exists')) {
      try {
        const existingCustomers = await razorpay.customers.all({
          email: email,
          count: 1
        });
        
        if (existingCustomers.items && existingCustomers.items.length > 0) {
          console.log('Retrieved existing customer after error:', existingCustomers.items[0].id);
          return existingCustomers.items[0];
        }
      } catch (fetchError) {
        console.error('Error fetching existing customer:', fetchError);
      }
    }
    
    throw error;
  }
}

export async function createRazorpaySubscription(planId: string, customerId: string, userId: number) {
  try {
    const subscription = await razorpay.subscriptions.create({
      plan_id: planId,
      customer_id: customerId,
      quantity: 1,
      total_count: 100, // Maximum allowed by Razorpay
      addons: [],
      notes: {
        userId: userId.toString(),
        planId: planId
      }
    });
    return subscription;
  } catch (error) {
    console.error('Error creating Razorpay subscription:', error);
    throw error;
  }
}

export async function cancelRazorpaySubscription(subscriptionId: string, cancelAtCycleEnd: boolean = true) {
  try {
    const subscription = await razorpay.subscriptions.cancel(subscriptionId, {
      cancel_at_cycle_end: cancelAtCycleEnd ? 1 : 0
    });
    return subscription;
  } catch (error) {
    console.error('Error cancelling Razorpay subscription:', error);
    throw error;
  }
}

export async function pauseRazorpaySubscription(subscriptionId: string) {
  try {
    const subscription = await razorpay.subscriptions.pause(subscriptionId, {
      pause_at: 'now'
    });
    return subscription;
  } catch (error) {
    console.error('Error pausing Razorpay subscription:', error);
    throw error;
  }
}

export async function resumeRazorpaySubscription(subscriptionId: string) {
  try {
    const subscription = await razorpay.subscriptions.resume(subscriptionId, {
      resume_at: 'now'
    });
    return subscription;
  } catch (error) {
    console.error('Error resuming Razorpay subscription:', error);
    throw error;
  }
}
