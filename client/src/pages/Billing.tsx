import { useEffect, useState, useMemo, useCallback } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import Sidebar from "@/components/dashboard/Sidebar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Check, CreditCard, Receipt, AlertTriangle } from "lucide-react";
import { usePayment } from "@/hooks/usePayment";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

// Component to show current exchange rate
function ExchangeRateInfo() {
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExchangeRate = async () => {
      try {
        const response = await fetch("/api/exchange-rate");
        if (response.ok) {
          const data = await response.json();
          setExchangeRate(data.rate);
        }
      } catch (error) {
        console.error("Failed to fetch exchange rate:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchExchangeRate();
  }, []);

  return (
    <div className="bg-blue-50 border-l-4 border-blue-500 text-blue-700 p-3 text-center text-sm">
      <p className="font-medium">
        Prices shown in USD. Payments processed in INR equivalent through
        Razorpay.
        {!loading && exchangeRate && (
          <span className="block text-xs mt-1">
            Current rate: 1 USD = ₹{exchangeRate.toFixed(2)} (Live rate updated
            hourly)
          </span>
        )}
      </p>
    </div>
  );
}

export default function Billing() {
  const [, navigate] = useLocation();
  const { user, isLoading: authLoading } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const {
    cancelSubscription,
    upgradeSubscription,
    createCheckoutSession,
    isLoading: paymentLoading,
  } = usePayment();
  const { toast } = useToast();
  const [subscription, setSubscription] = useState<any>(null);
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [billingInterval, setBillingInterval] = useState<"monthly" | "yearly">(
    "monthly",
  );

  // Redirect to welcome page if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/welcome");
    }
  }, [user, authLoading, navigate]);

  const fetchBillingData = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Add cache-busting parameter to ensure fresh data
      const timestamp = Date.now();

      // Fetch subscription data
      const subResponse = await fetch(
        `/api/subscription/user/${user.id}?t=${timestamp}`,
        {
          headers: {
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          },
        },
      );

      if (subResponse.ok) {
        const subData = await subResponse.json();
        console.log("Fetched subscription data:", subData);
        setSubscription(subData);
      } else if (subResponse.status === 404) {
        // No subscription found - user is on free plan
        console.log("No subscription found - user on free plan");
        setSubscription(null);
      } else {
        console.error("Failed to fetch subscription:", subResponse.status);
      }

      // Fetch payment history
      const paymentResponse = await fetch(
        `/api/payment-history/user/${user.id}?t=${timestamp}`,
        {
          headers: {
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          },
        },
      );

      if (paymentResponse.ok) {
        const paymentData = await paymentResponse.json();
        console.log("Payment history fetched:", paymentData);
        setPaymentHistory(paymentData);
      } else {
        console.error(
          "Failed to fetch payment history:",
          paymentResponse.status,
          await paymentResponse.text(),
        );
      }
    } catch (error) {
      console.error("Error fetching billing data:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const handleDowngradeToFree = useCallback(async () => {
    if (!subscription || !user) return;

    const confirmMessage = `Are you sure you want to downgrade to the Free plan? You will lose access to ${subscription.plan_name} features immediately and your subscription will be cancelled.`;

    if (!confirm(confirmMessage)) return;

    try {
      const response = await fetch(
        `/api/subscription/${subscription.razorpay_subscription_id || subscription.id}/downgrade-to-free`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: user.id,
          }),
        },
      );

      if (response.ok) {
        const result = await response.json();
        toast({
          title: "Downgraded to Free",
          description:
            result.message ||
            "Your subscription has been cancelled and you're now on the Free plan.",
        });
        fetchBillingData();
      } else {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Unknown error" }));
        console.error("Failed to downgrade subscription:", errorData);
        toast({
          title: "Error",
          description:
            errorData.error ||
            "Failed to downgrade subscription. Please try again or contact support.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error downgrading subscription:", error);
      toast({
        title: "Error",
        description:
          "Failed to downgrade subscription. Please try again or contact support.",
        variant: "destructive",
      });
    }
  }, [subscription, user, toast, fetchBillingData]);

  const handleUpgradeOrSubscribe = useCallback(
    async (planId: string) => {
      if (!user) return;

      // If user is on Free plan (no active subscription), create new subscription
      if (!subscription || subscription.status !== "active") {
        try {
          const result = await createCheckoutSession(planId);
          if (result) {
            toast({
              title: "Redirecting to Payment",
              description:
                "Complete your payment to activate your subscription.",
            });
          }
        } catch (error) {
          console.error("Error creating subscription:", error);
          toast({
            title: "Error",
            description: "Failed to create subscription. Please try again.",
            variant: "destructive",
          });
        }
      } else {
        // Determine if this is an upgrade or downgrade
        const currentPlanName = subscription.plan_name?.toLowerCase() || "";
        const targetPlanName = planId.toLowerCase();

        // Check if this is actually a downgrade (Enterprise -> Pro)
        const isDowngrade =
          currentPlanName.includes("enterprise") &&
          targetPlanName.includes("pro");

        if (isDowngrade) {
          // Handle downgrade - just update subscription without payment
          const confirmMessage = `Are you sure you want to downgrade from ${subscription.plan_name} to ${planId.replace("-", " ")}? You will lose access to Enterprise features immediately.`;

          if (!confirm(confirmMessage)) return;

          try {
            // For downgrades, we directly update the subscription without payment
            const response = await fetch(
              `/api/subscription/${subscription.razorpay_subscription_id || subscription.id}/downgrade`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  newPlanId: planId,
                  userId: user.id,
                }),
              },
            );

            if (response.ok) {
              toast({
                title: "Plan Downgraded",
                description: `Successfully downgraded to ${planId.replace("-", " ")}`,
              });
              fetchBillingData();
            } else {
              throw new Error("Failed to downgrade subscription");
            }
          } catch (error) {
            console.error("Error downgrading subscription:", error);
            toast({
              title: "Downgrade Failed",
              description:
                "Failed to downgrade subscription. Please try again.",
              variant: "destructive",
            });
          }
          return;
        } else {
          // Regular upgrade - use subscription flow instead of payment link
          try {
            const result = await createCheckoutSession(planId);
            if (result) {
              toast({
                title: "Redirecting to Payment",
                description:
                  "Complete your payment to upgrade your subscription.",
              });
            }
          } catch (error) {
            console.error("Error upgrading subscription:", error);
            toast({
              title: "Upgrade Failed",
              description: "Failed to upgrade subscription. Please try again.",
              variant: "destructive",
            });
          }
        }
      }
    },
    [user, subscription, toast, fetchBillingData],
  );

  // Fetch subscription and payment data
  useEffect(() => {
    if (user) {
      fetchBillingData();
    }
  }, [user, fetchBillingData]);

  // Auto-refresh subscription data every 30 seconds when page is visible
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchBillingData();
      }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [user, fetchBillingData]);

  // Handle payment success redirect
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const isAutoRedirect = urlParams.get("redirect") === "auto";

    if (urlParams.get("subscription_success") === "true") {
      const subscriptionId = urlParams.get("subscription_id");
      const paymentLinkId = urlParams.get("payment_link_id");

      if ((subscriptionId || paymentLinkId) && user) {
        toast({
          title: "Payment Successful!",
          description: paymentLinkId
            ? "Your payment has been processed. Your subscription will be activated shortly."
            : "Your subscription has been activated. Welcome to your new plan!",
        });

        // Activate the subscription manually to ensure it's properly set up
        const activateSubscription = async () => {
          try {
            let activated = false;

            // For payment link success, refresh data multiple times to ensure updates are captured
            if (paymentLinkId) {
              console.log(
                "Payment link success - refreshing billing data for payment link:",
                paymentLinkId,
              );

              // Immediate refresh
              fetchBillingData();

              // Additional refreshes to capture webhook updates
              setTimeout(() => {
                fetchBillingData();
              }, 2000);

              setTimeout(() => {
                fetchBillingData();
              }, 5000);

              setTimeout(() => {
                fetchBillingData();
              }, 10000);

              return;
            }

            // Try activation endpoint first for subscription-based payments
            const activateResponse = await fetch("/api/activate-subscription", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                subscriptionId: subscriptionId,
                userId: user.id,
              }),
            });

            if (activateResponse.ok) {
              console.log("Subscription activated successfully");
              activated = true;
            } else {
              console.log("Activation endpoint failed, trying verification...");

              // Fallback to verify-payment endpoint
              const verifyResponse = await fetch("/api/verify-payment", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  razorpay_subscription_id: subscriptionId,
                  userId: user.id,
                }),
              });

              if (verifyResponse.ok) {
                console.log("Subscription verified successfully");
                activated = true;
              }
            }

            // Force refresh billing data after activation/verification
            if (activated) {
              // Wait a moment for backend processing
              setTimeout(() => {
                fetchBillingData();
              }, 1000);
            }
          } catch (error) {
            console.error("Error activating subscription:", error);
            // Still try to refresh the data
            setTimeout(() => {
              fetchBillingData();
            }, 1000);
          }
        };

        activateSubscription();

        // Clean up URL parameters
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname,
        );
      }
    } else {
      // If subscription_success is not true, check for other parameters that might indicate a completed payment
      const paymentSuccess = urlParams.get("payment_success");
      const planParam = urlParams.get("plan");
      const isAutoRedirect = urlParams.get("redirect") === "auto";

      if (paymentSuccess === "true") {
        // Show success message
        toast({
          title: "Payment Successful!",
          description: planParam
            ? `Your ${planParam.replace("-", " ")} subscription has been activated.`
            : "Your subscription has been activated.",
        });

        // Clean up URL parameters immediately
        const newUrl = window.location.origin + window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);

        // For auto redirects, immediately refresh data
        if (isAutoRedirect) {
          // Immediate refresh for auto redirects
          fetchBillingData();

          // Additional refreshes to ensure webhook data is captured
          setTimeout(() => fetchBillingData(), 1000);
          setTimeout(() => fetchBillingData(), 3000);
          setTimeout(() => fetchBillingData(), 5000);
        } else {
          // Regular refresh for non-auto redirects
          setTimeout(() => {
            fetchBillingData();
          }, 2000);
        }
      }
    }
  }, [user, toast, fetchBillingData]);

  // Memoize current plan determination
  const currentPlan = useMemo(() => {
    if (!subscription || subscription.status !== "active") {
      return {
        name: "Free",
        price: "$0",
        interval: "month",
        features: [
          "Up to 2 AI agents",
          "100 API requests per month",
          "Basic templates",
          "Community support",
        ],
      };
    }

    const planName = subscription.plan_name?.toLowerCase() || "";

    if (planName.includes("pro monthly")) {
      return {
        name: "Pro",
        price: "$19",
        interval: "month",
        features: [
          "Up to 10 AI agents",
          "1,000 API requests per month",
          "All templates",
          "Priority support",
          "Webhook integrations",
          "Custom branding",
        ],
      };
    }

    if (planName.includes("pro yearly")) {
      return {
        name: "Pro",
        price: "$183",
        interval: "year",
        features: [
          "Up to 10 AI agents",
          "1,000 API requests per month",
          "All templates",
          "Priority support",
          "Webhook integrations",
          "Custom branding",
        ],
      };
    }

    if (planName.includes("enterprise")) {
      return {
        name: "Enterprise",
        price: planName.includes("yearly") ? "$480" : "$50",
        interval: planName.includes("yearly") ? "year" : "month",
        features: [
          "Unlimited AI agents",
          "10,000 API requests per month",
          "All templates",
          "Dedicated support",
          "Advanced analytics",
          "Custom model training",
          "SLA guarantees",
        ],
      };
    }

    return {
      name: "Free",
      price: "$0",
      interval: "month",
      features: [
        "Up to 2 AI agents",
        "100 API requests per month",
        "Basic templates",
        "Community support",
      ],
    };
  }, [subscription]);

  // Memoize formatted payment history
  const invoices = useMemo(() => {
    return paymentHistory.map((payment, index) => {
      let displayAmount: string;

      if (payment.currency === "INR") {
        // Convert INR to USD for display based on common plan pricing
        const inrAmount = payment.amount / 100; // Convert from paise to rupees
        let usdAmount: number;

        // First check payment description for plan identification
        const description = payment.description?.toLowerCase() || "";
        
        // Check description first for most accurate plan detection
        if (description.includes("pro yearly") || description.includes("pro annual")) {
          usdAmount = 183; // Pro Yearly
        } else if (description.includes("pro monthly") || (description.includes("pro") && !description.includes("yearly") && !description.includes("annual"))) {
          usdAmount = 19; // Pro Monthly
        } else if (description.includes("enterprise yearly") || description.includes("enterprise annual")) {
          usdAmount = 480; // Enterprise Yearly
        } else if (description.includes("enterprise monthly") || (description.includes("enterprise") && !description.includes("yearly") && !description.includes("annual"))) {
          usdAmount = 50; // Enterprise Monthly
        } else if (inrAmount === 0) {
          // For zero amounts (cancellations, etc.), keep as 0
          usdAmount = 0;
        } else {
          // Map INR amounts to USD equivalents with wider ranges for exchange rate fluctuations
          // Use more accurate ranges based on current exchange rates (75-85 INR per USD)
          if (inrAmount >= 1350 && inrAmount <= 1750) {
            usdAmount = 19; // Pro Monthly (₹19*75 to ₹19*85 range)
          } else if (inrAmount >= 13700 && inrAmount <= 17200) {
            usdAmount = 183; // Pro Yearly (₹183*75 to ₹183*85 range)
          } else if (inrAmount >= 3750 && inrAmount <= 4750) {
            usdAmount = 50; // Enterprise Monthly (₹50*75 to ₹50*85 range)
          } else if (inrAmount >= 36000 && inrAmount <= 44000) {
            usdAmount = 480; // Enterprise Yearly (₹480*75 to ₹480*85 range)
          } else if (description.includes("upgrade") || description.includes("prorated")) {
            // For upgrade/prorated transactions, calculate based on current exchange rate
            // Estimate exchange rate from amount
            const estimatedRate = 80; // Conservative estimate
            usdAmount = Math.round(inrAmount / estimatedRate);
          } else {
            // Final fallback: use conservative exchange rate of 80
            usdAmount = Math.round(inrAmount / 80);
          }
        }

        displayAmount = `$${usdAmount.toFixed(2)}`;
      } else {
        displayAmount = `$${(payment.amount / 100).toFixed(2)}`;
      }

      return {
        id: `${payment.razorpay_payment_id || payment.stripe_payment_intent_id || payment.id}-${index}`,
        date: new Date(payment.created_at).toLocaleDateString(),
        amount: displayAmount,
        status: payment.status === "succeeded" ? "Paid" : payment.status,
        plan: payment.description || "Subscription Payment",
      };
    });
  }, [paymentHistory]);

  // Helper function to determine button text and variant
  const getPlanButtonConfig = (plan: any) => {
    if (plan.isCurrent) {
      return {
        text: "Current Plan",
        variant: "outline" as const,
        disabled: true,
      };
    }

    if (plan.name === "Free") {
      // Only show downgrade to free if user has an active paid subscription
      if (subscription && subscription.status === "active") {
        return {
          text: "Downgrade to Free",
          variant: "outline" as const,
          disabled: false,
        };
      } else {
        return {
          text: "Current Plan",
          variant: "outline" as const,
          disabled: true,
        };
      }
    }

    // If no active subscription, all paid plans are upgrades
    if (!subscription || subscription.status !== "active") {
      return {
        text: "Get Started",
        variant: "default" as const,
        disabled: false,
      };
    }

    // Determine if this would be an upgrade or downgrade
    const currentPlanName = subscription.plan_name?.toLowerCase() || "";
    const isFromEnterprise = currentPlanName.includes("enterprise");
    const isFromPro = currentPlanName.includes("pro");
    const isPlanPro = plan.name === "Pro";
    const isPlanEnterprise = plan.name === "Enterprise";

    if (isFromEnterprise && isPlanPro) {
      return {
        text: "Downgrade to Pro",
        variant: "outline" as const,
        disabled: false,
      };
    }

    if (isFromPro && isPlanEnterprise) {
      return {
        text: "Upgrade to Enterprise",
        variant: "default" as const,
        disabled: false,
      };
    }

    return { text: "Upgrade", variant: "default" as const, disabled: false };
  };

  // Memoize plans array
  const plans = useMemo(
    () => [
      {
        name: "Free",
        price: "$0",
        interval: "month",
        features: [
          "Up to 2 AI agents",
          "100 API requests per month",
          "Basic templates",
          "Community support",
        ],
        isCurrent: currentPlan.name === "Free",
        planId: null,
      },
      {
        name: "Pro",
        price: billingInterval === "monthly" ? "$19" : "$183",
        interval: billingInterval === "monthly" ? "month" : "year",
        yearlyPrice: "$183",
        monthlyPrice: "$19",
        savings: billingInterval === "yearly" ? "Save $45 per year" : "",
        features: [
          "Up to 10 AI agents",
          "1,000 API requests per month",
          "All templates",
          "Priority support",
          "Webhook integrations",
          "Custom branding",
        ],
        popular: true,
        isCurrent:
          currentPlan.name === "Pro" &&
          ((billingInterval === "monthly" &&
            currentPlan.interval === "month") ||
            (billingInterval === "yearly" && currentPlan.interval === "year")),
        planId: billingInterval === "monthly" ? "pro-monthly" : "pro-yearly",
      },
      {
        name: "Enterprise",
        price: billingInterval === "monthly" ? "$50" : "$480",
        interval: billingInterval === "monthly" ? "month" : "year",
        yearlyPrice: "$480",
        monthlyPrice: "$50",
        savings: billingInterval === "yearly" ? "Save $120 per year" : "",
        features: [
          "Unlimited AI agents",
          "10,000 API requests per month",
          "All templates",
          "Dedicated support",
          "Advanced analytics",
          "Custom model training",
          "SLA guarantees",
        ],
        isCurrent:
          currentPlan.name === "Enterprise" &&
          ((billingInterval === "monthly" &&
            currentPlan.interval === "month") ||
            (billingInterval === "yearly" && currentPlan.interval === "year")),
        planId:
          billingInterval === "monthly"
            ? "enterprise-monthly"
            : "enterprise-yearly",
      },
    ],
    [billingInterval, currentPlan, subscription],
  );

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className="flex-1 ml-0 lg:ml-64 transition-all duration-300 overflow-y-auto">
        <ExchangeRateInfo />
        <div className="p-6">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Billing & Subscriptions
                </h1>
                <p className="text-gray-600 mt-2">
                  Manage your subscription and view payment history
                </p>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Current Plan */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      Current Plan
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-semibold">
                          {currentPlan.name}
                        </h3>
                        <p className="text-gray-600">
                          {currentPlan.price}/{currentPlan.interval}
                        </p>
                        <ul className="mt-2 space-y-1">
                          {currentPlan.features
                            .slice(0, 2)
                            .map((feature, index) => (
                              <li
                                key={index}
                                className="text-sm text-gray-600 flex items-center"
                              >
                                <Check className="h-4 w-4 text-green-500 mr-2" />
                                {feature}
                              </li>
                            ))}
                        </ul>
                      </div>
                      {subscription && subscription.status === "active" && (
                        <Badge
                          variant="secondary"
                          className="bg-green-100 text-green-800"
                        >
                          Active
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Plans and Payment History Tabs */}
                <Tabs defaultValue="plans" className="space-y-6">
                  <TabsList>
                    <TabsTrigger value="plans">Available Plans</TabsTrigger>
                    <TabsTrigger value="history">Payment History</TabsTrigger>
                  </TabsList>

                  <TabsContent value="plans" className="space-y-6">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-bold">Available Plans</h2>
                      <div className="flex items-center space-x-2">
                        <Label
                          htmlFor="billing-toggle"
                          className={`text-sm transition-all duration-300 ${
                            billingInterval === "monthly"
                              ? "font-medium text-blue-600 scale-105"
                              : "text-gray-600 hover:text-gray-900"
                          }`}
                        >
                          Monthly
                        </Label>
                        <Switch
                          id="billing-toggle"
                          checked={billingInterval === "yearly"}
                          onCheckedChange={(checked) =>
                            setBillingInterval(checked ? "yearly" : "monthly")
                          }
                          className="transition-all duration-300 hover:scale-105"
                        />
                        <Label
                          htmlFor="billing-toggle"
                          className={`text-sm transition-all duration-300 ${
                            billingInterval === "yearly"
                              ? "font-medium text-blue-600 scale-105"
                              : "text-gray-600 hover:text-gray-900"
                          }`}
                        >
                          Yearly{" "}
                          <span className="text-green-600 text-xs font-medium animate-pulse">
                            Save 20%
                          </span>
                        </Label>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {plans.map((plan, index) => (
                        <Card
                          key={index}
                          className={`
                            transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-xl cursor-pointer
                            ${plan.popular ? "border-primary-500 relative ring-2 ring-primary-200" : "hover:border-primary-300"}
                            ${plan.isCurrent ? "bg-blue-50 border-blue-300 shadow-md" : ""}
                          `}
                        >
                          {plan.popular && (
                            <div className="absolute top-0 right-0 bg-primary-500 text-white px-3 py-1 text-xs font-medium rounded-bl-lg rounded-tr-lg animate-bounce">
                              Most Popular
                            </div>
                          )}
                          <CardHeader>
                            <CardTitle className="transition-colors duration-200 hover:text-primary-600">
                              {plan.name}
                            </CardTitle>
                            <CardDescription>
                              <div className="transition-all duration-500 ease-in-out">
                                <span className="text-3xl font-bold transition-all duration-300 transform hover:scale-110 inline-block">
                                  {plan.price}
                                </span>
                                <span className="text-sm opacity-70 transition-opacity duration-200 hover:opacity-100">
                                  /{plan.interval}
                                </span>
                              </div>
                              {plan.savings && (
                                <p className="text-green-600 font-medium text-sm mt-1 transition-all duration-300 transform hover:scale-105 animate-pulse">
                                  {plan.savings}
                                </p>
                              )}
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <ul className="space-y-2">
                              {plan.features.map((feature, i) => (
                                <li key={i} className="flex items-start">
                                  <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                                  <span>{feature}</span>
                                </li>
                              ))}
                            </ul>
                          </CardContent>
                          <CardFooter>
                            {(() => {
                              const buttonConfig = getPlanButtonConfig(plan);
                              return (
                                <Button
                                  variant={buttonConfig.variant}
                                  className="w-full"
                                  onClick={() => {
                                    if (plan.name === "Free") {
                                      handleDowngradeToFree();
                                    } else if (plan.planId) {
                                      handleUpgradeOrSubscribe(plan.planId);
                                    }
                                  }}
                                  disabled={
                                    paymentLoading || buttonConfig.disabled
                                  }
                                >
                                  {paymentLoading
                                    ? "Loading..."
                                    : buttonConfig.text}
                                </Button>
                              );
                            })()}
                          </CardFooter>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="history">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Receipt className="h-5 w-5" />
                          Payment History
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {invoices.length === 0 ? (
                          <p className="text-gray-500 text-center py-8">
                            No payment history found
                          </p>
                        ) : (
                          <div className="space-y-4">
                            {invoices.map((invoice) => (
                              <div
                                key={invoice.id}
                                className="flex items-center justify-between p-4 border rounded-lg"
                              >
                                <div>
                                  <p className="font-medium">{invoice.plan}</p>
                                  <p className="text-sm text-gray-600">
                                    {invoice.date}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="font-medium">
                                    {invoice.amount}
                                  </p>
                                  <Badge
                                    variant={
                                      invoice.status === "Paid"
                                        ? "default"
                                        : "secondary"
                                    }
                                  >
                                    {invoice.status}
                                  </Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}