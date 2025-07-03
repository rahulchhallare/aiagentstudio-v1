import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Chatbot from '@/components/Chatbot';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { MessageCircle, BarChart3, Shield, Globe, Clock, Zap } from 'lucide-react';

export default function ChatbotDemo() {
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);

  const features = [
    {
      icon: <MessageCircle className="h-6 w-6" />,
      title: "24/7 Customer Support",
      description: "Always available to help your customers with instant responses"
    },
    {
      icon: <BarChart3 className="h-6 w-6" />,
      title: "Analytics & Insights", 
      description: "Track usage, escalation rates, and customer satisfaction metrics"
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: "GDPR Compliant",
      description: "Built-in consent management and data privacy protection"
    },
    {
      icon: <Globe className="h-6 w-6" />,
      title: "Easy Integration",
      description: "Embed on any website with a simple JavaScript snippet"
    },
    {
      icon: <Clock className="h-6 w-6" />,
      title: "Smart Workflows",
      description: "Automated returns, order tracking, and escalation to human agents"
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: "AI-Powered",
      description: "Uses OpenAI to understand complex queries and provide helpful responses"
    }
  ];

  const embedCode = `<!-- Add this script to your website -->
<script>
  window.chatbotConfig = {
    apiUrl: '${window.location.origin}',
    theme: 'light',
    position: 'bottom-right'
  };
</script>
<script src="${window.location.origin}/chatbot-embed.js"></script>`;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onLoginClick={() => {}} onSignupClick={() => {}} />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Customer Service Chatbot
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Provide instant, 24/7 customer support with our AI-powered chatbot. 
            Handle FAQs, order tracking, returns, and seamlessly escalate to human agents when needed.
          </p>
          <div className="mt-6">
            <Button 
              onClick={() => setIsChatbotOpen(true)}
              size="lg"
              className="mr-4"
            >
              Try Demo Chatbot
            </Button>
            <Badge variant="secondary" className="text-sm px-3 py-1">
              Live Demo Available
            </Badge>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {features.map((feature, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Capabilities Section */}
        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          <Card>
            <CardHeader>
              <CardTitle>What Our Chatbot Can Do</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <strong>Answer FAQs:</strong> Shipping info, return policies, payment methods
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <strong>Order Tracking:</strong> Check status with order numbers via Shopify/Stripe
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <strong>Returns Processing:</strong> Collect details and generate authorization numbers
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <strong>Human Escalation:</strong> Smart detection of complex issues
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <strong>GDPR Compliance:</strong> Consent management for data collection
                  </div>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Easy Website Integration</CardTitle>
              <CardDescription>
                Add our chatbot to any website with just a few lines of code
              </CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
                <code>{embedCode}</code>
              </pre>
              <p className="text-sm text-gray-600 mt-3">
                The chatbot will automatically appear on your website and begin helping customers immediately.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Demo Instructions */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Try the Demo</CardTitle>
            <CardDescription>
              Test our chatbot with these sample interactions:
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2">Sample Questions to Try:</h4>
                <ul className="space-y-2 text-sm">
                  <li>• "What are your shipping options?"</li>
                  <li>• "I need to track my order #ABC123"</li>
                  <li>• "How do I return an item?"</li>
                  <li>• "I need to speak to a human agent"</li>
                  <li>• "What payment methods do you accept?"</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Features to Test:</h4>
                <ul className="space-y-2 text-sm">
                  <li>• GDPR consent flow</li>
                  <li>• Order tracking workflow</li>
                  <li>• Return request process</li>
                  <li>• Human agent escalation</li>
                  <li>• FAQ responses</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="text-center">
          <div className="space-y-4">
            <Button 
              onClick={() => setIsChatbotOpen(true)}
              size="lg"
              className="w-full sm:w-auto"
            >
              Open Chatbot Demo
            </Button>
            
            <Button 
              onClick={() => window.open('/test-embed', '_blank')}
              variant="secondary" 
              size="lg"
              className="w-full sm:w-auto ml-0 sm:ml-4"
            >
              <Globe className="w-4 h-4 mr-2" />
              Test Website Embed
            </Button>
          </div>
          <p className="text-gray-600 mt-4">
            Experience our AI-powered customer service in action
          </p>
        </div>
      </div>

      {/* Chatbot Component */}
      <Chatbot 
        isOpen={isChatbotOpen} 
        onToggle={() => setIsChatbotOpen(!isChatbotOpen)} 
      />
    </div>
  );
}