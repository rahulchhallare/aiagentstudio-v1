import type { WebsiteAnalysisResult } from "./website-analyzer";

interface FastRecommendation {
  solutionType: string;
  solutionName: string;
  description: string;
  estimatedCostSavings: number;
  estimatedTimeSavings: string;
  implementationDifficulty: 'easy' | 'medium' | 'hard';
  roiPercentage: number;
  industryBenchmark: string;
  priorityScore: number;
  templateId: string;
  reasoning: string;
  availabilityStatus: 'Available' | 'Missing';
}

export class FastRecommendationEngine {
  /**
   * Generate fast recommendations based on business type and industry
   * Provides immediate results without AI processing delays
   */
  generateFastRecommendations(analysis: WebsiteAnalysisResult): FastRecommendation[] {
    const businessType = analysis.businessType.toLowerCase();
    const industry = analysis.industry.toLowerCase();
    
    // Smart recommendation selection based on business type
    const recommendations: FastRecommendation[] = [];
    
    // Universal recommendations for all businesses
    recommendations.push({
      solutionType: "Customer Support Chatbot",
      solutionName: `${analysis.businessName} AI Assistant`,
      description: `Automated customer support system that handles common inquiries, reduces response time, and provides 24/7 availability for ${analysis.businessName}.`,
      estimatedCostSavings: 45000,
      estimatedTimeSavings: "30 hours/week",
      implementationDifficulty: "easy",
      roiPercentage: 320,
      industryBenchmark: "Industry average: 280% ROI",
      priorityScore: 9,
      templateId: "customer-support-assistant",
      reasoning: "Every business needs efficient customer support. This solution directly addresses customer service workflows.",
      availabilityStatus: "Available"
    });

    // Business-type specific recommendations based on actual business analysis
    if (businessType.includes('Construction') || businessType.includes('Engineering') || businessType.includes('construction')) {
      recommendations.push(
        {
          solutionType: "Project Management Agent",
          solutionName: "Construction Project Optimizer",
          description: "Automated project tracking, resource allocation, timeline management, and client communication for construction projects.",
          estimatedCostSavings: 95000,
          estimatedTimeSavings: "35 hours/week", 
          implementationDifficulty: "medium",
          roiPercentage: 420,
          industryBenchmark: "Construction average: 380% ROI",
          priorityScore: 10,
          templateId: "construction-project-agent",
          reasoning: "Construction businesses benefit significantly from automated project management and client communication.",
          availabilityStatus: "Available"
        },
        {
          solutionType: "Resource Management Agent", 
          solutionName: "Construction Resource Optimizer",
          description: "AI-powered resource allocation, equipment tracking, material ordering, and workforce scheduling optimization.",
          estimatedCostSavings: 72000,
          estimatedTimeSavings: "28 hours/week",
          implementationDifficulty: "medium", 
          roiPercentage: 390,
          industryBenchmark: "Engineering average: 350% ROI",
          priorityScore: 9,
          templateId: "resource-management-agent",
          reasoning: "Efficient resource management is critical for construction project profitability and timelines.",
          availabilityStatus: "Available"
        }
      );
    } else if (businessType.includes('ecommerce') || businessType.includes('store') || businessType.includes('retail')) {
      recommendations.push(
        {
          solutionType: "Sales Automation Agent",
          solutionName: "E-commerce Sales Optimizer",
          description: "Automated sales funnel that handles lead qualification, abandoned cart recovery, and personalized product recommendations.",
          estimatedCostSavings: 78000,
          estimatedTimeSavings: "25 hours/week",
          implementationDifficulty: "medium",
          roiPercentage: 450,
          industryBenchmark: "E-commerce average: 380% ROI",
          priorityScore: 10,
          templateId: "sales-automation-agent",
          reasoning: "E-commerce businesses benefit significantly from automated sales processes and cart recovery.",
          availabilityStatus: "Available"
        },
        {
          solutionType: "Inventory Management Agent",
          solutionName: "Smart Inventory Optimizer",
          description: "AI-powered inventory management with demand forecasting, automatic reorder alerts, and stock optimization.",
          estimatedCostSavings: 65000,
          estimatedTimeSavings: "20 hours/week",
          implementationDifficulty: "medium",
          roiPercentage: 380,
          industryBenchmark: "Retail average: 340% ROI",
          priorityScore: 8,
          templateId: "inventory-management-agent",
          reasoning: "Inventory optimization is critical for e-commerce profitability and customer satisfaction.",
          availabilityStatus: "Available"
        }
      );
    }

    if (businessType.includes('restaurant') || businessType.includes('food')) {
      recommendations.push(
        {
          solutionType: "Order Management Agent",
          solutionName: "Restaurant Order Optimizer",
          description: "Automated order processing, table management, and customer preference tracking for enhanced dining experience.",
          estimatedCostSavings: 55000,
          estimatedTimeSavings: "35 hours/week",
          implementationDifficulty: "easy",
          roiPercentage: 410,
          industryBenchmark: "Food service average: 350% ROI",
          priorityScore: 9,
          templateId: "restaurant-order-agent",
          reasoning: "Restaurants need efficient order management and customer service automation.",
          availabilityStatus: "Available"
        }
      );
    }

    if (businessType.includes('software') || businessType.includes('saas') || businessType.includes('platform')) {
      recommendations.push(
        {
          solutionType: "User Onboarding Agent",
          solutionName: "SaaS Onboarding Automation",
          description: "Streamlined user onboarding process with personalized tutorials, feature guidance, and success tracking.",
          estimatedCostSavings: 85000,
          estimatedTimeSavings: "40 hours/week",
          implementationDifficulty: "medium",
          roiPercentage: 520,
          industryBenchmark: "SaaS average: 450% ROI",
          priorityScore: 10,
          templateId: "user-onboarding-agent",
          reasoning: "SaaS companies see massive improvements in user retention with automated onboarding.",
          availabilityStatus: "Available"
        },
        {
          solutionType: "Technical Support Agent",
          solutionName: "Developer Support Assistant",
          description: "AI-powered technical support that handles API questions, troubleshooting, and documentation guidance.",
          estimatedCostSavings: 72000,
          estimatedTimeSavings: "45 hours/week",
          implementationDifficulty: "hard",
          roiPercentage: 480,
          industryBenchmark: "Tech average: 420% ROI",
          priorityScore: 8,
          templateId: "technical-support-agent",
          reasoning: "Technical products require specialized support that AI can handle efficiently.",
          availabilityStatus: "Available"
        }
      );
    }

    if (businessType.includes('consulting') || businessType.includes('agency') || businessType.includes('professional')) {
      recommendations.push(
        {
          solutionType: "Lead Qualification Agent",
          solutionName: "Professional Services Lead Qualifier",
          description: "Automated lead scoring, qualification, and initial consultation scheduling for professional services.",
          estimatedCostSavings: 68000,
          estimatedTimeSavings: "28 hours/week",
          implementationDifficulty: "easy",
          roiPercentage: 440,
          industryBenchmark: "Professional services average: 380% ROI",
          priorityScore: 9,
          templateId: "lead-qualification-agent",
          reasoning: "Professional services benefit from automated lead qualification and client communication.",
          availabilityStatus: "Available"
        }
      );
    }

    // Add data analysis agent for all business types
    recommendations.push({
      solutionType: "Data Analysis Agent",
      solutionName: "Business Intelligence Analyzer",
      description: "Automated report generation, trend analysis, and performance insights tailored for your business metrics.",
      estimatedCostSavings: 58000,
      estimatedTimeSavings: "22 hours/week",
      implementationDifficulty: "medium",
      roiPercentage: 350,
      industryBenchmark: "Cross-industry average: 310% ROI",
      priorityScore: 7,
      templateId: "data-analysis-agent",
      reasoning: "Data-driven insights are valuable for all businesses to optimize operations and growth.",
      availabilityStatus: "Available"
    });

    // Email marketing for businesses with customer bases
    if (!businessType.includes('b2b software')) {
      recommendations.push({
        solutionType: "Email Marketing Agent",
        solutionName: "Personalized Email Automation",
        description: "AI-driven email campaigns with personalization, segmentation, and automated follow-up sequences.",
        estimatedCostSavings: 42000,
        estimatedTimeSavings: "18 hours/week",
        implementationDifficulty: "easy",
        roiPercentage: 380,
        industryBenchmark: "Marketing average: 320% ROI",
        priorityScore: 8,
        templateId: "email-marketing-agent",
        reasoning: "Email marketing automation provides consistent customer engagement and revenue growth.",
        availabilityStatus: "Available"
      });
    }

    // Sort by priority score and return top 5
    return recommendations
      .sort((a, b) => b.priorityScore - a.priorityScore)
      .slice(0, 5);
  }
}

export const fastRecommendationEngine = new FastRecommendationEngine();