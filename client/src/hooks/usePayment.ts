
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { loadRazorpay, RAZORPAY_KEY_ID } from '@/lib/razorpay';

export function usePayment() {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const createCheckoutSession = async (planId: string) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to continue with payment.",
        variant: "destructive",
      });
      return;
    }

    console.log('Starting checkout session creation with plan ID:', planId);
    setIsLoading(true);

    try {
      const requestBody = {
        planId,
        userId: user.id,
        email: user.email,
      };

      console.log('Request body:', requestBody);

      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Response error:', errorData);
        throw new Error(`Failed to create checkout session: ${response.status} ${errorData}`);
      }

      const responseData = await response.json();
      console.log('Response data:', responseData);

      const { orderId, amount, currency } = responseData;

      if (!orderId) {
        throw new Error('No order ID received from server');
      }

      const Razorpay = await loadRazorpay();
      if (!Razorpay) {
        throw new Error('Razorpay failed to load');
      }

      console.log('Opening Razorpay checkout with order ID:', orderId);

      const options = {
        key: RAZORPAY_KEY_ID,
        amount: amount,
        currency: currency,
        name: 'AIagentStudio.ai',
        description: 'Subscription Payment',
        order_id: orderId,
        handler: async function (response: any) {
          console.log('Payment success:', response);
          // Verify payment on server
          try {
            const verifyResponse = await fetch('/api/verify-payment', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                userId: user.id,
              }),
            });

            if (verifyResponse.ok) {
              toast({
                title: "Payment successful",
                description: "Your subscription has been activated!",
              });
              // Redirect to billing page
              window.location.href = '/billing';
            } else {
              throw new Error('Payment verification failed');
            }
          } catch (error) {
            console.error('Payment verification error:', error);
            toast({
              title: "Payment verification failed",
              description: "Please contact support for assistance.",
              variant: "destructive",
            });
          }
        },
        prefill: {
          name: user.username,
          email: user.email,
        },
        notes: {
          userId: user.id.toString(),
        },
        theme: {
          color: '#3B82F6',
        },
      };

      const rzp = new Razorpay(options);
      rzp.open();
    } catch (error: any) {
      console.error('Error creating checkout session:', error);
      toast({
        title: "Payment failed",
        description: error.message || "Failed to initiate payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const cancelSubscription = async (subscriptionId: string) => {
    setIsLoading(true);

    try {
      const response = await fetch(`/api/subscription/${subscriptionId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user?.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to cancel subscription');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      toast({
        title: "Error",
        description: "Failed to cancel subscription. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateSubscription = async (subscriptionId: string, updateData: any) => {
    setIsLoading(true);

    try {
      const response = await fetch(`/api/subscription/${subscriptionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        throw new Error('Failed to update subscription');
      }

      const { subscription } = await response.json();
      return subscription;
    } catch (error) {
      console.error('Error updating subscription:', error);
      toast({
        title: "Error",
        description: "Failed to update subscription. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    createCheckoutSession,
    cancelSubscription,
    updateSubscription,
    isLoading,
  };
}
