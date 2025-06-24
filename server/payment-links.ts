import { razorpay } from './razorpay';

// Clean up temporary payment files by removing unused imports and optimizing

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
    // Extract the base URL and ensure proper redirect
    const baseUrl = successUrl.split('?')[0].replace('/billing', '');
    const finalSuccessUrl = `${baseUrl}/billing?subscription_success=true&auto_redirect=true`;
    
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
      callback_url: finalSuccessUrl,
      callback_method: 'get',
      options: {
        checkout: {
          readonly: {
            contact: false,
            email: false,
            name: false
          }
        }
      }
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