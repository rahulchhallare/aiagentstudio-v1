import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import LoginModal from "@/components/LoginModal";
import SignupModal from "@/components/SignupModal";
import Sidebar from "@/components/dashboard/Sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Bot,
  FileText,
  Zap,
  Database,
  MessageSquare,
  Brain,
  Search,
  Settings,
  BarChart3,
  Users,
  Building,
  Cpu,
  Copy,
  Layout,
  TrendingUp,
  Target,
  BarChart,
  Cog,
  ArrowRight,
  Star,
} from "lucide-react";
import Footer from "@/components/Footer";

// Template card component
interface TemplateCardProps {
  id: string;
  title: string;
  description: string;
  category: "content" | "customer-support" | "data-processing" | "business-analysis" | "sales-marketing" | "analytics" | "operations" | "industry-specific";
  popular?: boolean;
  new?: boolean;
  onClick: () => void;
}

const TemplateCard = ({
  id,
  title,
  description,
  category,
  popular,
  new: isNew,
  onClick,
}: TemplateCardProps) => {
  const categoryColor = {
    content: "bg-gradient-to-r from-brand-blue to-brand-green",
    "customer-support": "bg-gradient-to-r from-brand-blue to-primary-600",
    "data-processing": "bg-gradient-to-r from-brand-green to-secondary-600",
    "business-analysis": "bg-gradient-to-r from-brand-blue to-brand-green",
    "sales-marketing": "bg-gradient-to-r from-brand-green to-brand-blue",
    "analytics": "bg-gradient-to-r from-brand-blue to-brand-green",
    "operations": "bg-gradient-to-r from-brand-green to-brand-blue",
    "industry-specific": "bg-gradient-to-r from-brand-blue to-brand-green",
  }[category];

  const categoryName = {
    content: "Content Creation",
    "customer-support": "Customer Support",
    "data-processing": "Data Processing",
    "business-analysis": "Business Analysis",
    "sales-marketing": "Sales & Marketing",
    "analytics": "Analytics",
    "operations": "Operations",
    "industry-specific": "Industry Specific",
  }[category];

  const categoryIcon = {
    content: <Copy className="h-5 w-5 mr-1" />,
    "customer-support": <Users className="h-5 w-5 mr-1" />,
    "data-processing": <Layout className="h-5 w-5 mr-1" />,
    "business-analysis": <TrendingUp className="h-5 w-5 mr-1" />,
    "sales-marketing": <Target className="h-5 w-5 mr-1" />,
    "analytics": <BarChart className="h-5 w-5 mr-1" />,
    "operations": <Cog className="h-5 w-5 mr-1" />,
    "industry-specific": <Building className="h-5 w-5 mr-1" />,
  }[category];

  return (
    <Card
      className="overflow-hidden h-full transition-all duration-200 hover:shadow-lg cursor-pointer border-transparent hover:border-primary/20 relative"
      onClick={onClick}
    >
      {popular && !isNew && (
        <Badge
          variant="secondary"
          className="absolute top-2 right-2 flex items-center gap-1"
        >
          <Star className="h-3 w-3 text-yellow-500" fill="currentColor" />
          Popular
        </Badge>
      )}
      {isNew && (
        <Badge
          variant="secondary"
          className="absolute top-2 right-2 flex items-center gap-1"
        >
          <Zap className="h-3 w-3 text-blue-500" />
          New
        </Badge>
      )}
      {popular && isNew && (
        <div className="absolute top-2 right-2 flex gap-1">
          <Badge
            variant="secondary"
            className="flex items-center gap-1"
          >
            <Zap className="h-3 w-3 text-blue-500" />
            New
          </Badge>
          <Badge
            variant="secondary"
            className="flex items-center gap-1"
          >
            <Star className="h-3 w-3 text-yellow-500" fill="currentColor" />
            Popular
          </Badge>
        </div>
      )}
      <div className={`h-3 ${categoryColor}`} />
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold">{title}</h3>
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between">
          <Badge variant="outline" className="flex items-center">
            {categoryIcon}
            {categoryName}
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            className="text-primary flex items-center"
          >
            Use Template
            <ArrowRight className="ml-1 h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default function Templates() {
  const [, navigate] = useLocation();
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);

  // No redirect - allow unauthenticated users to view templates

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Template data structure that matches homepage format
  const templates = [
    // Business Analysis
    {
      id: "ba-1",
      title: "Business Analyzer",
      description: "Analyze any business website to discover optimal AI solutions with ROI estimates",
      category: "business-analysis" as const,
      popular: true,
      new: true,
    },
    
    // LLM SEO Optimizer - positioned prominently after Business Analyzer
    {
      id: "llm-seo-optimizer",
      title: "LLM SEO Optimizer AI Agent",
      description: "Advanced AI-powered SEO optimization specifically for LLM and generative search engines like ChatGPT Search, Google AI Search, Perplexity, and Claude",
      category: "operations" as const,
      new: true,
      popular: true,
    },
    
    // Customer Support & Service Agents
    {
      id: "customer-support-assistant",
      title: "AI-Powered Customer Support Assistant",
      description: "24/7 automated customer service with advanced sentiment analysis, order tracking, and human escalation",
      category: "customer-support" as const,
      popular: true,
      new: true,
    },
    {
      id: "cs-1",
      title: "FAQ Responder",
      description: "Answer customer questions using your knowledge base",
      category: "customer-support" as const,
      popular: true,
    },
    {
      id: "tc-1",
      title: "Ticket Classifier",
      description: "Automatically categorize support tickets by priority and type",
      category: "customer-support" as const,
      new: true,
    },
    {
      id: "chatbot-1",
      title: "E-commerce Customer Service Bot",
      description: "24/7 AI-powered customer support with order tracking, returns, and human escalation",
      category: "customer-support" as const,
      popular: true,
    },

    // Sales & Marketing Agents
    {
      id: "lead-generation-assistant",
      title: "AI Lead Generation & Qualification Assistant",
      description: "Automatically qualify leads, schedule appointments, and nurture prospects through personalized interactions",
      category: "sales-marketing" as const,
      new: true,
      popular: true,
    },
    {
      id: "personalization-engine",
      title: "AI-Powered Personalization & Recommendation System",
      description: "Deliver personalized content, product recommendations, and user experiences to increase engagement and drive sales",
      category: "sales-marketing" as const,
      popular: true,
      new: true,
    },

    // Analytics & Intelligence Agents
    {
      id: "sentiment-intelligence-platform",
      title: "AI-Driven Sentiment Intelligence Platform",
      description: "Transform customer feedback into actionable insights with real-time sentiment analysis and trend detection",
      category: "analytics" as const,
      new: true,
      popular: true,
    },
    {
      id: "business-intelligence-platform",
      title: "Business Intelligence & Forecasting Platform",
      description: "AI-powered predictive analytics to forecast sales trends, customer behavior, and market opportunities",
      category: "analytics" as const,
      popular: true,
      new: true,
    },
    {
      id: "dp-1",
      title: "Data Summarizer",
      description: "Extract key insights from complex data and documents",
      category: "data-processing" as const,
    },
    {
      id: "dp-2",
      title: "Research Assistant",
      description: "Compile research findings and generate reports",
      category: "data-processing" as const,
      new: true,
    },

    // Operations & Automation Agents
    {
      id: "ai-monitoring-dashboard",
      title: "Continuous AI Evaluation & Monitoring Dashboard",
      description: "Real-time monitoring of all AI solutions' performance, ROI tracking, bias detection, and continuous improvement recommendations",
      category: "operations" as const,
      new: true,
      popular: true,
    },

    // Industry-Specific Agents
    {
      id: "inventory-optimization-agent",
      title: "AI Inventory Optimization with Sustainability Tracking",
      description: "Predict demand patterns, optimize inventory levels, and track sustainability metrics to reduce costs and minimize environmental impact",
      category: "industry-specific" as const,
      new: true,
      popular: true,
    },
    {
      id: "financial-ai-governance",
      title: "Financial AI Compliance & Ethics Framework",
      description: "Comprehensive AI governance system ensuring regulatory compliance, bias prevention, and ethical decision-making in financial services",
      category: "industry-specific" as const,
      popular: true,
      new: true,
    },

    // Content Creation
    {
      id: "cc-1",
      title: "Blog Writer",
      description: "Generate engaging blog posts on any topic with AI assistance",
      category: "content" as const,
      popular: true,
    },
    {
      id: "cc-3",
      title: "Conversational AI Assistant",
      description: "Create a versatile chatbot that can answer questions, provide recommendations, and assist users with various tasks using GPT-4o's advanced capabilities",
      category: "content" as const,
      popular: true,
    },
    {
      id: "cc-2",
      title: "Social Media Assistant",
      description: "Create platform-specific content for your social channels",
      category: "content" as const,
    },
  ];

  const filteredTemplates = templates.filter(
    (template) =>
      template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Handle template selection
  const handleTemplateSelect = (templateId: string) => {
    // Special handling for business analyzer (no auth required)
    if (templateId === "ba-1") {
      navigate("/business-analyzer");
      return;
    }

    // Check authentication for ALL other templates
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to use AI agent templates",
        variant: "destructive",
      });
      setIsLoginModalOpen(true);
      return;
    }
    
    // Special handling for chatbot demo (only after authentication)
    if (templateId === "chatbot-1") {
      navigate("/chatbot");
      return;
    }
    
    // Store template ID for the builder to load
    localStorage.setItem("selectedTemplate", templateId);
    navigate("/builder");
  };

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Sidebar - only show for logged-in users */}
      {user && (
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div
        className={`flex-1 ${user ? "ml-0 lg:ml-64" : "ml-0"} transition-all duration-300 overflow-y-auto`}
      >
        <div className="container max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              AI Agent Templates
            </h1>
            <p className="text-xl text-gray-600 max-w-5xl mx-auto whitespace-nowrap">Get started quickly with pre-built agent templates designed for various use cases and industries</p>
          </div>

          {/* Search Bar */}
          <div className="relative mb-8 max-w-md mx-auto">
            <Search className="absolute left-2.5 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search templates..."
              className="w-full rounded-full pl-8 bg-background border-muted-foreground/20"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Templates Tabs */}
          <Tabs defaultValue="all" className="mb-12">
            <div className="flex justify-center mb-8">
              <TabsList className="grid grid-cols-4 lg:grid-cols-9 w-full max-w-5xl">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="business-analysis">Business</TabsTrigger>
                <TabsTrigger value="customer-support">Support</TabsTrigger>
                <TabsTrigger value="sales-marketing">Sales</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
                <TabsTrigger value="operations">Operations</TabsTrigger>
                <TabsTrigger value="industry-specific">Industry</TabsTrigger>
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="data-processing">Data</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="all" className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTemplates.map((template) => (
                  <TemplateCard
                    key={template.id}
                    id={template.id}
                    title={template.title}
                    description={template.description}
                    category={template.category}
                    popular={template.popular}
                    new={template.new}
                    onClick={() => handleTemplateSelect(template.id)}
                  />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="business-analysis" className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTemplates
                  .filter((template) => template.category === "business-analysis")
                  .map((template) => (
                    <TemplateCard
                      key={template.id}
                      id={template.id}
                      title={template.title}
                      description={template.description}
                      category={template.category}
                      popular={template.popular}
                      new={template.new}
                      onClick={() => handleTemplateSelect(template.id)}
                    />
                  ))}
              </div>
            </TabsContent>

            <TabsContent value="content" className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTemplates
                  .filter((template) => template.category === "content")
                  .map((template) => (
                    <TemplateCard
                      key={template.id}
                      id={template.id}
                      title={template.title}
                      description={template.description}
                      category={template.category}
                      popular={template.popular}
                      new={template.new}
                      onClick={() => handleTemplateSelect(template.id)}
                    />
                  ))}
              </div>
            </TabsContent>

            <TabsContent value="customer-support" className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTemplates
                  .filter((template) => template.category === "customer-support")
                  .map((template) => (
                    <TemplateCard
                      key={template.id}
                      id={template.id}
                      title={template.title}
                      description={template.description}
                      category={template.category}
                      popular={template.popular}
                      new={template.new}
                      onClick={() => handleTemplateSelect(template.id)}
                    />
                  ))}
              </div>
            </TabsContent>

            <TabsContent value="data-processing" className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTemplates
                  .filter((template) => template.category === "data-processing")
                  .map((template) => (
                    <TemplateCard
                      key={template.id}
                      id={template.id}
                      title={template.title}
                      description={template.description}
                      category={template.category}
                      popular={template.popular}
                      new={template.new}
                      onClick={() => handleTemplateSelect(template.id)}
                    />
                  ))}
              </div>
            </TabsContent>

            <TabsContent value="sales-marketing" className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTemplates
                  .filter((template) => template.category === "sales-marketing")
                  .map((template) => (
                    <TemplateCard
                      key={template.id}
                      id={template.id}
                      title={template.title}
                      description={template.description}
                      category={template.category}
                      popular={template.popular}
                      new={template.new}
                      onClick={() => handleTemplateSelect(template.id)}
                    />
                  ))}
              </div>
            </TabsContent>

            <TabsContent value="analytics" className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTemplates
                  .filter((template) => template.category === "analytics")
                  .map((template) => (
                    <TemplateCard
                      key={template.id}
                      id={template.id}
                      title={template.title}
                      description={template.description}
                      category={template.category}
                      popular={template.popular}
                      new={template.new}
                      onClick={() => handleTemplateSelect(template.id)}
                    />
                  ))}
              </div>
            </TabsContent>

            <TabsContent value="operations" className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTemplates
                  .filter((template) => template.category === "operations")
                  .map((template) => (
                    <TemplateCard
                      key={template.id}
                      id={template.id}
                      title={template.title}
                      description={template.description}
                      category={template.category}
                      popular={template.popular}
                      new={template.new}
                      onClick={() => handleTemplateSelect(template.id)}
                    />
                  ))}
              </div>
            </TabsContent>

            <TabsContent value="industry-specific" className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTemplates
                  .filter((template) => template.category === "industry-specific")
                  .map((template) => (
                    <TemplateCard
                      key={template.id}
                      id={template.id}
                      title={template.title}
                      description={template.description}
                      category={template.category}
                      popular={template.popular}
                      new={template.new}
                      onClick={() => handleTemplateSelect(template.id)}
                    />
                  ))}
              </div>
            </TabsContent>
          </Tabs>

          {/* CTA Section */}
          <div className="bg-gradient-to-r from-brand-blue to-brand-green rounded-2xl p-8 md:p-12 mb-16 text-white">
            <div className="text-center">
              <h2 className="text-3xl font-bold mb-4">Ready to deploy your AI agent?</h2>
              <p className="text-lg text-white/90 mb-6 max-w-2xl mx-auto">
                Choose from our comprehensive library of pre-built AI agent templates and start automating your business processes today.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Button 
                  size="lg" 
                  className="bg-white text-brand-blue hover:bg-white/90 hover:text-brand-blue/90"
                  onClick={() => navigate("/business-analyzer")}
                >
                  Analyze Your Business
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  className="border-white text-white hover:bg-white/10"
                  onClick={() => navigate("/pricing")}
                >
                  View Pricing
                </Button>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>

      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSignupClick={() => {
          setIsLoginModalOpen(false);
          setIsSignupModalOpen(true);
        }}
      />

      {/* Signup Modal */}
      <SignupModal
        isOpen={isSignupModalOpen}
        onClose={() => setIsSignupModalOpen(false)}
        onLoginClick={() => {
          setIsSignupModalOpen(false);
          setIsLoginModalOpen(true);
        }}
      />
    </div>
  );
}
