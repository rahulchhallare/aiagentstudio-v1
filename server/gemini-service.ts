import { GoogleGenAI } from "@google/genai";
import type { WebsiteAnalysisResult } from "./website-analyzer";

export class GeminiService {
  private ai: GoogleGenAI;

  constructor(apiKey: string) {
    this.ai = new GoogleGenAI({ apiKey });
  }

  async generateCompletion(prompt: string, systemPrompt?: string): Promise<string> {
    try {
      const fullPrompt = systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt;

      const response = await this.ai.models.generateContent({
        model: "gemini-2.5-flash", // Free model with generous limits
        contents: fullPrompt,
        config: {
          temperature: 0.3,
          maxOutputTokens: 1500,
        }
      });

      if (!response.text) {
        throw new Error('No response from Gemini API');
      }

      return response.text;
    } catch (error: any) {
      console.error('Gemini API error:', error);
      throw new Error(`Gemini API error: ${error.message}`);
    }
  }

  async analyzeWebsite(websiteContent: string, websiteUrl: string): Promise<WebsiteAnalysisResult> {
    const systemPrompt = `You are a business analyst expert at identifying business types, workflows, and potential areas for AI automation. Analyze the website content and provide detailed, actionable analysis in JSON format.`;

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
      const response = await this.ai.models.generateContent({
        model: "gemini-2.5-pro", // More powerful model for complex analysis
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json",
          responseSchema: {
            type: "object",
            properties: {
              businessType: { type: "string" },
              businessName: { type: "string" },
              industry: { type: "string" },
              painPoints: { type: "array", items: { type: "string" } },
              workflows: { type: "array", items: { type: "string" } },
              contentSummary: { type: "string" },
              keyFeatures: { type: "array", items: { type: "string" } },
              targetAudience: { type: "string" },
              currentTech: { type: "array", items: { type: "string" } }
            },
            required: ["businessType", "businessName", "industry", "painPoints", "workflows", "contentSummary", "keyFeatures", "targetAudience", "currentTech"]
          },
          temperature: 0.3,
          maxOutputTokens: 1500,
        },
        contents: prompt,
      });

      if (!response.text) {
        throw new Error('No response from Gemini analysis');
      }

      const analysis = JSON.parse(response.text);
      
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
      console.error('Error parsing Gemini analysis response:', error);
      throw new Error(`Failed to analyze website with Gemini: ${error.message}`);
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
      const response = await this.ai.models.generateContent({
        model: "gemini-2.5-pro",
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json",
          responseSchema: {
            type: "object",
            properties: {
              recommendations: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    solutionType: { type: "string" },
                    solutionName: { type: "string" },
                    description: { type: "string" },
                    estimatedCostSavings: { type: "number" },
                    estimatedTimeSavings: { type: "string" },
                    implementationDifficulty: { type: "string" },
                    roiPercentage: { type: "number" },
                    priorityScore: { type: "number" },
                    reasoning: { type: "string" },
                    customizationNeeds: { type: "string" }
                  }
                }
              }
            }
          },
          temperature: 0.4,
          maxOutputTokens: 2000,
        },
        contents: prompt,
      });

      if (!response.text) {
        throw new Error('No recommendations from Gemini');
      }

      const parsed = JSON.parse(response.text);
      return parsed.recommendations || [];
    } catch (error: any) {
      console.error('Error parsing Gemini recommendations response:', error);
      throw new Error(`Failed to generate recommendations with Gemini: ${error.message}`);
    }
  }
}

export function getGeminiService(): GeminiService {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is required');
  }
  return new GeminiService(apiKey);
}