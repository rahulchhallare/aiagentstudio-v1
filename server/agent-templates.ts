// Comprehensive AI Agent Templates for Missing Solutions
// This file contains all the missing AI agents identified by the analysis system

export interface AgentTemplate {
  id: string;
  name: string;
  description: string;
  solutionType: string;
  industry: string[];
  capabilities: string[];
  integrationRequirements: string[];
  pricingModel: string;
  flowData: any;
  estimatedCostSavings: number;
  estimatedTimeSavings: string;
  implementationDifficulty: 'easy' | 'medium' | 'hard';
  roiPercentage: number;
}

// Customer Support & Service Agents
export const customerSupportAgents: AgentTemplate[] = [
  {
    id: "customer-support-assistant",
    name: "AI-Powered Customer Support Assistant",
    description: "24/7 automated customer service with advanced sentiment analysis, order tracking, and human escalation",
    solutionType: "Customer Service Chatbot",
    industry: ["E-commerce", "SaaS", "Retail", "Healthcare"],
    capabilities: ["Order Tracking", "Returns Processing", "FAQ Handling", "Human Escalation", "Sentiment Analysis"],
    integrationRequirements: ["Website Integration", "CRM Connection", "Email System", "Live Chat Platform"],
    pricingModel: "Usage-based",
    estimatedCostSavings: 45000,
    estimatedTimeSavings: "25 hours/week",
    implementationDifficulty: "medium",
    roiPercentage: 285,
    flowData: {
      nodes: [
        {
          id: "input-1",
          type: "inputNode",
          position: { x: 100, y: 100 },
          data: { label: "Customer Query Input" }
        },
        {
          id: "sentiment-1",
          type: "gptNode",
          position: { x: 300, y: 100 },
          data: {
            label: "Sentiment Analysis",
            prompt: "Analyze the sentiment of this customer query and classify as: positive, neutral, negative, or urgent. Respond with JSON: {\"sentiment\": \"...\", \"urgency\": \"low|medium|high\", \"category\": \"...\"}"
          }
        },
        {
          id: "routing-1",
          type: "logicNode",
          position: { x: 500, y: 100 },
          data: {
            label: "Query Routing",
            condition: "sentiment.urgency === 'high'"
          }
        },
        {
          id: "auto-response-1",
          type: "gptNode",
          position: { x: 700, y: 50 },
          data: {
            label: "Automated Response",
            prompt: "Provide a helpful, empathetic response to this customer query. If it's about orders, ask for order number. If it's a return, guide them through the process. Be professional and solution-focused."
          }
        },
        {
          id: "escalation-1",
          type: "emailNode",
          position: { x: 700, y: 150 },
          data: {
            label: "Human Escalation",
            to: "support@company.com",
            subject: "Urgent Customer Issue - Escalation Required"
          }
        },
        {
          id: "output-1",
          type: "outputNode",
          position: { x: 900, y: 100 },
          data: { label: "Response Output" }
        }
      ],
      edges: [
        { id: "e1", source: "input-1", target: "sentiment-1" },
        { id: "e2", source: "sentiment-1", target: "routing-1" },
        { id: "e3", source: "routing-1", target: "auto-response-1", label: "Normal Priority" },
        { id: "e4", source: "routing-1", target: "escalation-1", label: "High Priority" },
        { id: "e5", source: "auto-response-1", target: "output-1" },
        { id: "e6", source: "escalation-1", target: "output-1" }
      ]
    }
  }
];

