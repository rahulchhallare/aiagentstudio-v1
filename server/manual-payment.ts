import { razorpay, PLAN_IDS } from './razorpay';
import { createPaymentOrder } from './payment-links';

// Helper to get plan pricing from Razorpay
export async function getPlanAmount(planId: string): Promise<number> {
  try {
    const plan = await razorpay.plans.fetch(planId);
    return plan.item.amount; // Amount in paise
  } catch (error) {
    console.error('Error fetching plan amount:', error);
    throw new Error('Unable to fetch plan pricing');
  }
}

// Create manual payment order for subscription
export async function createManualSubscriptionPayment(
  subscriptionId: string,
  planId: string,
  customerId: string,
  userId: number
) {
  try {
    const planAmount = await getPlanAmount(planId);
    const receipt = `sub_${subscriptionId}_${Date.now()}`;
    
    const order = await createPaymentOrder(
      planAmount,
      'INR',
      receipt,
      {
        subscription_id: subscriptionId,
        plan_id: planId,
        customer_id: customerId,
        user_id: userId.toString(),
        payment_type: 'subscription_manual'
      }
    );

    return {
      order,
      amount: planAmount,
      currency: 'INR'
    };
  } catch (error) {
    console.error('Error creating manual payment:', error);
    throw error;
  }
}

// Verify manual payment and activate subscription
export async function verifyManualPayment(
  orderId: string,
  paymentId: string,
  signature: string,
  subscriptionId: string
) {
  try {
    // Verify payment signature
    const crypto = require('crypto');
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    if (generatedSignature !== signature) {
      throw new Error('Invalid payment signature');
    }

    // Fetch payment details
    const payment = await razorpay.payments.fetch(paymentId);
    
    if (payment.status !== 'captured') {
      throw new Error('Payment not captured');
    }

    // Update subscription status if needed
    try {
      const subscription = await razorpay.subscriptions.fetch(subscriptionId);
      console.log('Manual payment verified for subscription:', subscriptionId);
      
      return {
        success: true,
        payment,
        subscription,
        message: 'Payment verified successfully'
      };
    } catch (subError) {
      console.error('Error fetching subscription after payment:', subError);
      // Even if subscription fetch fails, payment is valid
      return {
        success: true,
        payment,
        message: 'Payment verified, subscription may need manual activation'
      };
    }
  } catch (error) {
    console.error('Error verifying manual payment:', error);
    throw error;
  }
}