import OpenAI from "openai";
import type { WebsiteAnalysisResult } from "./website-analyzer";
import type { IndustryBenchmark, AiSolutionTemplate } from "../shared/schema";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface RecommendationResult {
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
  customizationData: any;
  reasoning: string;
}

export class RecommendationEngine {
  private aiSolutionTemplates: AiSolutionTemplate[] = [];
  private industryBenchmarks: IndustryBenchmark[] = [];

  constructor() {
    this.initializeTemplates();
    this.initializeBenchmarks();
  }

  async generateRecommendations(analysis: WebsiteAnalysisResult): Promise<RecommendationResult[]> {
    try {
      // Get AI-powered recommendations
      const aiRecommendations = await this.getAIRecommendations(analysis);
      
      // Enrich with benchmarks and templates
      const enrichedRecommendations = aiRecommendations.map(rec => 
        this.enrichRecommendation(rec, analysis)
      );

      // Sort by priority score
      return enrichedRecommendations.sort((a, b) => b.priorityScore - a.priorityScore);
    } catch (error) {
      console.error('Error generating recommendations:', error);
      
      // Check if it's an OpenAI quota/rate limit error and fallback to demo recommendations
      if (error instanceof Error && 
          (error.message.includes('exceeded your current quota') || 
           error.message.includes('insufficient_quota') ||
           error.message.includes('429') || 
           error.message.includes('rate limit'))) {
        console.log('OpenAI quota exceeded in recommendation engine, falling back to demo recommendations');
        return this.generateDemoRecommendations(analysis);
      }
      
      throw new Error('Failed to generate recommendations');
    }
  }