// Sales & Marketing Agents
export const salesMarketingAgents: AgentTemplate[] = [
  {
    id: "lead-generation-assistant",
    name: "AI Lead Generation & Qualification Assistant",
    description: "Automatically qualify leads, schedule appointments, and nurture prospects through personalized interactions",
    solutionType: "Sales Assistant",
    industry: ["B2B", "Real Estate", "Professional Services", "SaaS"],
    capabilities: ["Lead Scoring", "Appointment Scheduling", "Follow-up Automation", "CRM Integration"],
    integrationRequirements: ["CRM System", "Calendar Integration", "Email Platform", "Website Forms"],
    pricingModel: "Per-lead",
    estimatedCostSavings: 35000,
    estimatedTimeSavings: "20 hours/week",
    implementationDifficulty: "medium",
    roiPercentage: 320,
    flowData: {
      nodes: [
        {
          id: "input-1",
          type: "inputNode",
          position: { x: 100, y: 100 },
          data: { label: "Lead Information Input" }
        },
        {
          id: "qualification-1",
          type: "gptNode",
          position: { x: 300, y: 100 },
          data: {
            label: "Lead Qualification",
            prompt: "Analyze this lead information and score from 1-10 based on: budget indicators, decision-making authority, timeline urgency, and fit with our ideal customer profile. Respond with JSON: {\"score\": number, \"reasoning\": \"...\", \"next_action\": \"...\"}"
          }
        },
        {
          id: "routing-1",
          type: "logicNode",
          position: { x: 500, y: 100 },
          data: {
            label: "Score-based Routing",
            condition: "score >= 7"
          }
        },
        {
          id: "high-priority-1",
          type: "emailNode",
          position: { x: 700, y: 50 },
          data: {
            label: "Immediate Follow-up",
            template: "high-priority-lead"
          }
        },
        {
          id: "nurture-1",
          type: "emailNode",
          position: { x: 700, y: 150 },
          data: {
            label: "Nurture Sequence",
            template: "lead-nurture-sequence"
          }
        },
        {
          id: "output-1",
          type: "outputNode",
          position: { x: 900, y: 100 },
          data: { label: "Lead Processing Complete" }
        }
      ],
      edges: [
        { id: "e1", source: "input-1", target: "qualification-1" },
        { id: "e2", source: "qualification-1", target: "routing-1" },
        { id: "e3", source: "routing-1", target: "high-priority-1", label: "High Score" },
        { id: "e4", source: "routing-1", target: "nurture-1", label: "Lower Score" },
        { id: "e5", source: "high-priority-1", target: "output-1" },
        { id: "e6", source: "nurture-1", target: "output-1" }
      ]
    }
  },
  {
    id: "personalization-engine",
    name: "AI-Powered Personalization & Recommendation System",
    description: "Deliver personalized content, product recommendations, and user experiences to increase engagement and drive sales",
    solutionType: "Personalization Engine",
    industry: ["E-commerce", "Media", "SaaS", "Education"],
    capabilities: ["Product Recommendations", "Content Personalization", "User Behavior Analysis", "A/B Testing"],
    integrationRequirements: ["Website Integration", "Analytics Platform", "Product Catalog", "User Database"],
    pricingModel: "Revenue share",
    estimatedCostSavings: 28000,
    estimatedTimeSavings: "15 hours/week",
    implementationDifficulty: "hard",
    roiPercentage: 285,
    flowData: {
      nodes: [
        {
          id: "input-1",
          type: "inputNode",
          position: { x: 100, y: 100 },
          data: { label: "User Behavior Data" }
        },
        {
          id: "analysis-1",
          type: "gptNode",
          position: { x: 300, y: 100 },
          data: {
            label: "Behavior Analysis",
            prompt: "Analyze user behavior patterns and preferences. Identify key interests, purchase patterns, and engagement levels. Respond with JSON containing user segments and recommendation categories."
          }
        },
        {
          id: "recommendations-1",
          type: "gptNode",
          position: { x: 500, y: 100 },
          data: {
            label: "Generate Recommendations",
            prompt: "Based on user analysis, generate personalized product/content recommendations. Prioritize by relevance score and include reasoning for each recommendation."
          }
        },
        {
          id: "output-1",
          type: "outputNode",
          position: { x: 700, y: 100 },
          data: { label: "Personalized Recommendations" }
        }
      ],
      edges: [
        { id: "e1", source: "input-1", target: "analysis-1" },
        { id: "e2", source: "analysis-1", target: "recommendations-1" },
        { id: "e3", source: "recommendations-1", target: "output-1" }
      ]
    }
  }
];

