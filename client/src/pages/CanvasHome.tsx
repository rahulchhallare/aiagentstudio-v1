import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Rocket,
  Star,
  Zap,
  ArrowRight,
  Search,
  Users,
  TrendingUp,
  Copy,
  Layout,
  Share,
  Target,
  BarChart,
  Cog,
  Building,
} from "lucide-react";
import CanvasHeader from "@/components/CanvasHeader";
import LoginModal from "@/components/LoginModal";
import SignupModal from "@/components/SignupModal";
import VideoModal from "@/components/VideoModal";
import SubscriptionForm from "@/components/SubscriptionForm";
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
    "business-analysis": "bg-gradient-to-r from-purple-600 to-blue-600",
    "sales-marketing": "bg-gradient-to-r from-emerald-600 to-teal-600",
    "analytics": "bg-gradient-to-r from-orange-600 to-red-600",
    "operations": "bg-gradient-to-r from-indigo-600 to-purple-600",
    "industry-specific": "bg-gradient-to-r from-amber-600 to-orange-600",
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
      {popular && (
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

// Featured template with image
interface FeaturedTemplateProps {
  title: string;
  description: string;
  onClick: () => void;
}

const FeaturedTemplate = ({
  title,
  description,
  onClick,
}: FeaturedTemplateProps) => {
  return (
    <div className="bg-gradient-to-r from-brand-blue to-brand-green rounded-xl overflow-hidden text-white">
      <div className="p-8 md:p-12">
        <Badge
          variant="outline"
          className="bg-white/20 text-white border-white/30 mb-4"
        >
          Featured Template
        </Badge>
        <h2 className="text-2xl md:text-3xl font-bold mb-4">{title}</h2>
        <p className="text-white/80 mb-8 max-w-lg">{description}</p>
        <Button
          onClick={onClick}
          className="bg-white text-brand-blue hover:bg-white/90 hover:text-primary-700"
        >
          Use This Template
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default function CanvasHome() {
  const [, navigate] = useLocation();
  const { user, isLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  // Define template interfaces
  interface Template {
    id: string;
    title: string;
    description: string;
    category: "content" | "customer-support" | "data-processing" | "business-analysis" | "sales-marketing" | "analytics" | "operations" | "industry-specific";
    popular?: boolean;
    new?: boolean;
  }

  const templates: Template[] = [
    // Business Analysis
    {
      id: "ba-1",
      title: "Business Analyzer",
      description: "Analyze any business website to discover optimal AI solutions with ROI estimates",
      category: "business-analysis",
      popular: true,
      new: true,
    },
    
    // LLM SEO Optimizer - positioned prominently after Business Analyzer
    {
      id: "llm-seo-optimizer",
      title: "LLM SEO Optimizer AI Agent",
      description: "Advanced AI-powered SEO optimization specifically for LLM and generative search engines like ChatGPT Search, Google AI Search, Perplexity, and Claude",
      category: "operations",
      new: true,
      popular: true,
    },
    
    // Customer Support & Service Agents
    {
      id: "customer-support-assistant",
      title: "AI-Powered Customer Support Assistant",
      description: "24/7 automated customer service with advanced sentiment analysis, order tracking, and human escalation",
      category: "customer-support",
      popular: true,
      new: true,
    },
    {
      id: "cs-1",
      title: "FAQ Responder",
      description: "Answer customer questions using your knowledge base",
      category: "customer-support",
      popular: true,
    },
    {
      id: "tc-1",
      title: "Ticket Classifier",
      description: "Automatically categorize support tickets by priority and type",
      category: "customer-support",
      new: true,
    },
    {
      id: "chatbot-1",
      title: "E-commerce Customer Service Bot",
      description: "24/7 AI-powered customer support with order tracking, returns, and human escalation",
      category: "customer-support",
      popular: true,
    },

    // Sales & Marketing Agents
    {
      id: "lead-generation-assistant",
      title: "AI Lead Generation & Qualification Assistant",
      description: "Automatically qualify leads, schedule appointments, and nurture prospects through personalized interactions",
      category: "sales-marketing",
      new: true,
      popular: true,
    },
    {
      id: "personalization-engine",
      title: "AI-Powered Personalization & Recommendation System",
      description: "Deliver personalized content, product recommendations, and user experiences to increase engagement and drive sales",
      category: "sales-marketing",
      popular: true,
      new: true,
    },

    // Analytics & Intelligence Agents
    {
      id: "sentiment-intelligence-platform",
      title: "AI-Driven Sentiment Intelligence Platform",
      description: "Transform customer feedback into actionable insights with real-time sentiment analysis and trend detection",
      category: "analytics",
      new: true,
      popular: true,
    },
    {
      id: "business-intelligence-platform",
      title: "Business Intelligence & Forecasting Platform",
      description: "AI-powered predictive analytics to forecast sales trends, customer behavior, and market opportunities",
      category: "analytics",
      popular: true,
      new: true,
    },
    {
      id: "dp-1",
      title: "Data Summarizer",
      description: "Extract key insights from complex data and documents",
      category: "data-processing",
    },
    {
      id: "dp-2",
      title: "Research Assistant",
      description: "Compile research findings and generate reports",
      category: "data-processing",
      new: true,
    },

    // Operations & Automation Agents
    {
      id: "ai-monitoring-dashboard",
      title: "Continuous AI Evaluation & Monitoring Dashboard",
      description: "Real-time monitoring of all AI solutions' performance, ROI tracking, bias detection, and continuous improvement recommendations",
      category: "operations",
      new: true,
      popular: true,
    },

    // Industry-Specific Agents
    {
      id: "inventory-optimization-agent",
      title: "AI Inventory Optimization with Sustainability Tracking",
      description: "Predict demand patterns, optimize inventory levels, and track sustainability metrics to reduce costs and minimize environmental impact",
      category: "industry-specific",
      new: true,
      popular: true,
    },
    {
      id: "financial-ai-governance",
      title: "Financial AI Compliance & Ethics Framework",
      description: "Comprehensive AI governance system ensuring regulatory compliance, bias prevention, and ethical decision-making in financial services",
      category: "industry-specific",
      popular: true,
      new: true,
    },

    // Content Creation
    {
      id: "cc-1",
      title: "Blog Writer",
      description: "Generate engaging blog posts on any topic with AI assistance",
      category: "content",
      popular: true,
    },
    {
      id: "cc-3",
      title: "Conversational AI Assistant",
      description: "Create a versatile chatbot that can answer questions, provide recommendations, and assist users with various tasks using GPT-4o's advanced capabilities",
      category: "content",
      popular: true,
    },
    {
      id: "cc-2",
      title: "Social Media Assistant",
      description: "Create platform-specific content for your social channels",
      category: "content",
    },
  ];

  const filteredTemplates = templates.filter(
    (template) =>
      template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Handle template selection
  const handleTemplateSelect = (templateId: string) => {
    // Special handling for business analyzer
    if (templateId === "ba-1") {
      navigate("/business-analyzer");
      return;
    }
    
    // Special handling for chatbot demo
    if (templateId === "chatbot-1") {
      navigate("/chatbot");
      return;
    }
    
    // Store template ID for after login/signup
    localStorage.setItem("selectedTemplate", templateId);

    // With Canva-like experience, we directly navigate to builder
    // Authentication will be handled there when saving/deploying
    navigate(`/builder`);
  };

  // Handle create blank agent
  const handleCreateBlank = () => {
    // Clear any existing template selections
    localStorage.removeItem("selectedTemplate");

    // Simple flag to indicate we want a blank starting agent
    // The actual node setup will be done in the AgentBuilder component

    // Store flag in localStorage to indicate blank template
    localStorage.setItem("blankTemplate", "true");

    // Navigate to builder page with all node types
    navigate("/builder");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/80">
      {/* Login/Signup Modals */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSignupClick={() => {
          setIsLoginModalOpen(false);
          setIsSignupModalOpen(true);
        }}
      />
      <SignupModal
        isOpen={isSignupModalOpen}
        onClose={() => setIsSignupModalOpen(false)}
        onLoginClick={() => {
          setIsSignupModalOpen(false);
          setIsLoginModalOpen(true);
        }}
      />

      {/* Video Modal */}
      <VideoModal
        isOpen={isVideoModalOpen}
        onClose={() => setIsVideoModalOpen(false)}
        videoUrl="https://www.youtube-nocookie.com/embed/9M-Wna8mGHQ"
        title="AIagentStudio Demo"
      />

      {/* Hero Section */}
      <div className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-b from-primary-50 to-white dark:from-slate-950/50 dark:to-background">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col items-center space-y-4 text-center">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl bg-clip-text text-transparent bg-gradient-to-r from-brand-blue to-brand-green mb-10 pb-4">
                Create Powerful AI Agents
              </h1>
              <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
                Build, deploy, and share custom AI agents in minutes — no coding
                required.
              </p>
            </div>
            <div className="space-x-4">
              <Button
                className="bg-gradient-to-r from-brand-blue to-brand-green hover:from-primary-700 hover:to-secondary-700"
                size="lg"
                onClick={handleCreateBlank}
              >
                Create New Agent
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => setIsVideoModalOpen(true)}
              >
                Watch Demo
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 md:px-6 py-12">
        {/* Quick Deploy Section */}
        <div className="mb-12 text-center">
          <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center space-y-4">
                <div className="flex items-center space-x-2">
                  <Rocket className="w-6 h-6 text-purple-600" />
                  <h3 className="text-xl font-bold text-purple-800">Comprehensive AI Agent Library</h3>
                </div>
                <p className="text-gray-600 max-w-2xl">
                  Deploy our complete collection of 8+ enterprise-ready AI agents including Customer Support, 
                  Lead Generation, Personalization Engine, and Business Intelligence solutions.
                </p>
                <div className="flex space-x-4">
                  <Button
                    onClick={() => navigate("/agent-library-manager")}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                    size="lg"
                  >
                    <Rocket className="w-4 h-4 mr-2" />
                    Deploy All AI Agents
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => navigate("/agent-library-manager")}
                    size="lg"
                  >
                    View Agent Library
                  </Button>
                </div>
                <div className="text-sm text-gray-500">
                  <span className="font-medium">$400,000+</span> in annual cost savings potential
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Featured Template */}
        <div className="mb-12">
          <FeaturedTemplate
            title="AI Business Analyzer"
            description="Analyze any business website to identify AI opportunities, get customized solution recommendations with ROI estimates, and discover optimal AI automation strategies."
            onClick={() => handleTemplateSelect("ba-1")}
          />
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

        {/* Templates Section */}
        <Tabs defaultValue="all" className="mb-12">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold">AI Agent Templates</h2>
            <TabsList className="grid grid-cols-4 lg:grid-cols-8 w-full">
              <TabsTrigger value="all">All</TabsTrigger>
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

        {/* Features */}
        <div className="py-12">
          <h2 className="text-2xl font-bold text-center mb-8">
            Why Choose AIagentStudio
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="border-none shadow-md">
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center space-y-2">
                  <div className="p-3 rounded-full bg-primary/10 text-primary">
                    <Rocket className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-semibold">No-Code Building</h3>
                  <p className="text-muted-foreground">
                    Create sophisticated AI agents without writing a single line
                    of code using our visual editor.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-md">
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center space-y-2">
                  <div className="p-3 rounded-full bg-primary/10 text-primary">
                    <Share className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-semibold">
                    One-Click Deployment
                  </h3>
                  <p className="text-muted-foreground">
                    Deploy your agents instantly and share them anywhere with a
                    single, shareable link.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-md">
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center space-y-2">
                  <div className="p-3 rounded-full bg-primary/10 text-primary">
                    <TrendingUp className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-semibold">Advanced Analytics</h3>
                  <p className="text-muted-foreground">
                    Gain insights into how your agents are performing and how
                    users are interacting with them.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA */}
        <div className="py-12 text-center">
          <h2 className="text-2xl font-bold mb-4">
            Ready to Build Your First AI Agent?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
            Start with a template or create your own from scratch in minutes.
          </p>
          <Button
            className="bg-gradient-to-r from-brand-blue to-brand-green hover:from-primary-700 hover:to-secondary-700"
            size="lg"
            onClick={handleCreateBlank}
          >
            Get Started Now
          </Button>
        </div>

        {/* Newsletter/Subscription Section */}
        <div className="py-16 bg-gradient-to-r from-brand-blue to-brand-green text-white rounded-2xl mx-4 mb-12 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%239C92AC%22%20fill-opacity%3D%220.1%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%224%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>

          <div className="container mx-auto px-6 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              {/* Badge */}
              <div className="inline-flex items-center bg-white/20 backdrop-blur-sm rounded-full px-6 py-2 mb-8">
                <svg
                  className="w-5 h-5 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-white font-medium">
                  Join 10,000+ AI Enthusiasts
                </span>
              </div>

              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Join the AI Revolution
              </h2>
              <p className="text-xl md:text-2xl text-white/90 mb-12 max-w-3xl mx-auto leading-relaxed">
                Get exclusive access to new templates, features, and AI insights
                delivered to your inbox.
              </p>

              {/* Enhanced Subscription Form */}
              <SubscriptionForm />

              <p className="text-white/80 mt-6 text-sm">
                ✨ Free forever • 🚀 No spam • 📧 Unsubscribe anytime
              </p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
      
      {/* Customer Service Chatbot */}
      <div className="fixed bottom-4 right-4 z-50">
        <div className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg cursor-pointer transition-colors" onClick={() => window.open('/chatbot', '_blank')}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.279 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.279-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
      </div>
    </div>
  );
}
