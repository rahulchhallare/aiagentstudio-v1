import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import Sidebar from "@/components/dashboard/Sidebar";
import { Button } from "@/components/ui/button";
import {
  Bot,
  FileText,
  Zap,
  Database,
  MessageSquare,
  Brain,
} from "lucide-react";
import Footer from "@/components/Footer";

export default function Templates() {
  const [, navigate] = useLocation();
  const { user, isLoading: authLoading } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // No redirect needed - allow non-authenticated users to view templates

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Template categories with all AI agents from homepage
  const templateCategories = [
    {
      name: "Business Analysis",
      templates: [
        {
          id: "ba-1",
          name: "Business Analyzer",
          description: "Analyze any business website to discover optimal AI solutions with ROI estimates",
          icon: <Bot className="h-12 w-12 text-brand-blue" />,
        },
      ],
    },
    {
      name: "Operations",
      templates: [
        {
          id: "llm-seo-optimizer",
          name: "LLM SEO Optimizer AI Agent",
          description: "Advanced AI-powered SEO optimization specifically for LLM and generative search engines like ChatGPT Search, Google AI Search, Perplexity, and Claude",
          icon: <Zap className="h-12 w-12 text-brand-green" />,
        },
        {
          id: "ai-monitoring-dashboard",
          name: "Continuous AI Evaluation & Monitoring Dashboard",
          description: "Real-time monitoring of all AI solutions' performance, ROI tracking, bias detection, and continuous improvement recommendations",
          icon: <Bot className="h-12 w-12 text-brand-blue" />,
        },
      ],
    },
    {
      name: "Customer Support",
      templates: [
        {
          id: "customer-support-assistant",
          name: "AI-Powered Customer Support Assistant",
          description: "24/7 automated customer service with advanced sentiment analysis, order tracking, and human escalation",
          icon: <MessageSquare className="h-12 w-12 text-brand-blue" />,
        },
        {
          id: "cs-1",
          name: "FAQ Responder",
          description: "Answer customer questions using your knowledge base",
          icon: <MessageSquare className="h-12 w-12 text-brand-green" />,
        },
        {
          id: "tc-1",
          name: "Ticket Classifier",
          description: "Automatically categorize support tickets by priority and type",
          icon: <Bot className="h-12 w-12 text-brand-blue" />,
        },
        {
          id: "chatbot-1",
          name: "E-commerce Customer Service Bot",
          description: "24/7 AI-powered customer support with order tracking, returns, and human escalation",
          icon: <MessageSquare className="h-12 w-12 text-brand-green" />,
        },
      ],
    },
    {
      name: "Sales & Marketing",
      templates: [
        {
          id: "lead-generation-assistant",
          name: "AI Lead Generation & Qualification Assistant",
          description: "Automatically qualify leads, schedule appointments, and nurture prospects through personalized interactions",
          icon: <Zap className="h-12 w-12 text-brand-blue" />,
        },
        {
          id: "personalization-engine",
          name: "AI-Powered Personalization & Recommendation System",
          description: "Deliver personalized content, product recommendations, and user experiences to increase engagement and drive sales",
          icon: <Bot className="h-12 w-12 text-brand-green" />,
        },
      ],
    },
    {
      name: "Analytics & Intelligence",
      templates: [
        {
          id: "sentiment-intelligence-platform",
          name: "AI-Driven Sentiment Intelligence Platform",
          description: "Transform customer feedback into actionable insights with real-time sentiment analysis and trend detection",
          icon: <Brain className="h-12 w-12 text-brand-blue" />,
        },
        {
          id: "business-intelligence-platform",
          name: "Business Intelligence & Forecasting Platform",
          description: "AI-powered predictive analytics to forecast sales trends, customer behavior, and market opportunities",
          icon: <Brain className="h-12 w-12 text-brand-green" />,
        },
      ],
    },
    {
      name: "Data Processing",
      templates: [
        {
          id: "dp-1",
          name: "Data Summarizer",
          description: "Extract key insights from complex data and documents",
          icon: <Database className="h-12 w-12 text-brand-blue" />,
        },
        {
          id: "dp-2",
          name: "Research Assistant",
          description: "Compile research findings and generate reports",
          icon: <Brain className="h-12 w-12 text-brand-green" />,
        },
      ],
    },
    {
      name: "Industry Specific",
      templates: [
        {
          id: "inventory-optimization-agent",
          name: "AI Inventory Optimization with Sustainability Tracking",
          description: "Predict demand patterns, optimize inventory levels, and track sustainability metrics to reduce costs and minimize environmental impact",
          icon: <Database className="h-12 w-12 text-brand-blue" />,
        },
        {
          id: "financial-ai-governance",
          name: "Financial AI Compliance & Ethics Framework",
          description: "Comprehensive AI governance system ensuring regulatory compliance, bias prevention, and ethical decision-making in financial services",
          icon: <Bot className="h-12 w-12 text-brand-green" />,
        },
      ],
    },
    {
      name: "Content Creation",
      templates: [
        {
          id: "cc-1",
          name: "Blog Writer",
          description: "Generate engaging blog posts on any topic with AI assistance",
          icon: <FileText className="h-12 w-12 text-brand-blue" />,
        },
        {
          id: "cc-3",
          name: "Conversational AI Assistant",
          description: "Create a versatile chatbot that can answer questions, provide recommendations, and assist users with various tasks using GPT-4o's advanced capabilities",
          icon: <MessageSquare className="h-12 w-12 text-brand-green" />,
        },
        {
          id: "cc-2",
          name: "Social Media Assistant",
          description: "Create platform-specific content for your social channels",
          icon: <Zap className="h-12 w-12 text-brand-blue" />,
        },
      ],
    },
  ];

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
        <div className="w-full px-6 py-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-12 text-center">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Agent Templates
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Get started quickly with pre-built agent templates designed for various use cases
              </p>
            </div>

            <div className="space-y-16">
              {templateCategories.map((category, index) => (
                <div key={index}>
                  <div className="mb-8">
                    <h2 className="text-3xl font-semibold text-gray-900 mb-3">
                      {category.name}
                    </h2>
                    <div className="w-24 h-1 bg-gradient-to-r from-brand-blue to-brand-green rounded"></div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {category.templates.map((template) => (
                      <div
                        key={template.id}
                        className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 hover:shadow-lg hover:border-primary-200 transition-all duration-300 group flex flex-col h-full"
                      >
                        <div className="mb-6 group-hover:scale-110 transition-transform duration-300">{template.icon}</div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-3">
                          {template.name}
                        </h3>
                        <p className="text-gray-600 mb-6 leading-relaxed flex-grow">
                          {template.description}
                        </p>
                        <Button
                          className="w-full py-3 text-base font-medium mt-auto"
                          onClick={() => {
                            // Special handling for business analyzer
                            if (template.id === "ba-1") {
                              navigate("/business-analyzer");
                              return;
                            }
                            
                            // Special handling for chatbot demo
                            if (template.id === "chatbot-1") {
                              navigate("/chatbot");
                              return;
                            }
                            
                            if (!user) {
                              // Redirect to home page with login prompt for non-logged-in users
                              navigate("/");
                              return;
                            }
                            // Store template ID for the builder to load
                            localStorage.setItem("selectedTemplate", template.id);
                            navigate("/builder");
                          }}
                        >
                          {user ? "Use Template" : "Sign up to use"}
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <Footer />
      </div>
    </div>
  );
}