  private async getAIRecommendations(analysis: WebsiteAnalysisResult): Promise<any[]> {
    const prompt = `Based on this business analysis, recommend 3-5 specific AI solutions that would provide the most value:

Business Type: ${analysis.businessType}
Industry: ${analysis.industry}
Pain Points: ${analysis.painPoints.join(', ')}
Current Workflows: ${analysis.workflows.join(', ')}
Business Summary: ${analysis.contentSummary}
Target Audience: ${analysis.targetAudience}

Available AI Solution Types:
1. Customer Support Chatbot - Automates customer inquiries, order tracking, returns
2. Sales Automation Agent - Lead qualification, follow-ups, appointment scheduling  
3. HR Screening Assistant - Resume screening, initial interviews, candidate ranking
4. Content Generation Agent - Blog posts, product descriptions, social media
5. Data Analysis Agent - Report generation, trend analysis, insights
6. Inventory Management Agent - Stock optimization, reorder alerts, demand forecasting
7. Email Marketing Agent - Personalized campaigns, segmentation, A/B testing
8. Price Optimization Agent - Dynamic pricing, competitor analysis, profit maximization

For each recommendation, provide:
{
  "recommendations": [
    {
      "solutionType": "specific solution type from the list above",
      "solutionName": "descriptive name for this specific implementation",
      "description": "detailed explanation of how this would work for this business",
      "estimatedCostSavings": "annual cost savings in USD (number only)",
      "estimatedTimeSavings": "time saved per week (e.g., '20 hours/week')",
      "implementationDifficulty": "easy/medium/hard",
      "roiPercentage": "estimated ROI percentage (number only)",
      "priorityScore": "1-10 priority ranking for this business",
      "reasoning": "why this solution is recommended for this specific business",
      "customizationNeeds": "specific customizations needed for this business"
    }
  ]
}

Focus on solutions that directly address the identified pain points and workflows. Be specific about the business value and implementation for this particular company.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "You are an AI business consultant expert at matching AI solutions to specific business needs. Provide actionable, realistic recommendations with concrete value estimates."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.4,
      max_tokens: 2000
    });

    const responseText = response.choices[0].message.content;
    if (!responseText) {
      throw new Error('Failed to get recommendations from AI');
    }

    const parsed = JSON.parse(responseText);
    return parsed.recommendations || [];
  }

  private enrichRecommendation(recommendation: any, analysis: WebsiteAnalysisResult): RecommendationResult {
    // Find matching template
    const template = this.findMatchingTemplate(recommendation.solutionType);
    
    // Find industry benchmark
    const benchmark = this.findIndustryBenchmark(
      analysis.industry, 
      recommendation.solutionType
    );

    return {
      solutionType: recommendation.solutionType,
      solutionName: recommendation.solutionName,
      description: recommendation.description,
      estimatedCostSavings: Number(recommendation.estimatedCostSavings) || 0,
      estimatedTimeSavings: recommendation.estimatedTimeSavings || '0 hours/week',
      implementationDifficulty: recommendation.implementationDifficulty || 'medium',
      roiPercentage: Number(recommendation.roiPercentage) || 0,
      industryBenchmark: benchmark ? 
        `${benchmark.industry} businesses typically see ${benchmark.average_improvement}${benchmark.improvement_unit} improvement` :
        'Industry benchmarks not available',
      priorityScore: Number(recommendation.priorityScore) || 5,
      templateId: template?.template_id || 'generic',
      customizationData: {
        businessType: analysis.businessType,
        industry: analysis.industry,
        painPoints: analysis.painPoints,
        customizationNeeds: recommendation.customizationNeeds
      },
      reasoning: recommendation.reasoning || ''
    };
  }

  private findMatchingTemplate(solutionType: string): AiSolutionTemplate | undefined {
    const typeMapping: Record<string, string> = {
      'Customer Support Chatbot': 'customer-support-chatbot',
      'Sales Automation Agent': 'sales-automation',
      'HR Screening Assistant': 'hr-screening',
      'Content Generation Agent': 'content-generation',
      'Data Analysis Agent': 'data-analysis',
      'Inventory Management Agent': 'inventory-management',
      'Email Marketing Agent': 'email-marketing',
      'Price Optimization Agent': 'price-optimization'
    };

    const templateId = typeMapping[solutionType];
    return this.aiSolutionTemplates.find(t => t.template_id === templateId);
  }

  private findIndustryBenchmark(industry: string, solutionType: string): IndustryBenchmark | undefined {
    return this.industryBenchmarks.find(b => 
      b.industry.toLowerCase().includes(industry.toLowerCase()) && 
      b.solution_type.toLowerCase().includes(solutionType.toLowerCase())
    );
  }

  private initializeTemplates() {
    // Initialize with pre-built templates
    this.aiSolutionTemplates = [
      {
        id: 1,
        template_id: 'customer-support-chatbot',
        name: 'Customer Support Chatbot',
        category: 'customer_support',
        description: 'AI-powered chatbot for handling customer inquiries, order tracking, and support tickets',
        use_cases: ['Order tracking', 'FAQ responses', 'Return processing', 'Live chat support'],
        required_integrations: ['website', 'email', 'shopify'],
        setup_instructions: [
          'Upload FAQ documents',
          'Connect to your website',
          'Configure response templates',
          'Set escalation rules'
        ],
        configuration_schema: {
          business_hours: 'string',
          escalation_triggers: 'array',
          knowledge_base: 'files',
          branding: 'object'
        },
        flow_data: {}, // Would contain actual agent flow
        industry_fit: ['e-commerce', 'retail', 'services', 'saas'],
        difficulty_level: 'beginner',
        estimated_setup_time: '30 minutes',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 2,
        template_id: 'sales-automation',
        name: 'Sales Automation Agent',
        category: 'sales',
        description: 'AI agent for lead qualification, follow-up emails, and appointment scheduling',
        use_cases: ['Lead qualification', 'Email follow-ups', 'Meeting scheduling', 'CRM updates'],
        required_integrations: ['email', 'calendar', 'crm'],
        setup_instructions: [
          'Connect email account',
          'Sync calendar',
          'Configure lead scoring',
          'Set follow-up sequences'
        ],
        configuration_schema: {
          lead_criteria: 'object',
          email_templates: 'array',
          calendar_integration: 'string',
          crm_fields: 'object'
        },
        flow_data: {},
        industry_fit: ['b2b', 'services', 'consulting', 'saas'],
        difficulty_level: 'intermediate',
        estimated_setup_time: '45 minutes',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ];
  }

  private initializeBenchmarks() {
    // Initialize with industry benchmarks
    this.industryBenchmarks = [
      {
        id: 1,
        industry: 'e-commerce',
        solution_type: 'customer support chatbot',
        metric_type: 'cost_reduction',
        average_improvement: 30,
        improvement_unit: '%',
        data_source: 'Industry Report 2024',
        sample_size: 1000,
        confidence_level: 85,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 2,
        industry: 'b2b services',
        solution_type: 'sales automation',
        metric_type: 'time_savings',
        average_improvement: 15,
        improvement_unit: ' hours/week',
        data_source: 'Sales Technology Study',
        sample_size: 500,
        confidence_level: 90,
        created_at: new Date(),
        updated_at: new Date()
      }
    ];
  }

  private generateDemoRecommendations(analysis: WebsiteAnalysisResult): RecommendationResult[] {
    // Generate realistic demo recommendations based on the business analysis
    const baseRecommendations = [
      {
        solutionType: "Customer Service Chatbot",
        solutionName: "AI-Powered Customer Support Assistant",
        description: "24/7 automated customer service that handles common inquiries, order tracking, and basic troubleshooting",
        estimatedCostSavings: 25000,
        estimatedTimeSavings: "20 hours/week",
        implementationDifficulty: "medium" as const,
        roiPercentage: 180,
        industryBenchmark: `${analysis.industry} businesses typically see 30% reduction in support costs`,
        priorityScore: 9,
        templateId: "chatbot-template-1",
        customizationData: {
          businessType: analysis.businessType,
          industry: analysis.industry,
          painPoints: analysis.painPoints
        },
        reasoning: "Addresses manual customer service pain points identified in your business analysis. Can handle common inquiries 24/7."
      },
      {
        solutionType: "Lead Generation & Qualification",
        solutionName: "Smart Lead Scoring System",
        description: "AI system that automatically qualifies leads and prioritizes high-value prospects for your sales team",
        estimatedCostSavings: 15000,
        estimatedTimeSavings: "15 hours/week", 
        implementationDifficulty: "easy" as const,
        roiPercentage: 220,
        industryBenchmark: `${analysis.industry} companies see 25% increase in qualified leads`,
        priorityScore: 8,
        templateId: "lead-gen-template-1",
        customizationData: {
          targetAudience: analysis.targetAudience,
          workflows: analysis.workflows
        },
        reasoning: "Automates lead qualification process and helps prioritize sales efforts for maximum conversion."
      },
      {
        solutionType: "Process Automation",
        solutionName: "Workflow Automation Suite",
        description: "Automate repetitive business processes and reduce manual tasks across your organization",
        estimatedCostSavings: 30000,
        estimatedTimeSavings: "25 hours/week",
        implementationDifficulty: "hard" as const,
        roiPercentage: 150,
        industryBenchmark: `${analysis.industry} businesses reduce operational costs by 20-35%`,
        priorityScore: 7,
        templateId: "automation-template-1", 
        customizationData: {
          workflows: analysis.workflows,
          currentTech: analysis.currentTech
        },
        reasoning: "Streamlines your identified workflows and reduces time spent on repetitive tasks."
      }
    ];

    // Customize recommendations based on industry
    if (analysis.industry.toLowerCase().includes('e-commerce') || analysis.industry.toLowerCase().includes('retail')) {
      baseRecommendations.push({
        solutionType: "Inventory Management",
        solutionName: "AI Inventory Optimization",
        description: "Predict demand patterns and optimize inventory levels to reduce costs and prevent stockouts",
        estimatedCostSavings: 20000,
        estimatedTimeSavings: "10 hours/week",
        implementationDifficulty: "medium" as const,
        roiPercentage: 165,
        industryBenchmark: "Retail businesses reduce inventory costs by 15-25%",
        priorityScore: 8,
        templateId: "inventory-template-1",
        customizationData: {
          industry: analysis.industry,
          businessType: analysis.businessType
        },
        reasoning: "Optimizes inventory management for retail operations, reducing carrying costs and stockouts."
      });
    }

    return baseRecommendations;
  }
}

export const recommendationEngine = new RecommendationEngine();