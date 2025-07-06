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
        model: "gemini-1.5-flash", // Most reliable free model
        contents: fullPrompt,
        config: {
          temperature: 0.3,
          maxOutputTokens: 2000, // Reduced to avoid truncation issues
        }
      });

      if (!response.text || response.text.trim() === '') {
        console.error('Empty response from Gemini API');
        throw new Error('No response from Gemini API');
      }

      return response.text.trim();
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

      // Clean and parse the JSON response
      let cleanedResponse = response.text.trim();
      
      // Remove any markdown formatting if present
      if (cleanedResponse.startsWith('```json')) {
        cleanedResponse = cleanedResponse.replace(/```json\n?/, '').replace(/\n?```$/, '');
      }
      
      // Try to fix common JSON issues
      try {
        const analysis = JSON.parse(cleanedResponse);
        
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
      } catch (parseError) {
        console.error('Gemini JSON parsing failed, attempting fallback parsing:', parseError);
        console.log('Raw response:', cleanedResponse);
        
        // Try to fix truncated JSON by attempting to close incomplete structures
        let fixedResponse = cleanedResponse;
        
        // Check if the response is truncated and try to fix it
        if (parseError.message.includes('Unterminated string')) {
          // Try to close unterminated strings and arrays
          fixedResponse = this.fixTruncatedJSON(cleanedResponse);
          
          try {
            const analysis = JSON.parse(fixedResponse);
            console.log('Successfully parsed fixed JSON response');
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
          } catch (fixError) {
            console.error('Failed to fix JSON, falling back to error:', fixError);
          }
        }
        
        // If all parsing attempts fail, throw error to trigger fallback
        throw new Error(`Failed to parse Gemini response: ${parseError.message}`);
      }
    } catch (error: any) {
      console.error('Error analyzing website with Gemini:', error);
      throw new Error(`Failed to analyze website with Gemini: ${error.message}`);
    }
  }

  private fixTruncatedJSON(jsonString: string): string {
    let fixed = jsonString;
    
    // Count open braces and brackets to see what needs to be closed
    let openBraces = 0;
    let openBrackets = 0;
    let inString = false;
    let escapeNext = false;
    
    for (let i = 0; i < fixed.length; i++) {
      const char = fixed[i];
      
      if (escapeNext) {
        escapeNext = false;
        continue;
      }
      
      if (char === '\\') {
        escapeNext = true;
        continue;
      }
      
      if (char === '"' && !escapeNext) {
        inString = !inString;
        continue;
      }
      
      if (!inString) {
        if (char === '{') openBraces++;
        else if (char === '}') openBraces--;
        else if (char === '[') openBrackets++;
        else if (char === ']') openBrackets--;
      }
    }
    
    // If we ended in a string, close it
    if (inString) {
      fixed += '"';
    }
    
    // Close any open arrays first
    for (let i = 0; i < openBrackets; i++) {
      fixed += ']';
    }
    
    // Close any open objects
    for (let i = 0; i < openBraces; i++) {
      fixed += '}';
    }
    
    return fixed;
  }

  async generateRecommendations(analysis: WebsiteAnalysisResult): Promise<any[]> {
    const systemPrompt = `You are an AI business consultant expert at matching AI solutions to specific business needs. Provide actionable, realistic recommendations with concrete value estimates.`;

    const prompt = `Analyze this business and recommend 3-4 AI solutions in JSON format:

Business: ${analysis.businessType} (${analysis.industry})
Pain Points: ${analysis.painPoints.join(', ')}
Workflows: ${analysis.workflows.join(', ')}

AI Solutions Available:
1. Customer Support Chatbot 2. Sales Automation Agent 3. Content Generation Agent 
4. Data Analysis Agent 5. Inventory Management Agent 6. Email Marketing Agent

Respond with JSON only:
{
  "recommendations": [
    {
      "solutionType": "exact name from list above",
      "solutionName": "specific name for this business",
      "description": "how this helps this specific business",
      "estimatedCostSavings": 25000,
      "estimatedTimeSavings": "10 hours/week",
      "implementationDifficulty": "easy",
      "roiPercentage": 300,
      "priorityScore": 8,
      "reasoning": "why this solution fits this business",
      "customizationNeeds": "specific customizations needed"
    }
  ]
}`;

    try {
      const responseText = await this.generateCompletion(prompt, systemPrompt);
      
      if (!responseText || responseText.trim() === '') {
        throw new Error('Gemini returned empty response');
      }
      
      // Clean and parse the JSON response
      let cleanedResponse = responseText.trim();
      
      // Remove any markdown formatting if present
      if (cleanedResponse.startsWith('```json')) {
        cleanedResponse = cleanedResponse.replace(/```json\n?/, '').replace(/\n?```$/, '');
      }
      
      // Also handle case where it just starts with ```
      if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.replace(/```\n?/, '').replace(/\n?```$/, '');
      }
      
      const parsed = JSON.parse(cleanedResponse);
      const recommendations = parsed.recommendations || [];
      
      if (recommendations.length === 0) {
        throw new Error('Gemini returned no recommendations');
      }
      
      return recommendations;
    } catch (error: any) {
      console.error('Error parsing Gemini recommendations response:', error);
      console.log('Raw response length:', responseText?.length || 0);
      console.log('Raw response preview:', responseText?.substring(0, 200) || 'N/A');
      throw new Error(`Failed to generate recommendations with Gemini: ${error.message}`);
    }
  }
}

export function getGeminiService(): GeminiService {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }
  return new GeminiService(apiKey);
}
