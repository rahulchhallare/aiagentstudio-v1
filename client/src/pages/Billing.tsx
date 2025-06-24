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
        setPaymentHistory(paymentData);
      } else {
        console.error(
          "Failed to fetch payment history:",
          paymentResponse.status,
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
        toast({
          title: "Downgraded to Free",
          description:
            "Your subscription has been cancelled and you're now on the Free plan.",
        });
        fetchBillingData();
      } else {
        const errorData = await response.text();
        console.error("Failed to downgrade subscription:", errorData);
        toast({
          title: "Error",
          description:
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

      // If user is on Free plan (no active subscription), create new subscription via payment
      if (!subscription || subscription.status !== "active") {
        // Create payment link for new subscription
        try {
          const response = await fetch("/api/create-manual-payment", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              planId,
              userId: user.id,
            }),
          });

          if (response.ok) {
            const { paymentLink } = await response.json();
            window.open(paymentLink, "_blank");
            toast({
              title: "Redirecting to Payment",
              description:
                "Complete your payment to activate your subscription.",
            });
          } else {
            throw new Error("Failed to create payment link");
          }
        } catch (error) {
          console.error("Error creating payment:", error);
          toast({
            title: "Error",
            description: "Failed to create payment. Please try again.",
            variant: "destructive",
          });
        }
      } else {
        // User has active subscription, upgrade it
        try {
          const response = await fetch(
            `/api/subscription/${subscription.razorpay_subscription_id || subscription.id}/upgrade`,
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
            const result = await response.json();
            toast({
              title: "Upgrade Successful!",
              description: result.message,
            });
            fetchBillingData();
          } else {
            const error = await response.text();
            throw new Error(error);
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
    if (urlParams.get("subscription_success") === "true") {
      const subscriptionId = urlParams.get("subscription_id");
      if (subscriptionId && user) {
        toast({
          title: "Payment Successful!",
          description:
            "Your subscription has been activated. Welcome to your new plan!",
        });

        // Activate the subscription manually to ensure it's properly set up
        const activateSubscription = async () => {
          try {
            let activated = false;

            // Try activation endpoint first
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
        price: "$29",
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
        price: "$290",
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
        price: planName.includes("yearly") ? "$990" : "$99",
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
    return paymentHistory.map((payment) => {
      let displayAmount: string;

      if (payment.currency === "INR") {
        // Convert INR to USD for display based on common plan pricing
        const inrAmount = payment.amount / 100; // Convert from paise to rupees
        let usdAmount: number;

        // Map common INR amounts to USD equivalents based on plan pricing
        if (inrAmount >= 28 && inrAmount <= 30) {
          usdAmount = 29; // Pro Monthly (₹29 = $29)
        } else if (inrAmount >= 999 && inrAmount <= 1000) {
          usdAmount = 29; // Pro Monthly (₹999 = $29)
        } else if (inrAmount >= 9999 && inrAmount <= 10000) {
          usdAmount = 290; // Pro Yearly
        } else if (inrAmount >= 4999 && inrAmount <= 5000) {
          usdAmount = 99; // Enterprise Monthly
        } else if (inrAmount >= 49999 && inrAmount <= 50000) {
          usdAmount = 990; // Enterprise Yearly
        } else if (inrAmount === 0) {
          // For zero amounts (cancellations, etc.), keep as 0
          usdAmount = 0;
        } else {
          // Check payment description to determine correct plan amount
          const description = payment.description?.toLowerCase() || '';
          
          if (description.includes('enterprise monthly') || description.includes('enterprise')) {
            usdAmount = 99; // Enterprise Monthly
          } else if (description.includes('enterprise yearly')) {
            usdAmount = 990; // Enterprise Yearly
          } else if (description.includes('pro monthly') || description.includes('pro')) {
            usdAmount = 29; // Pro Monthly
          } else if (description.includes('pro yearly')) {
            usdAmount = 290; // Pro Yearly
          } else if (description.includes('upgrade') || description.includes('prorated')) {
            // For upgrade transactions, show the target plan amount instead of prorated amount
            if (description.includes('enterprise monthly')) {
              usdAmount = 99; // Enterprise Monthly
            } else if (description.includes('enterprise yearly')) {
              usdAmount = 990; // Enterprise Yearly
            } else if (description.includes('pro monthly')) {
              usdAmount = 29; // Pro Monthly
            } else if (description.includes('pro yearly')) {
              usdAmount = 290; // Pro Yearly
            } else {
              // For large prorated amounts, convert to reasonable USD
              if (inrAmount > 30000) { // Very large INR amounts
                usdAmount = 99; // Likely Enterprise Monthly
              } else if (inrAmount > 20000) {
                usdAmount = 290; // Likely Pro Yearly
              } else if (inrAmount > 8000) {
                usdAmount = 99; // Likely Enterprise Monthly
              } else if (inrAmount > 2000) {
                usdAmount = 29; // Likely Pro Monthly
              } else {
                usdAmount = Math.round(inrAmount / 83);
              }
            }
          } else {
            // Fallback: approximate conversion (₹83 ≈ $1)
            usdAmount = Math.round(inrAmount / 83);
          }
        }

        displayAmount = `$${usdAmount.toFixed(2)}`;
      } else {
        displayAmount = `$${(payment.amount / 100).toFixed(2)}`;
      }

      return {
        id:
          payment.razorpay_payment_id ||
          payment.stripe_payment_intent_id ||
          payment.id,
        date: new Date(payment.created_at).toLocaleDateString(),
        amount: displayAmount,
        status: payment.status === "succeeded" ? "Paid" : payment.status,
        plan: payment.description || "Subscription Payment",
      };
    });
  }, [paymentHistory]);

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
        price: billingInterval === "monthly" ? "$29" : "$290",
        interval: billingInterval === "monthly" ? "month" : "year",
        yearlyPrice: "$290",
        monthlyPrice: "$29",
        savings: billingInterval === "yearly" ? "Save $58 per year" : "",
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
        price: billingInterval === "monthly" ? "$99" : "$990",
        interval: billingInterval === "monthly" ? "month" : "year",
        yearlyPrice: "$990",
        monthlyPrice: "$99",
        savings: billingInterval === "yearly" ? "Save $198 per year" : "",
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
    [billingInterval, currentPlan],
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
                            ${plan.popular ? 'border-primary-500 relative ring-2 ring-primary-200' : 'hover:border-primary-300'}
                            ${plan.isCurrent ? 'bg-blue-50 border-blue-300 shadow-md' : ''}
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
                            {plan.isCurrent ? (
                              <Button disabled className="w-full">
                                Current Plan
                              </Button>
                            ) : (
                              <Button
                                variant={
                                  plan.name === "Free" ? "outline" : "default"
                                }
                                className="w-full"
                                onClick={() => {
                                  if (plan.name === "Free") {
                                    handleDowngradeToFree();
                                  } else if (plan.planId) {
                                    handleUpgradeOrSubscribe(plan.planId);
                                  }
                                }}
                                disabled={paymentLoading}
                              >
                                {paymentLoading
                                  ? "Loading..."
                                  : plan.name === "Free"
                                    ? "Downgrade to Free"
                                    : "Upgrade"}
                              </Button>
                            )}
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
