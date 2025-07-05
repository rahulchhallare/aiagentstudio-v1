import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  ArrowLeft,
  ArrowRight,
  Settings, 
  CheckCircle, 
  CreditCard,
  Rocket,
  Globe,
  Code,
  Upload,
  Eye,
  DollarSign,
  Shield,
  Zap
} from "lucide-react";

interface CustomizationFlowProps {
  recommendationId: string;
  agentName: string;
  action: 'deploy' | 'preview';
}

export default function AgentCustomization() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentComplete, setDeploymentComplete] = useState(false);
  const [embedCode, setEmbedCode] = useState("");
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  
  const [customization, setCustomization] = useState({
    agentName: "Customer Support Assistant",
    businessInfo: {
      businessName: "",
      industry: "",
      website: "",
      description: ""
    },
    integrations: {
      shopify: false,
      wordpress: false,
      customApi: false,
      email: false,
      slack: false
    },
    configuration: {
      responseStyle: "professional",
      language: "english",
      timezone: "UTC",
      workingHours: "24/7",
      escalationEmail: "",
      brandVoice: ""
    },
    pricing: {
      plan: "monthly", // monthly or onetime
      setupFee: 49,
      monthlyFee: 19
    }
  });

  const { toast } = useToast();

  useEffect(() => {
    // Get URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const recommendationId = urlParams.get('recommendation');
    const name = urlParams.get('name');
    const action = urlParams.get('action');
    
    if (name) {
      setCustomization(prev => ({
        ...prev,
        agentName: decodeURIComponent(name)
      }));
    }
  }, []);

  const totalSteps = 5;
  const progress = (currentStep / totalSteps) * 100;

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handlePayment = async () => {
    // Simulate payment processing
    toast({
      title: "Processing Payment",
      description: "Please wait while we process your payment...",
    });
    
    setTimeout(() => {
      setPaymentConfirmed(true);
      toast({
        title: "Payment Successful",
        description: "Your payment has been processed successfully!",
      });
      handleNext();
    }, 2000);
  };

  const handleDeployment = async () => {
    setIsDeploying(true);
    
    try {
      // Simulate deployment process
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const generatedEmbedCode = `<!-- AI Agent Embed Code -->
<div id="ai-agent-widget"></div>
<script>
  (function() {
    var script = document.createElement('script');
    script.src = 'https://cdn.aiagntstudio.ai/widget.js';
    script.dataset.agentId = 'agent-${Date.now()}';
    script.dataset.businessName = '${customization.businessInfo.businessName}';
    document.head.appendChild(script);
  })();
</script>`;
      
      setEmbedCode(generatedEmbedCode);
      setDeploymentComplete(true);
      
      toast({
        title: "Deployment Complete!",
        description: "Your AI agent is now live and ready to use!",
      });
    } catch (error) {
      toast({
        title: "Deployment Failed",
        description: "Something went wrong during deployment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsDeploying(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Business Information
              </CardTitle>
              <CardDescription>
                Tell us about your business to customize your AI agent
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="businessName">Business Name</Label>
                  <Input
                    id="businessName"
                    value={customization.businessInfo.businessName}
                    onChange={(e) => setCustomization(prev => ({
                      ...prev,
                      businessInfo: { ...prev.businessInfo, businessName: e.target.value }
                    }))}
                    placeholder="Your Business Name"
                  />
                </div>
                <div>
                  <Label htmlFor="industry">Industry</Label>
                  <Select value={customization.businessInfo.industry} onValueChange={(value) => 
                    setCustomization(prev => ({
                      ...prev,
                      businessInfo: { ...prev.businessInfo, industry: value }
                    }))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your industry" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ecommerce">E-commerce</SelectItem>
                      <SelectItem value="saas">SaaS</SelectItem>
                      <SelectItem value="healthcare">Healthcare</SelectItem>
                      <SelectItem value="finance">Finance</SelectItem>
                      <SelectItem value="education">Education</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="website">Website URL</Label>
                <Input
                  id="website"
                  value={customization.businessInfo.website}
                  onChange={(e) => setCustomization(prev => ({
                    ...prev,
                    businessInfo: { ...prev.businessInfo, website: e.target.value }
                  }))}
                  placeholder="https://your-website.com"
                />
              </div>
              <div>
                <Label htmlFor="description">Business Description</Label>
                <Textarea
                  id="description"
                  value={customization.businessInfo.description}
                  onChange={(e) => setCustomization(prev => ({
                    ...prev,
                    businessInfo: { ...prev.businessInfo, description: e.target.value }
                  }))}
                  placeholder="Briefly describe what your business does..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        );

      case 2:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Integrations & Channels
              </CardTitle>
              <CardDescription>
                Connect your existing tools and platforms
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">E-commerce Platforms</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="shopify">Shopify Integration</Label>
                      <Switch
                        id="shopify"
                        checked={customization.integrations.shopify}
                        onCheckedChange={(checked) => setCustomization(prev => ({
                          ...prev,
                          integrations: { ...prev.integrations, shopify: checked }
                        }))}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="wordpress">WordPress/WooCommerce</Label>
                      <Switch
                        id="wordpress"
                        checked={customization.integrations.wordpress}
                        onCheckedChange={(checked) => setCustomization(prev => ({
                          ...prev,
                          integrations: { ...prev.integrations, wordpress: checked }
                        }))}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-medium">Communication Channels</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="email">Email Integration</Label>
                      <Switch
                        id="email"
                        checked={customization.integrations.email}
                        onCheckedChange={(checked) => setCustomization(prev => ({
                          ...prev,
                          integrations: { ...prev.integrations, email: checked }
                        }))}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="slack">Slack Notifications</Label>
                      <Switch
                        id="slack"
                        checked={customization.integrations.slack}
                        onCheckedChange={(checked) => setCustomization(prev => ({
                          ...prev,
                          integrations: { ...prev.integrations, slack: checked }
                        }))}
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <Label htmlFor="escalationEmail">Escalation Email</Label>
                <Input
                  id="escalationEmail"
                  value={customization.configuration.escalationEmail}
                  onChange={(e) => setCustomization(prev => ({
                    ...prev,
                    configuration: { ...prev.configuration, escalationEmail: e.target.value }
                  }))}
                  placeholder="support@yourcompany.com"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Email address for complex queries that need human attention
                </p>
              </div>
            </CardContent>
          </Card>
        );

      case 3:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Preview & Test Your Agent
              </CardTitle>
              <CardDescription>
                See how your AI agent will interact with customers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border rounded-lg p-4 bg-gray-50">
                <h4 className="font-medium mb-3">Agent Configuration Summary</h4>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Business:</strong> {customization.businessInfo.businessName || "Not specified"}
                  </div>
                  <div>
                    <strong>Industry:</strong> {customization.businessInfo.industry || "Not specified"}
                  </div>
                  <div>
                    <strong>Integrations:</strong> {
                      Object.entries(customization.integrations)
                        .filter(([_, enabled]) => enabled)
                        .map(([key, _]) => key)
                        .join(", ") || "None"
                    }
                  </div>
                  <div>
                    <strong>Escalation Email:</strong> {customization.configuration.escalationEmail || "Not set"}
                  </div>
                </div>
              </div>
              
              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-3">Interactive Preview</h4>
                <div className="bg-white border rounded-lg p-4 min-h-[200px]">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm">
                      AI
                    </div>
                    <div className="flex-1">
                      <div className="bg-gray-100 rounded-lg p-3">
                        <p>Hello! I'm the AI assistant for {customization.businessInfo.businessName || "your business"}. How can I help you today?</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 justify-end">
                    <div className="flex-1 text-right">
                      <div className="bg-blue-500 text-white rounded-lg p-3 inline-block">
                        <p>Hi, I have a question about my order</p>
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 text-sm">
                      U
                    </div>
                  </div>
                  <div className="flex items-start gap-3 mt-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm">
                      AI
                    </div>
                    <div className="flex-1">
                      <div className="bg-gray-100 rounded-lg p-3">
                        <p>I'd be happy to help you with your order! Could you please provide your order number so I can look it up for you?</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-3">
                  <Button variant="outline" className="w-full">
                    Test Interactive Chat
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 4:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Payment & Subscription
              </CardTitle>
              <CardDescription>
                Choose your pricing plan and complete payment
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <Card className={`cursor-pointer transition-all ${customization.pricing.plan === 'onetime' ? 'ring-2 ring-blue-500' : ''}`}>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <h3 className="font-semibold mb-2">One-time Purchase</h3>
                      <div className="text-2xl font-bold text-green-600 mb-2">$49</div>
                      <p className="text-sm text-gray-600">Pay once, use forever</p>
                      <Button 
                        variant={customization.pricing.plan === 'onetime' ? 'default' : 'outline'}
                        className="w-full mt-3"
                        onClick={() => setCustomization(prev => ({
                          ...prev,
                          pricing: { ...prev.pricing, plan: 'onetime' }
                        }))}
                      >
                        Select Plan
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className={`cursor-pointer transition-all ${customization.pricing.plan === 'monthly' ? 'ring-2 ring-blue-500' : ''}`}>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <h3 className="font-semibold mb-2">Monthly Subscription</h3>
                      <div className="text-2xl font-bold text-blue-600 mb-2">$19/mo</div>
                      <p className="text-sm text-gray-600">Includes updates & support</p>
                      <Button 
                        variant={customization.pricing.plan === 'monthly' ? 'default' : 'outline'}
                        className="w-full mt-3"
                        onClick={() => setCustomization(prev => ({
                          ...prev,
                          pricing: { ...prev.pricing, plan: 'monthly' }
                        }))}
                      >
                        Select Plan
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {!paymentConfirmed ? (
                <div className="space-y-4">
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-3">Payment Details</h4>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="cardNumber">Card Number</Label>
                        <Input id="cardNumber" placeholder="1234 5678 9012 3456" />
                      </div>
                      <div>
                        <Label htmlFor="expiryDate">Expiry Date</Label>
                        <Input id="expiryDate" placeholder="MM/YY" />
                      </div>
                      <div>
                        <Label htmlFor="cvv">CVV</Label>
                        <Input id="cvv" placeholder="123" />
                      </div>
                      <div>
                        <Label htmlFor="billingName">Billing Name</Label>
                        <Input id="billingName" placeholder="Full Name" />
                      </div>
                    </div>
                  </div>
                  
                  <Button onClick={handlePayment} className="w-full" size="lg">
                    <CreditCard className="w-4 h-4 mr-2" />
                    Complete Payment - ${customization.pricing.plan === 'monthly' ? '19' : '49'}
                  </Button>
                </div>
              ) : (
                <div className="text-center p-6 bg-green-50 rounded-lg">
                  <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-green-800">Payment Successful!</h3>
                  <p className="text-green-600">Your payment has been processed. Ready to deploy your agent.</p>
                </div>
              )}
            </CardContent>
          </Card>
        );

      case 5:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Rocket className="w-5 h-5" />
                Deployment & Go Live
              </CardTitle>
              <CardDescription>
                Your AI agent is being deployed and will be ready shortly
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {!deploymentComplete ? (
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <h3 className="text-lg font-semibold">
                      {isDeploying ? "Deploying Your Agent..." : "Ready to Deploy"}
                    </h3>
                    <p className="text-gray-600">
                      {isDeploying 
                        ? "Setting up your AI agent in the cloud. This may take a few moments."
                        : "Click the button below to start the deployment process."
                      }
                    </p>
                  </div>
                  
                  {!isDeploying && (
                    <Button onClick={handleDeployment} className="w-full" size="lg">
                      <Rocket className="w-4 h-4 mr-2" />
                      Deploy Agent Now
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="text-center p-6 bg-green-50 rounded-lg">
                    <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-green-800">Agent Deployed Successfully!</h3>
                    <p className="text-green-600">Your AI agent is now live and ready to handle customer inquiries.</p>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Embed Code</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Textarea
                          value={embedCode}
                          readOnly
                          rows={6}
                          className="font-mono text-xs"
                        />
                        <Button variant="outline" className="w-full mt-2" onClick={() => {
                          navigator.clipboard.writeText(embedCode);
                          toast({ title: "Copied!", description: "Embed code copied to clipboard" });
                        }}>
                          <Code className="w-4 h-4 mr-2" />
                          Copy Embed Code
                        </Button>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Quick Actions</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <Button variant="outline" className="w-full">
                          <Globe className="w-4 h-4 mr-2" />
                          View Live Agent
                        </Button>
                        <Button variant="outline" className="w-full">
                          <Settings className="w-4 h-4 mr-2" />
                          Agent Dashboard
                        </Button>
                        <Button variant="outline" className="w-full">
                          <Upload className="w-4 h-4 mr-2" />
                          Upload FAQs
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Deploy {customization.agentName}</h1>
          <p className="text-gray-600">Configure and deploy your AI agent in minutes</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Step {currentStep} of {totalSteps}</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="w-full" />
        </div>

        {/* Step Content */}
        <div className="mb-8">
          {renderStep()}
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={handleBack}
            disabled={currentStep === 1}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          
          {currentStep < totalSteps && (
            <Button 
              onClick={handleNext}
              disabled={currentStep === 4 && !paymentConfirmed}
            >
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
          
          {currentStep === totalSteps && deploymentComplete && (
            <Button onClick={() => window.location.href = '/agent-dashboard'}>
              Go to Agent Dashboard
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}