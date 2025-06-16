import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/context/AuthContext';
import Sidebar from '@/components/dashboard/Sidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Check, CreditCard, Receipt, AlertTriangle } from 'lucide-react';
import { usePayment } from '@/hooks/usePayment';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export default function Billing() {
  const [, navigate] = useLocation();
  const { user, isLoading: authLoading } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { cancelSubscription, upgradeSubscription, isLoading: paymentLoading } = usePayment();
  const { toast } = useToast();
  const [subscription, setSubscription] = useState<any>(null);
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [billingInterval, setBillingInterval] = useState<"monthly" | "yearly">("monthly");

  // Redirect to welcome page if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/welcome');
    }
  }, [user, authLoading, navigate]);

  // Fetch subscription and payment data
  useEffect(() => {
    if (user) {
      fetchBillingData();
    }
  }, [user]);

  const fetchBillingData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Fetch subscription data
      const subResponse = await fetch(`/api/subscription/user/${user.id}`);
      if (subResponse.ok) {
        const subData = await subResponse.json();
        setSubscription(subData);
      }

      // Fetch payment history
      const paymentResponse = await fetch(`/api/payment-history/user/${user.id}`);
      if (paymentResponse.ok) {
        const paymentData = await paymentResponse.json();
        setPaymentHistory(paymentData);
      }
    } catch (error) {
      console.error('Error fetching billing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!subscription || !user) return;

    const confirmMessage = `Are you sure you want to cancel your ${subscription.plan_name} subscription? You will continue to have access until ${new Date(subscription.current_period_end).toLocaleDateString()}, then your account will be downgraded to the Free plan.`;

    if (!confirm(confirmMessage)) return;

    try {
      const response = await fetch(`/api/subscription/${subscription.razorpay_subscription_id || subscription.id}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
        }),
      });

      if (response.ok) {
        toast({
          title: "Subscription cancelled",
          description: "Your subscription has been cancelled. You'll retain access until the end of your billing period.",
        });
        // Refresh billing data
        fetchBillingData();
      } else {
        const errorData = await response.text();
        console.error('Failed to cancel subscription:', errorData);
        toast({
          title: "Error",
          description: "Failed to cancel subscription. Please try again or contact support.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      toast({
        title: "Error",
        description: "Failed to cancel subscription. Please try again or contact support.",
        variant: "destructive",
      });
    }
  };

  const handleUpgradeSubscription = async (newPlanId: string) => {
    if (!subscription || !user) return;
    try {
      const response = await fetch(`/api/subscription/${subscription.razorpay_subscription_id || subscription.id}/upgrade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          newPlanId: newPlanId,
        }),
      });
  
      if (response.ok) {
        toast({
          title: "Subscription upgraded",
          description: "Your subscription has been upgraded.",
        });
        // Refresh billing data
        fetchBillingData();
      } else {
        const errorData = await response.text();
        console.error('Failed to upgrade subscription:', errorData);
        toast({
          title: "Error",
          description: "Failed to upgrade subscription. Please try again or contact support.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error upgrading subscription:', error);
      toast({
        title: "Error",
        description: "Failed to upgrade subscription. Please try again or contact support.",
        variant: "destructive",
      });
    }
  };

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user) return null;

  // Determine current plan based on subscription
  const getCurrentPlan = () => {
    if (!subscription || subscription.status !== 'active') {
      return {
        name: 'Free',
        price: '$0',
        interval: 'month',
        features: [
          'Up to 2 AI agents',
          '100 API requests per month',
          'Basic templates',
          'Community support'
        ]
      };
    }

    // Determine plan based on plan_name first, then fallback to price_id
    const planName = subscription.plan_name?.toLowerCase() || '';
    const priceId = subscription.price_id || '';

    // Check for Pro plans
    if (planName.includes('pro monthly') || priceId.includes('pro') && planName.includes('monthly')) {
      return {
        name: 'Pro',
        price: '$29',
        interval: 'month',
        features: [
          'Up to 10 AI agents',
          '1,000 API requests per month',
          'All templates',
          'Priority support',
          'Webhook integrations',
          'Custom branding'
        ]
      };
    }

    if (planName.includes('pro yearly') || priceId.includes('pro') && planName.includes('yearly')) {
      return {
        name: 'Pro',
        price: '$290',
        interval: 'year',
        features: [
          'Up to 10 AI agents',
          '1,000 API requests per month',
          'All templates',
          'Priority support',
          'Webhook integrations',
          'Custom branding'
        ]
      };
    }

    // Check for Enterprise plans
    if (planName.includes('enterprise monthly') || priceId.includes('enterprise') && planName.includes('monthly')) {
      return {
        name: 'Enterprise',
        price: '$99',
        interval: 'month',
        features: [
          'Unlimited AI agents',
          '10,000 API requests per month',
          'All templates',
          'Dedicated support',
          'Advanced analytics',
          'Custom model training',
          'SLA guarantees'
        ]
      };
    }

    if (planName.includes('enterprise yearly') || priceId.includes('enterprise') && planName.includes('yearly')) {
      return {
        name: 'Enterprise',
        price: '$990',
        interval: 'year',
        features: [
          'Unlimited AI agents',
          '10,000 API requests per month',
          'All templates',
          'Dedicated support',
          'Advanced analytics',
          'Custom model training',
          'SLA guarantees'
        ]
      };
    }

    // Fallback for any other plan - check if it's a general pro or enterprise
    if (planName.includes('pro')) {
      return {
        name: 'Pro',
        price: '$29',
        interval: 'month',
        features: [
          'Up to 10 AI agents',
          '1,000 API requests per month',
          'All templates',
          'Priority support',
          'Webhook integrations',
          'Custom branding'
        ]
      };
    }

    if (planName.includes('enterprise')) {
      return {
        name: 'Enterprise',
        price: '$99',
        interval: 'month',
        features: [
          'Unlimited AI agents',
          '10,000 API requests per month',
          'All templates',
          'Dedicated support',
          'Advanced analytics',
          'Custom model training',
          'SLA guarantees'
        ]
      };
    }

    return {
      name: 'Free',
      price: '$0',
      interval: 'month',
      features: [
        'Up to 2 AI agents',
        '100 API requests per month',
        'Basic templates',
        'Community support'
      ]
    };
  };

  const currentPlan = getCurrentPlan();

  const plans = [
    {
      name: 'Free',
      price: '$0',
      interval: 'month',
      features: [
        'Up to 2 AI agents',
        '100 API requests per month',
        'Basic templates',
        'Community support'
      ],
      isCurrent: currentPlan.name === 'Free',
      planId: null
    },
    {
      name: 'Pro',
      price: billingInterval === 'monthly' ? '$29' : '$290',
      interval: billingInterval === 'monthly' ? 'month' : 'year',
      yearlyPrice: '$290',
      monthlyPrice: '$29',
      savings: billingInterval === 'yearly' ? 'Save $58 per year' : '',
      features: [
        'Up to 10 AI agents',
        '1,000 API requests per month',
        'All templates',
        'Priority support',
        'Webhook integrations',
        'Custom branding'
      ],
      popular: true,
      isCurrent: (currentPlan.name === 'Pro' && 
                 ((billingInterval === 'monthly' && currentPlan.interval === 'month') || 
                  (billingInterval === 'yearly' && currentPlan.interval === 'year'))),
      planId: billingInterval === 'monthly' ? 'pro-monthly' : 'pro-yearly'
    },
    {
      name: 'Enterprise',
      price: billingInterval === 'monthly' ? '$99' : '$990',
      interval: billingInterval === 'monthly' ? 'month' : 'year',
      yearlyPrice: '$990',
      monthlyPrice: '$99',
      savings: billingInterval === 'yearly' ? 'Save $198 per year' : '',
      features: [
        'Unlimited AI agents',
        '10,000 API requests per month',
        'All templates',
        'Dedicated support',
        'Advanced analytics',
        'Custom model training',
        'SLA guarantees'
      ],
      isCurrent: (currentPlan.name === 'Enterprise' && 
                 ((billingInterval === 'monthly' && currentPlan.interval === 'month') || 
                  (billingInterval === 'yearly' && currentPlan.interval === 'year'))),
      planId: billingInterval === 'monthly' ? 'enterprise-monthly' : 'enterprise-yearly'
    }
  ];

  // Format payment history for display
  const formatPaymentHistory = () => {
    return paymentHistory.map((payment) => ({
      id: payment.stripe_payment_intent_id || payment.id,
      date: new Date(payment.created_at).toLocaleDateString(),
      amount: `$${(payment.amount / 100).toFixed(2)}`,
      status: payment.status === 'succeeded' ? 'Paid' : payment.status,
      plan: payment.description || 'Subscription Payment'
    }));
  };

  const invoices = formatPaymentHistory();

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main Content */}
      <div className="flex-1 ml-0 lg:ml-64 transition-all duration-300 overflow-y-auto">
        <div className="bg-blue-50 border-l-4 border-blue-500 text-blue-700 p-3 text-center text-sm">
          <p className="font-medium">Prices shown in USD. Payments processed in INR equivalent through Razorpay.</p>
        </div>
        <div className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Billing</h1>
            <p className="text-gray-600">Manage your subscription plan and billing details</p>
          </div>

          <Tabs defaultValue="subscription" className="w-full">
            <TabsList className="grid grid-cols-3 w-full md:w-auto mb-8">
              <TabsTrigger value="subscription" className="flex items-center">
                <CreditCard className="h-4 w-4 mr-2" />
                <span>Subscription</span>
              </TabsTrigger>
              <TabsTrigger value="invoices" className="flex items-center">
                <Receipt className="h-4 w-4 mr-2" />
                <span>Invoices</span>
              </TabsTrigger>
              <TabsTrigger value="usage" className="flex items-center">
                <AlertTriangle className="h-4 w-4 mr-2" />
                <span>Usage</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="subscription">
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>Current Plan</CardTitle>
                  <CardDescription>You are currently on the {currentPlan.name} plan.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col md:flex-row justify-between p-6 bg-gray-50 rounded-lg">
                    <div>
                      <h3 className="text-xl font-bold">{currentPlan.name} Plan</h3>
                      <p className="text-3xl font-bold mt-2">{currentPlan.price}<span className="text-sm text-gray-500 font-normal">/{currentPlan.interval}</span></p>
                      <ul className="mt-4 space-y-2">
                        {currentPlan.features.map((feature, index) => (
                          <li key={index} className="flex items-center">
                            <Check className="h-5 w-5 text-green-500 mr-2" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="mt-6 md:mt-0 flex flex-col justify-center">
                      <Badge className="mb-4 self-end">Current Plan</Badge>
                      {subscription && subscription.status === 'active' ? (
                        <Button 
                          variant="outline"
                          onClick={() => handleCancelSubscription()}
                          disabled={paymentLoading}
                        >
                          {paymentLoading ? 'Loading...' : 'Cancel Subscription'}
                        </Button>
                      ) : (
                        <Button variant="outline" onClick={() => navigate('/pricing')}>Change Plan</Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Available Plans</h2>
                <div className="flex items-center space-x-2">
                  <Label htmlFor="billing-toggle" className={`text-sm ${billingInterval === "monthly" ? "font-medium" : ""}`}>
                    Monthly
                  </Label>
                  <Switch
                    id="billing-toggle"
                    checked={billingInterval === "yearly"}
                    onCheckedChange={(checked) => setBillingInterval(checked ? "yearly" : "monthly")}
                  />
                  <Label htmlFor="billing-toggle" className={`text-sm ${billingInterval === "yearly" ? "font-medium" : ""}`}>
                    Yearly <span className="text-green-600 text-xs font-medium">Save 20%</span>
                  </Label>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {plans.map((plan, index) => (
                  <Card key={index} className={plan.popular ? 'border-primary-500 relative' : ''}>
                    {plan.popular && (
                      <div className="absolute top-0 right-0 bg-primary-500 text-white px-3 py-1 text-xs font-medium rounded-bl-lg rounded-tr-lg">
                        Most Popular
                      </div>
                    )}
                    <CardHeader>
                      <CardTitle>{plan.name}</CardTitle>
                      <CardDescription>
                        <span className="text-3xl font-bold">{plan.price}</span>
                        <span className="text-sm">/{plan.interval}</span>
                        {plan.savings && (
                          <p className="text-green-600 font-medium text-sm mt-1">{plan.savings}</p>
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
                        <Button disabled className="w-full">Current Plan</Button>
                      ) : plan.name === 'Free' ? (
                        <Button 
                          variant="outline" 
                          className="w-full"
                          onClick={() => handleCancelSubscription()}
                          disabled={!subscription || paymentLoading}
                        >
                          {paymentLoading ? 'Loading...' : 'Downgrade to Free'}
                        </Button>
                      ) : plan.name === 'Enterprise' && currentPlan.name === 'Pro' ? (
                        <Button 
                          className="w-full"
                          onClick={() => handleUpgradeSubscription(plan.planId || 'enterprise-monthly')}
                          disabled={paymentLoading}
                        >
                          {paymentLoading ? 'Upgrading...' : `Upgrade to Enterprise ${billingInterval === 'yearly' ? 'Yearly' : 'Monthly'}`}
                        </Button>
                      ) : plan.name === 'Pro' && currentPlan.name === 'Enterprise' ? (
                        <Button 
                          variant="outline"
                          className="w-full"
                          onClick={() => handleCancelSubscription()}
                          disabled={paymentLoading}
                        >
                          {paymentLoading ? 'Processing...' : `Downgrade to Pro ${billingInterval === 'yearly' ? 'Yearly' : 'Monthly'}`}
                        </Button>
                      ) : (
                        <Button 
                          className={plan.popular ? 'w-full bg-primary-600' : 'w-full'}
                          onClick={() => {
                            // Navigate to pricing page for upgrades
                            navigate('/pricing');
                          }}
                          disabled={paymentLoading}
                        >
                          {paymentLoading ? 'Loading...' : 'Upgrade'}
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="invoices">
              <Card>
                <CardHeader>
                  <CardTitle>Invoices</CardTitle>
                  <CardDescription>View and download your past invoices.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</th>
                          <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Download</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {invoices.map((invoice) => (
                          <tr key={invoice.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{invoice.id}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{invoice.date}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{invoice.amount}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                                {invoice.status}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{invoice.plan}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <Button variant="ghost" size="sm">PDF</Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <p className="text-sm text-gray-500">Showing all invoices</p>
                  <Button variant="outline" size="sm">
                    Export All
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="usage">
              <Card>
                <CardHeader>
                  <CardTitle>Usage Overview</CardTitle>
                  <CardDescription>Monitor your API usage and limits for the current billing period.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium mb-2">API Calls</h3>
                      <div className="flex items-center">
                        <div className="flex-1 bg-gray-200 rounded-full h-4 mr-4">
                          <div className="bg-primary-600 h-4 rounded-full" style={{width: '43%'}}></div>
                        </div>
                        <span className="font-medium">43/100</span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">43% of your monthly limit</p>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium mb-2">Active Agents</h3>
                      <div className="flex items-center">
                        <div className="flex-1 bg-gray-200 rounded-full h-4 mr-4">
                          <div className="bg-green-600 h-4 rounded-full" style={{width: '50%'}}></div>
                        </div>
                        <span className="font-medium">1/2</span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">50% of your allowed agents</p>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h3 className="font-medium">Need more resources?</h3>
                      <p className="text-sm text-gray-600 mt-1 mb-3">Upgrade your plan to get higher limits and additional features.</p>
                      <Button>View Plans</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}