// Analytics & Intelligence Agents
export const analyticsAgents: AgentTemplate[] = [
  {
    id: "sentiment-intelligence-platform",
    name: "AI-Driven Sentiment Intelligence Platform",
    description: "Transform customer feedback into actionable insights with real-time sentiment analysis and trend detection",
    solutionType: "Customer Feedback Analysis",
    industry: ["E-commerce", "Hospitality", "SaaS", "Healthcare"],
    capabilities: ["Sentiment Analysis", "Trend Detection", "Feedback Categorization", "Alert System"],
    integrationRequirements: ["Review Platforms", "Social Media APIs", "Survey Tools", "Analytics Dashboard"],
    pricingModel: "Subscription",
    estimatedCostSavings: 22000,
    estimatedTimeSavings: "12 hours/week",
    implementationDifficulty: "medium",
    roiPercentage: 245,
    flowData: {
      nodes: [
        {
          id: "input-1",
          type: "inputNode",
          position: { x: 100, y: 100 },
          data: { label: "Customer Feedback Input" }
        },
        {
          id: "sentiment-1",
          type: "gptNode",
          position: { x: 300, y: 100 },
          data: {
            label: "Sentiment Analysis",
            prompt: "Analyze sentiment, emotions, and key themes in this customer feedback. Rate sentiment 1-5, identify main concerns, and suggest action items. Respond with structured JSON."
          }
        },
        {
          id: "categorization-1",
          type: "gptNode",
          position: { x: 500, y: 100 },
          data: {
            label: "Issue Categorization",
            prompt: "Categorize feedback into: Product Quality, Customer Service, Pricing, Delivery, Website Experience, or Other. Include severity level and suggested department for follow-up."
          }
        },
        {
          id: "alert-1",
          type: "logicNode",
          position: { x: 700, y: 100 },
          data: {
            label: "Alert Trigger",
            condition: "sentiment <= 2 || severity === 'high'"
          }
        },
        {
          id: "notification-1",
          type: "notificationNode",
          position: { x: 900, y: 50 },
          data: {
            label: "Urgent Alert",
            message: "Critical customer feedback requires immediate attention"
          }
        },
        {
          id: "output-1",
          type: "outputNode",
          position: { x: 900, y: 150 },
          data: { label: "Processed Feedback" }
        }
      ],
      edges: [
        { id: "e1", source: "input-1", target: "sentiment-1" },
        { id: "e2", source: "sentiment-1", target: "categorization-1" },
        { id: "e3", source: "categorization-1", target: "alert-1" },
        { id: "e4", source: "alert-1", target: "notification-1", label: "Critical Issue" },
        { id: "e5", source: "alert-1", target: "output-1", label: "Normal Processing" },
        { id: "e6", source: "notification-1", target: "output-1" }
      ]
    }
  },
  {
    id: "business-intelligence-platform",
    name: "Business Intelligence & Forecasting Platform",
    description: "AI-powered predictive analytics to forecast sales trends, customer behavior, and market opportunities for proactive decision-making",
    solutionType: "Predictive Analytics",
    industry: ["Finance", "Retail", "Manufacturing", "SaaS"],
    capabilities: ["Sales Forecasting", "Risk Assessment", "Market Analysis", "Custom Reports"],
    integrationRequirements: ["Database Access", "API Integration", "Dashboard Setup", "Data Warehouse"],
    pricingModel: "Enterprise",
    estimatedCostSavings: 65000,
    estimatedTimeSavings: "30 hours/week",
    implementationDifficulty: "hard",
    roiPercentage: 340,
    flowData: {
      nodes: [
        {
          id: "input-1",
          type: "inputNode",
          position: { x: 100, y: 100 },
          data: { label: "Business Data Input" }
        },
        {
          id: "analysis-1",
          type: "gptNode",
          position: { x: 300, y: 100 },
          data: {
            label: "Data Analysis",
            prompt: "Analyze business metrics and identify patterns, trends, and anomalies. Focus on revenue patterns, customer behavior shifts, and market indicators. Provide insights with confidence levels."
          }
        },
        {
          id: "forecasting-1",
          type: "gptNode",
          position: { x: 500, y: 100 },
          data: {
            label: "Predictive Modeling",
            prompt: "Generate forecasts for next quarter based on historical data and current trends. Include scenario planning (optimistic, realistic, pessimistic) and key risk factors."
          }
        },
        {
          id: "recommendations-1",
          type: "gptNode",
          position: { x: 700, y: 100 },
          data: {
            label: "Strategic Recommendations",
            prompt: "Based on analysis and forecasts, provide actionable business recommendations. Prioritize by impact and feasibility. Include specific metrics to track."
          }
        },
        {
          id: "output-1",
          type: "outputNode",
          position: { x: 900, y: 100 },
          data: { label: "Business Intelligence Report" }
        }
      ],
      edges: [
        { id: "e1", source: "input-1", target: "analysis-1" },
        { id: "e2", source: "analysis-1", target: "forecasting-1" },
        { id: "e3", source: "forecasting-1", target: "recommendations-1" },
        { id: "e4", source: "recommendations-1", target: "output-1" }
      ]
    }
  }
];

