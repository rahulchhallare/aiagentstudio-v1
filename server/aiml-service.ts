import axios from 'axios';
import type { WebsiteAnalysisResult } from "./website-analyzer";

export class AIMLService {
  private apiKey: string;
  private baseURL: string = 'https://api.aimlapi.com/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateCompletion(prompt: string, systemPrompt?: string): Promise<string> {
    try {
      const messages = [];
      
      if (systemPrompt) {
        messages.push({
          role: 'system',
          content: systemPrompt
        });
      }
      
      messages.push({
        role: 'user',
        content: prompt
      });

      const response = await axios.post(`${this.baseURL}/chat/completions`, {
        model: 'gpt-4o', // AI/ML API provides access to GPT-4o and other models
        messages: messages,
        temperature: 0.3,
        max_tokens: 1500,
        response_format: { type: "json_object" }
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });

      if (response.data?.choices?.[0]?.message?.content) {
        return response.data.choices[0].message.content;
      }

      throw new Error('No response from AI/ML API');
    } catch (error: any) {
      if (error.response) {
        console.error('AI/ML API error:', {
          status: error.response.status,
          data: error.response.data
        });
        throw new Error(`AI/ML API error: ${error.response.data?.error?.message || error.response.statusText}`);
      }
      throw new Error(`AI/ML API request failed: ${error.message}`);
    }
  }

  async analyzeWebsite(websiteContent: string, websiteUrl: string): Promise<WebsiteAnalysisResult> {
    const systemPrompt = `You are a business analyst expert at identifying business types, workflows, and potential areas for AI automation. Analyze the website content and provide detailed, actionable analysis in the requested JSON format.`;

    const prompt = `Analyze this website content and provide a structured analysis:

${websiteContent}

Based on this content, analyze and provide the following information in JSON format:

{
  "businessType": "specific business model (e.g., e-commerce store, SaaS platform, consulting services, restaurant, retail, manufacturing, etc.)",
  "businessName": "the actual business name",
  "industry": "specific industry (e.g., fashion retail, B2B software, digital marketing, food service, healthcare, etc.)",
  "painPoints": ["list of 3-5 potential business challenges or inefficiencies this business likely faces"],
  "workflows": ["list of 3-5 key business processes this company runs (e.g., customer support, order processing, lead generation)"],
  "contentSummary": "concise 2-3 sentence summary of what this business does and offers",
  "keyFeatures": ["list of main products/services/features offered"],
  "targetAudience": "description of their primary customer base",
  "currentTech": ["list of technologies/platforms that appear to be in use based on the website"]
}

Focus on being specific and actionable. Identify real business challenges that AI could help solve.`;

    try {
      const responseText = await this.generateCompletion(prompt, systemPrompt);
      const analysis = JSON.parse(responseText);
      
      // Validate and clean the response
      return {
        businessType: analysis.businessType || 'Unknown',
        businessName: analysis.businessName || 'Unknown',
        industry: analysis.industry || 'Unknown',
        painPoints: Array.isArray(analysis.painPoints) ? analysis.painPoints : [],
        workflows: Array.isArray(analysis.workflows) ? analysis.workflows : [],
        contentSummary: analysis.contentSummary || '',
        keyFeatures: Array.isArray(analysis.keyFeatures) ? analysis.keyFeatures : [],
        targetAudience: analysis.targetAudience || '',
        currentTech: Array.isArray(analysis.currentTech) ? analysis.currentTech : []
      };
    } catch (error: any) {
      console.error('Error parsing AI/ML analysis response:', error);
      throw new Error(`Failed to analyze website with AI/ML API: ${error.message}`);
    }
  }

  async generateRecommendations(analysis: WebsiteAnalysisResult): Promise<any[]> {
    const systemPrompt = `You are an AI business consultant expert at matching AI solutions to specific business needs. Provide actionable, realistic recommendations with concrete value estimates.`;

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

    try {
      const responseText = await this.generateCompletion(prompt, systemPrompt);
      const parsed = JSON.parse(responseText);
      return parsed.recommendations || [];
    } catch (error: any) {
      console.error('Error parsing AI/ML recommendations response:', error);
      throw new Error(`Failed to generate recommendations with AI/ML API: ${error.message}`);
    }
  }
}

export function getAIMLService(): AIMLService {
  const apiKey = process.env.AIML_API_KEY;
  if (!apiKey) {
    throw new Error('AIML_API_KEY environment variable is required');
  }
  return new AIMLService(apiKey);
}