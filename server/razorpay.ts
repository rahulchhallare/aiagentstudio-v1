
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
  PRO_MONTHLY: process.env.RAZORPAY_PRO_MONTHLY_PLAN_ID!,
  PRO_YEARLY: process.env.RAZORPAY_PRO_YEARLY_PLAN_ID!,
  ENTERPRISE_MONTHLY: process.env.RAZORPAY_ENTERPRISE_MONTHLY_PLAN_ID!,
  ENTERPRISE_YEARLY: process.env.RAZORPAY_ENTERPRISE_YEARLY_PLAN_ID!,
};

// Validate that all required plan IDs are set
const missingPlanIds = Object.entries(PLAN_IDS).filter(([key, value]) => !value);
if (missingPlanIds.length > 0) {
  console.warn('Missing Razorpay plan IDs:', missingPlanIds.map(([key]) => key));
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

// Function to get plan pricing with live rates (fallback)
export async function getPlanPricing() {
  const exchangeRate = await getUSDToINRRate();
  
  return {
    PRO_MONTHLY: Math.round(29 * exchangeRate * 100), // Convert to paise
    PRO_YEARLY: Math.round(290 * exchangeRate * 100),
    ENTERPRISE_MONTHLY: Math.round(99 * exchangeRate * 100),
    ENTERPRISE_YEARLY: Math.round(990 * exchangeRate * 100),
  };
}

// Static pricing for immediate use (will be updated by live rates)
export const PLAN_PRICING = {
  PRO_MONTHLY: 240700, // Fallback values in paise
  PRO_YEARLY: 2407000,
  ENTERPRISE_MONTHLY: 821700,
  ENTERPRISE_YEARLY: 8217000,
};

// USD prices for display on website
export const USD_PRICES = {
  PRO_MONTHLY: 29,
  PRO_YEARLY: 290,
  ENTERPRISE_MONTHLY: 99,
  ENTERPRISE_YEARLY: 990,
};

// Subscription management functions
export async function createRazorpayCustomer(email: string, name: string, userId: number) {
  try {
    const customer = await razorpay.customers.create({
      name: name,
      email: email,
      contact: '',
      notes: {
        userId: userId.toString()
      }
    });
    return customer;
  } catch (error) {
    console.error('Error creating Razorpay customer:', error);
    throw error;
  }
}

export async function createRazorpaySubscription(planId: string, customerId: string, userId: number) {
  try {
    const subscription = await razorpay.subscriptions.create({
      plan_id: planId,
      customer_id: customerId,
      quantity: 1,
      total_count: 120, // 10 years worth of billing cycles
      addons: [],
      notes: {
        userId: userId.toString(),
        planId: planId
      },
      notify: 1 // Send email notification to customer
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