// Operations & Automation Agents
export const operationsAgents: AgentTemplate[] = [
  {
    id: "llm-seo-optimizer",
    name: "LLM SEO Optimizer AI Agent",
    description: "Advanced AI-powered SEO optimization specifically for LLM and generative search engines like ChatGPT Search, Google AI Search, Perplexity, and Claude",
    solutionType: "LLM SEO Optimization",
    industry: ["All Industries"],
    capabilities: ["Content Optimization", "Schema Markup", "AI Readability Enhancement", "Semantic Structure", "Entity Recognition"],
    integrationRequirements: ["Website CMS", "Analytics Tools", "SEO Tools", "Content Management System"],
    pricingModel: "Subscription",
    estimatedCostSavings: 25000,
    estimatedTimeSavings: "15 hours/week",
    implementationDifficulty: "medium",
    roiPercentage: 320,
    flowData: {
      nodes: [
        {
          id: "input-1",
          type: "inputNode",
          position: { x: 100, y: 100 },
          data: { label: "Website Content Input" }
        },
        {
          id: "content-analysis-1",
          type: "gptNode",
          position: { x: 300, y: 100 },
          data: {
            label: "LLM SEO Content Analysis",
            prompt: "Analyze website content for LLM SEO optimization. Evaluate: 1) Content quality for AI understanding, 2) Structured data implementation, 3) Semantic clarity, 4) Entity recognition potential, 5) AI readability score. Provide detailed recommendations for each factor."
          }
        },
        {
          id: "optimization-1",
          type: "gptNode",
          position: { x: 500, y: 100 },
          data: {
            label: "Content Optimization",
            prompt: "Generate optimized content versions that perform better in AI search engines. Focus on: clear semantic structure, entity-rich content, FAQ sections, and structured data markup. Maintain readability while enhancing AI comprehension."
          }
        },
        {
          id: "schema-generation-1",
          type: "gptNode",
          position: { x: 700, y: 100 },
          data: {
            label: "Schema Markup Generation",
            prompt: "Generate appropriate schema markup (JSON-LD) for the content to enhance AI search engine understanding. Include Organization, Product, Service, FAQ, and other relevant schema types."
          }
        },
        {
          id: "performance-tracking-1",
          type: "gptNode",
          position: { x: 900, y: 100 },
          data: {
            label: "LLM SEO Performance Tracking",
            prompt: "Track and analyze performance metrics for LLM SEO including: AI search visibility, content citation rates, entity recognition accuracy, and semantic search performance. Provide improvement recommendations."
          }
        },
        {
          id: "output-1",
          type: "outputNode",
          position: { x: 1100, y: 100 },
          data: { label: "LLM SEO Optimization Report" }
        }
      ],
      edges: [
        { id: "e1", source: "input-1", target: "content-analysis-1" },
        { id: "e2", source: "content-analysis-1", target: "optimization-1" },
        { id: "e3", source: "optimization-1", target: "schema-generation-1" },
        { id: "e4", source: "schema-generation-1", target: "performance-tracking-1" },
        { id: "e5", source: "performance-tracking-1", target: "output-1" }
      ]
    }
  },
  {
    id: "ai-monitoring-dashboard",
    name: "Continuous AI Evaluation & Monitoring Dashboard",
    description: "Real-time monitoring of all AI solutions' performance, ROI tracking, bias detection, and continuous improvement recommendations",
    solutionType: "AI Performance Monitoring",
    industry: ["All Industries"],
    capabilities: ["Performance Monitoring", "Bias Detection", "ROI Tracking", "Automated Alerts"],
    integrationRequirements: ["AI Systems APIs", "Monitoring Tools", "Dashboard Platform", "Alert System"],
    pricingModel: "Subscription",
    estimatedCostSavings: 18000,
    estimatedTimeSavings: "8 hours/week",
    implementationDifficulty: "easy",
    roiPercentage: 190,
    flowData: {
      nodes: [
        {
          id: "input-1",
          type: "inputNode",
          position: { x: 100, y: 100 },
          data: { label: "AI System Metrics" }
        },
        {
          id: "performance-1",
          type: "gptNode",
          position: { x: 300, y: 100 },
          data: {
            label: "Performance Analysis",
            prompt: "Analyze AI system performance metrics including accuracy, response time, error rates, and user satisfaction. Identify trends and potential issues."
          }
        },
        {
          id: "bias-check-1",
          type: "gptNode",
          position: { x: 500, y: 100 },
          data: {
            label: "Bias Detection",
            prompt: "Check for potential bias in AI decisions across different demographic groups, use cases, and time periods. Flag any concerning patterns."
          }
        },
        {
          id: "recommendations-1",
          type: "gptNode",
          position: { x: 700, y: 100 },
          data: {
            label: "Improvement Recommendations",
            prompt: "Based on performance analysis and bias checks, provide specific recommendations for optimization, retraining needs, and system improvements."
          }
        },
        {
          id: "output-1",
          type: "outputNode",
          position: { x: 900, y: 100 },
          data: { label: "Monitoring Report" }
        }
      ],
      edges: [
        { id: "e1", source: "input-1", target: "performance-1" },
        { id: "e2", source: "performance-1", target: "bias-check-1" },
        { id: "e3", source: "bias-check-1", target: "recommendations-1" },
        { id: "e4", source: "recommendations-1", target: "output-1" }
      ]
    }
  }
];

