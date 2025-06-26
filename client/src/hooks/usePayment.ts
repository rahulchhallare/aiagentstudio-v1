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

    if (!planId) {
      toast({
        title: "Invalid plan",
        description: "Please select a valid plan.",
        variant: "destructive",
      });
      return;
    }

    if (!user.id || !user.email) {
      toast({
        title: "User information missing",
        description: "Please ensure you are properly logged in.",
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

      // Validate request body before sending
      if (!requestBody.planId || !requestBody.userId || !requestBody.email) {
        throw new Error(`Missing required fields: planId=${requestBody.planId}, userId=${requestBody.userId}, email=${requestBody.email}`);
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(requestBody.email)) {
        throw new Error('Invalid email format');
      }

      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        let errorData;
        let responseText = '';
        
        try {
          responseText = await response.text();
          // Check if response is JSON
          if (responseText.trim().startsWith('{') || responseText.trim().startsWith('[')) {
            errorData = JSON.parse(responseText);
          } else {
            // Response is HTML or plain text
            console.error('Non-JSON response received:', responseText.substring(0, 200));
            errorData = { 
              message: response.status === 404 ? 'API endpoint not found' : 'Server returned an unexpected response'
            };
          }
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError);
          console.error('Raw response text:', responseText.substring(0, 200));
          errorData = { 
            message: 'Server error - received invalid response format'
          };
        }
        
        console.error('Response error:', {
          status: response.status,
          statusText: response.statusText,
          errorData,
          responseText: responseText.substring(0, 200)
        });
        
        let errorMessage = 'Failed to create payment session';
        
        if (response.status === 404) {
          errorMessage = 'Payment service not available. Please contact support.';
        } else if (response.status === 400) {
          errorMessage = errorData.message || 'Invalid request parameters. Please check your plan selection.';
        } else if (response.status === 500) {
          errorMessage = errorData.message || 'Server error. Please try again or contact support.';
        } else {
          errorMessage = `Payment creation failed (${response.status}): ${errorData.message || 'Unknown error'}`;
        }
        
        throw new Error(errorMessage);
      }

      const responseData = await response.json();
      console.log('Response data:', responseData);

      const { subscriptionId, customerId, amount, currency, status, short_url, fallback_payment, message } = responseData;

      if (!subscriptionId) {
        throw new Error('No subscription ID received from server');
      }

      // Check for fallback payment scenario
      if (fallback_payment) {
        toast({
          title: "Payment setup required",
          description: message || "Subscription created. Please complete payment setup.",
          variant: "default",
        });
        
        // Redirect to billing page for manual payment setup
        window.location.href = short_url || '/billing';
        return;
      }

      // For Razorpay subscriptions, redirect to hosted checkout page or open Razorpay checkout
      if (short_url) {
        console.log('Redirecting to Razorpay hosted checkout:', short_url);
        
        // Check if the URL is a valid Razorpay hosted page
        if (short_url.includes('rzp.io') || short_url.includes('razorpay.com')) {
          // Redirect directly to Razorpay hosted page
          window.location.href = short_url;
          return;
        } else {
          // Handle internal fallback URLs
          window.location.href = short_url;
          return;
        }
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

  const createManualPayment = async (planId: string, amount: number) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to continue with payment.",
        variant: "destructive",
      });
      return;
    }

    if (!planId || !amount) {
      toast({
        title: "Invalid parameters",
        description: "Plan ID and amount are required.",
        variant: "destructive",
      });
      return;
    }

    console.log('Creating manual payment for plan:', planId, 'amount:', amount);
    setIsLoading(true);

    try {
      const requestBody = {
        planId: mapPlanId(planId),
        userId: user.id,
        email: user.email,
        amount: amount
      };

      console.log('Manual payment request body:', requestBody);

      // Validate request body
      if (!requestBody.planId || !requestBody.userId || !requestBody.email || !requestBody.amount) {
        throw new Error(`Missing required fields: planId=${requestBody.planId}, userId=${requestBody.userId}, email=${requestBody.email}, amount=${requestBody.amount}`);
      }

      const response = await fetch('/api/create-manual-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('Manual payment response status:', response.status);

      if (!response.ok) {
        let errorData;
        let responseText = '';
        
        try {
          responseText = await response.text();
          if (responseText.trim().startsWith('{') || responseText.trim().startsWith('[')) {
            errorData = JSON.parse(responseText);
          } else {
            console.error('Non-JSON response received:', responseText.substring(0, 200));
            errorData = { 
              message: response.status === 404 ? 'API endpoint not found' : 'Server returned an unexpected response'
            };
          }
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError);
          console.error('Raw response text:', responseText.substring(0, 200));
          errorData = { 
            message: 'Server error - received invalid response format'
          };
        }
        
        console.error('Manual payment error:', {
          status: response.status,
          statusText: response.statusText,
          errorData,
          responseText: responseText.substring(0, 200)
        });
        
        let errorMessage = 'Failed to create manual payment';
        
        if (response.status === 400) {
          errorMessage = errorData.message || 'Invalid request parameters.';
        } else if (response.status === 500) {
          errorMessage = errorData.message || 'Server error. Please try again.';
        } else {
          errorMessage = `Payment creation failed (${response.status}): ${errorData.message || 'Unknown error'}`;
        }
        
        throw new Error(errorMessage);
      }

      const responseData = await response.json();
      console.log('Manual payment response data:', responseData);

      if (responseData.success && responseData.paymentLink) {
        toast({
          title: "Payment link created",
          description: "Redirecting to payment page...",
        });
        
        // Redirect to payment link in same tab
        window.location.href = responseData.paymentLink;
        return responseData;
      } else {
        throw new Error('Invalid response from payment service');
      }

    } catch (error: any) {
      console.error('Error creating manual payment:', error);
      toast({
        title: "Payment failed",
        description: error.message || "Failed to create payment. Please try again.",
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
    createManualPayment,
    cancelSubscription,
    updateSubscription,
    upgradeSubscription,
    createPortalSession,
    isLoading,
  };
}