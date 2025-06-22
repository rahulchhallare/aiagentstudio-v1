import { razorpay } from './razorpay';

// Create a payment link as fallback when hosted pages aren't available
export async function createPaymentLink(
  planId: string,
  customerId: string,
  amount: number,
  currency: string = 'INR',
  description: string,
  successUrl: string,
  cancelUrl: string
) {
  try {
    const paymentLink = await razorpay.paymentLink.create({
      amount: amount,
      currency: currency,
      accept_partial: false,
      description: description,
      customer: {
        id: customerId
      },
      notify: {
        sms: false,
        email: true
      },
      reminder_enable: true,
      callback_url: successUrl,
      callback_method: 'get'
    });

    return paymentLink;
  } catch (error) {
    console.error('Error creating payment link:', error);
    throw error;
  }
}

// Create a standalone payment order (for manual integration)
export async function createPaymentOrder(
  amount: number,
  currency: string = 'INR',
  receipt: string,
  notes: any = {}
) {
  try {
    const order = await razorpay.orders.create({
      amount: amount,
      currency: currency,
      receipt: receipt,
      notes: notes
    });

    return order;
  } catch (error) {
    console.error('Error creating payment order:', error);
    throw error;
  }
}