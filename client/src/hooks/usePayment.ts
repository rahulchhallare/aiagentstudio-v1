import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { loadRazorpay, RAZORPAY_KEY_ID } from '@/lib/razorpay';

export function usePayment() {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // Map frontend plan names to backend plan identifiers
  // The actual Razorpay plan IDs will be resolved on the server side
  const mapPlanId = (planId: string): string => {
    const planMapping: Record<string, string> = {
      'pro-monthly': 'pro-monthly',
      'pro-yearly': 'pro-yearly', 
      'enterprise-monthly': 'enterprise-monthly',
      'enterprise-yearly': 'enterprise-yearly',
      'pro_monthly': 'pro-monthly',
      'pro_yearly': 'pro-yearly',
      'enterprise_monthly': 'enterprise-monthly', 
      'enterprise_yearly': 'enterprise-yearly'
    };

    return planMapping[planId] || planId;
  };

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
      const mappedPlanId = mapPlanId(planId);
      console.log('Creating checkout session for plan:', planId, 'mapped to:', mappedPlanId);

      const requestBody = {
        planId: mappedPlanId,
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

      const { subscriptionId, customerId, amount, currency, status, short_url } = responseData;

      if (!subscriptionId) {
        throw new Error('No subscription ID received from server');
      }

      // For Razorpay subscriptions, redirect to hosted checkout page
      if (short_url) {
        console.log('Redirecting to Razorpay hosted checkout:', short_url);
        
        // Redirect directly to Razorpay hosted page
        // The success/failure handling will be done via webhook and redirect URL params
        window.location.href = short_url;
        return;
      }

      // Fallback: Use Razorpay checkout (for existing customers)
      const Razorpay = await loadRazorpay();
      if (!Razorpay) {
        throw new Error('Razorpay failed to load');
      }

      console.log('Opening Razorpay checkout with subscription ID:', subscriptionId);

      const options = {
        key: RAZORPAY_KEY_ID,
        subscription_id: subscriptionId,
        name: 'AIagentStudio.ai',
        description: 'Subscription Payment',
        handler: async function (response: any) {
          console.log('Subscription payment success:', response);
          // Verify subscription on server
          try {
            const verifyResponse = await fetch('/api/verify-payment', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                razorpay_subscription_id: response.razorpay_subscription_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                userId: user.id,
              }),
            });

            if (verifyResponse.ok) {
              toast({
                title: "Subscription activated!",
                description: "Your subscription has been activated successfully. Recurring payments will be processed automatically.",
              });
              // Redirect to billing page
              window.location.href = '/billing';
            } else {
              throw new Error('Subscription verification failed');
            }
          } catch (error) {
            console.error('Subscription verification error:', error);
            toast({
              title: "Subscription verification failed",
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
          razorpay_subscription_id: subscriptionId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to cancel subscription');
      }

      const result = await response.json();
      toast({
        title: "Success",
        description: "Subscription cancelled successfully.",
      });
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

  const upgradeSubscription = async (subscriptionId: string, newPlanId: string) => {
    setIsLoading(true);

    try {
      const response = await fetch(`/api/subscription/${subscriptionId}/upgrade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          newPlanId,
          userId: user?.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to upgrade subscription');
      }

      const result = await response.json();

      toast({
        title: "Upgrade Successful!",
        description: result.message,
      });

      return result;
    } catch (error) {
      console.error('Error upgrading subscription:', error);
      toast({
        title: "Upgrade Failed",
        description: "Failed to upgrade subscription. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createPortalSession = async (customerId?: string) => {
    // For Razorpay, we don't have a direct equivalent to Stripe's customer portal
    // This function is kept for compatibility but subscription management is handled directly in the billing page
    console.log('Portal session not applicable for Razorpay - use billing page controls instead');
  };

  return {
    createCheckoutSession,
    cancelSubscription,
    updateSubscription,
    upgradeSubscription,
    createPortalSession,
    isLoading,
  };
}