// Industry-Specific Agents
export const industrySpecificAgents: AgentTemplate[] = [
  {
    id: "inventory-optimization-agent",
    name: "AI Inventory Optimization with Sustainability Tracking",
    description: "Predict demand patterns, optimize inventory levels, and track sustainability metrics to reduce costs, prevent stockouts, and minimize environmental impact",
    solutionType: "Inventory Management",
    industry: ["Retail", "E-commerce", "Manufacturing"],
    capabilities: ["Demand Forecasting", "Stock Optimization", "Sustainability Tracking", "Automated Reordering"],
    integrationRequirements: ["Inventory System", "Sales Data", "Supplier APIs", "Sustainability Metrics"],
    pricingModel: "Subscription",
    estimatedCostSavings: 35000,
    estimatedTimeSavings: "15 hours/week",
    implementationDifficulty: "medium",
    roiPercentage: 275,
    flowData: {
      nodes: [
        {
          id: "input-1",
          type: "inputNode",
          position: { x: 100, y: 100 },
          data: { label: "Sales & Inventory Data" }
        },
        {
          id: "demand-forecast-1",
          type: "gptNode",
          position: { x: 300, y: 100 },
          data: {
            label: "Demand Forecasting",
            prompt: "Analyze sales patterns, seasonality, and market trends to forecast demand for next 30-90 days. Consider external factors like holidays, promotions, and market conditions."
          }
        },
        {
          id: "optimization-1",
          type: "gptNode",
          position: { x: 500, y: 100 },
          data: {
            label: "Inventory Optimization",
            prompt: "Calculate optimal inventory levels based on demand forecast, lead times, and holding costs. Minimize stockouts while reducing excess inventory and waste."
          }
        },
        {
          id: "sustainability-1",
          type: "gptNode",
          position: { x: 700, y: 100 },
          data: {
            label: "Sustainability Impact",
            prompt: "Calculate environmental impact of inventory decisions including carbon footprint, waste reduction, and sustainable sourcing opportunities. Provide green alternatives."
          }
        },
        {
          id: "output-1",
          type: "outputNode",
          position: { x: 900, y: 100 },
          data: { label: "Optimization Recommendations" }
        }
      ],
      edges: [
        { id: "e1", source: "input-1", target: "demand-forecast-1" },
        { id: "e2", source: "demand-forecast-1", target: "optimization-1" },
        { id: "e3", source: "optimization-1", target: "sustainability-1" },
        { id: "e4", source: "sustainability-1", target: "output-1" }
      ]
    }
  },
  {
    id: "financial-ai-governance",
    name: "Financial AI Compliance & Ethics Framework",
    description: "Comprehensive AI governance system ensuring regulatory compliance, bias prevention, and ethical decision-making in financial services",
    solutionType: "Ethical AI Governance",
    industry: ["Financial Services", "Banking", "Insurance"],
    capabilities: ["Compliance Monitoring", "Bias Prevention", "Audit Trails", "Risk Assessment"],
    integrationRequirements: ["Core Banking Systems", "Compliance Tools", "Audit Systems", "Risk Management"],
    pricingModel: "Enterprise",
    estimatedCostSavings: 85000,
    estimatedTimeSavings: "40 hours/week",
    implementationDifficulty: "hard",
    roiPercentage: 380,
    flowData: {
      nodes: [
        {
          id: "input-1",
          type: "inputNode",
          position: { x: 100, y: 100 },
          data: { label: "AI Decision Data" }
        },
        {
          id: "compliance-1",
          type: "gptNode",
          position: { x: 300, y: 100 },
          data: {
            label: "Compliance Check",
            prompt: "Verify AI decision compliance with financial regulations (SOX, GDPR, CCPA, Basel III). Check for regulatory violations and document compliance status."
          }
        },
        {
          id: "bias-audit-1",
          type: "gptNode",
          position: { x: 500, y: 100 },
          data: {
            label: "Bias Audit",
            prompt: "Audit AI decisions for bias across protected categories (race, gender, age, etc.). Ensure fair lending practices and equal treatment. Flag any discriminatory patterns."
          }
        },
        {
          id: "documentation-1",
          type: "gptNode",
          position: { x: 700, y: 100 },
          data: {
            label: "Audit Trail",
            prompt: "Generate comprehensive audit documentation including decision rationale, data sources, compliance verification, and bias check results for regulatory review."
          }
        },
        {
          id: "output-1",
          type: "outputNode",
          position: { x: 900, y: 100 },
          data: { label: "Governance Report" }
        }
      ],
      edges: [
        { id: "e1", source: "input-1", target: "compliance-1" },
        { id: "e2", source: "compliance-1", target: "bias-audit-1" },
        { id: "e3", source: "bias-audit-1", target: "documentation-1" },
        { id: "e4", source: "documentation-1", target: "output-1" }
      ]
    }
  }
];

// Compile all agent templates
export const allAgentTemplates: AgentTemplate[] = [
  ...customerSupportAgents,
  ...salesMarketingAgents,
  ...analyticsAgents,
  ...operationsAgents,
  ...industrySpecificAgents
];

// Helper function to get template by ID
export function getAgentTemplateById(id: string): AgentTemplate | undefined {
  return allAgentTemplates.find(template => template.id === id);
}

// Helper function to get templates by solution type
export function getAgentTemplatesBySolutionType(solutionType: string): AgentTemplate[] {
  return allAgentTemplates.filter(template => 
    template.solutionType.toLowerCase().includes(solutionType.toLowerCase())
  );
}

// Helper function to get templates by industry
export function getAgentTemplatesByIndustry(industry: string): AgentTemplate[] {
  return allAgentTemplates.filter(template => 
    template.industry.some(ind => ind.toLowerCase().includes(industry.toLowerCase()))
  );
}