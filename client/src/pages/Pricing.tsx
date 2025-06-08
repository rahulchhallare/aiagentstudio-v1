import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default function Pricing() {
  const [billingInterval, setBillingInterval] = useState<"monthly" | "yearly">("monthly");

  const plans = [
    {
      name: "Free",
      description: "For individuals just getting started with AI agents",
      price: { monthly: "$0", yearly: "$0" },
      features: [
        "Up to 2 AI agents",
        "100 API requests per month",
        "Basic templates",
        "Community support",
      ],
      button: {
        text: "Get Started",
        variant: "outline" as const,
      },
    },
    {
      name: "Pro",
      description: "For professionals and small teams",
      price: { monthly: "$29", yearly: "$290" },
      savings: { monthly: "", yearly: "Save $58 per year" },
      features: [
        "Up to 10 AI agents",
        "1,000 API requests per month",
        "All templates",
        "Priority support",
        "Webhook integrations",
        "Custom branding",
      ],
      mostPopular: true,
      button: {
        text: "Get Started",
        variant: "default" as const,
      },
    },
    {
      name: "Enterprise",
      description: "For businesses with advanced needs",
      price: { monthly: "$99", yearly: "$990" },
      savings: { monthly: "", yearly: "Save $198 per year" },
      features: [
        "Unlimited AI agents",
        "10,000 API requests per month",
        "All templates",
        "Dedicated support",
        "Advanced analytics",
        "Custom model training",
        "SLA guarantees",
      ],
      button: {
        text: "Contact Sales",
        variant: "outline" as const,
      },
    },
  ];

  const faqs = [
    {
      question: "How are API requests counted?",
      answer:
        "Each time your agent processes a request through a GPT block, it counts as one API call. Multiple blocks in a single agent flow may consume multiple API calls per user interaction.",
    },
    {
      question: "Can I change my plan later?",
      answer:
        "Yes, you can upgrade or downgrade your plan at any time. When upgrading, you'll be charged the prorated difference for the remainder of your billing period. When downgrading, the new rate will apply at the start of your next billing cycle.",
    },
    {
      question: "What payment methods do you accept?",
      answer:
        "We accept all major credit cards including Visa, Mastercard, American Express, and Discover. For Enterprise plans, we also support invoicing and purchase orders.",
    },
    {
      question: "Is there a free trial?",
      answer:
        "We offer a 14-day free trial of the Pro plan with no credit card required. You can test out all the features and then decide which plan is right for you.",
    },
    {
      question: "What happens if I go over my monthly API requests?",
      answer:
        "If you exceed your monthly API request limit, additional requests will be charged at $0.01 per request. You can set up usage alerts to notify you when you're approaching your limit.",
    },
  ];

  return (
    <div className="container max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Simple, Transparent Pricing</h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Choose the plan that's right for you and start building powerful AI agents.
        </p>

        <div className="flex items-center justify-center mt-8">
          <div className="flex items-center space-x-2">
            <Label htmlFor="billing-toggle" className={`text-base ${billingInterval === "monthly" ? "font-medium" : ""}`}>
              Monthly
            </Label>
            <Switch
              id="billing-toggle"
              checked={billingInterval === "yearly"}
              onCheckedChange={(checked) => setBillingInterval(checked ? "yearly" : "monthly")}
            />
            <Label htmlFor="billing-toggle" className={`text-base ${billingInterval === "yearly" ? "font-medium" : ""}`}>
              Yearly <span className="text-green-600 text-sm font-medium">Save 20%</span>
            </Label>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        {plans.map((plan, index) => (
          <Card
            key={index}
            className={`relative border-2 ${
              plan.mostPopular ? "border-primary-500 shadow-lg" : "border-gray-200"
            }`}
          >
            {plan.mostPopular && (
              <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 px-4 py-1 bg-primary-500 text-white">
                Most Popular
              </Badge>
            )}
            <CardHeader>
              <CardTitle className="text-2xl">{plan.name}</CardTitle>
              <CardDescription className="text-gray-600">{plan.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <span className="text-4xl font-bold">{plan.price[billingInterval]}</span>
                <span className="text-gray-500 ml-2">per month</span>
                {plan.savings && plan.savings[billingInterval] && (
                  <p className="text-green-600 font-medium text-sm mt-1">{plan.savings[billingInterval]}</p>
                )}
              </div>

              <ul className="space-y-3">
                {plan.features.map((feature, fIndex) => (
                  <li key={fIndex} className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                className={`w-full ${plan.mostPopular ? "bg-primary-600 hover:bg-primary-700" : ""}`}
                variant={plan.button.variant}
              >
                {plan.button.text}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="bg-gray-50 rounded-xl p-8 md:p-12 mb-16">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Custom Enterprise Solution</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Need a custom solution for your enterprise? Our team can help you design a plan that meets your specific needs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-xl font-semibold mb-4 text-center">Dedicated Support</h3>
            <p className="text-gray-600 text-center">
              Get priority access to our support team with guaranteed response times.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-xl font-semibold mb-4 text-center">Custom Integrations</h3>
            <p className="text-gray-600 text-center">
              We'll help you integrate AIagentStudio with your existing systems and workflows.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-xl font-semibold mb-4 text-center">Advanced Security</h3>
            <p className="text-gray-600 text-center">
              Enhanced security features including SSO, role-based access control, and audit logs.
            </p>
          </div>
        </div>

        <div className="text-center mt-8">
          <Button size="lg" variant="outline">
            Contact Sales Team
          </Button>
        </div>
      </div>

      <div className="mb-16">
        <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Frequently Asked Questions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {faqs.map((faq, index) => (
            <div key={index} className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-semibold mb-2">{faq.question}</h3>
              <p className="text-gray-600">{faq.answer}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-primary-50 rounded-2xl p-8 md:p-12 text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to get started?</h2>
        <p className="text-lg text-gray-600 mb-6 max-w-3xl mx-auto">
          Join thousands of users building and deploying AI agents with AIagentStudio.ai
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Button size="lg" className="bg-primary-600 hover:bg-primary-700">
            Sign Up Free
          </Button>
          <Button size="lg" variant="outline">
            Schedule a Demo
          </Button>
        </div>
      </div>
    </div>
  );
}