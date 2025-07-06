import axios from 'axios';

export interface DeepSeekResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class DeepSeekService {
  private apiKey: string;
  private baseURL: string = 'https://api.deepseek.com/v1';

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

      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model: 'deepseek-chat',
          messages,
          temperature: 0.7,
          max_tokens: 2000,
          top_p: 0.95,
          frequency_penalty: 0,
          presence_penalty: 0,
          stream: false
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      return response.data.choices[0]?.message?.content || '';
    } catch (error: any) {
      console.error('DeepSeek API error:', error.response?.data || error.message);
      throw new Error(`DeepSeek API error: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  async analyzeWebsite(websiteContent: string, websiteUrl: string): Promise<any> {
    const systemPrompt = `You are a senior business analyst specializing in AI transformation. Analyze the provided website content and provide comprehensive business insights.

Return your analysis in the following JSON format:
{
  "businessName": "extracted company name",
  "businessType": "B2B/B2C classification",
  "industry": "primary industry category",
  "painPoints": ["list of identified business challenges"],
  "currentTech": ["existing technology stack if identifiable"],
  "targetAudience": "primary customer segment",
  "businessModel": "revenue model description",
  "keyServices": ["main services or products offered"],
  "competitiveAdvantage": "unique value proposition",
  "growthStage": "startup/growth/mature/enterprise",
  "employeeCount": "estimated company size",
  "annualRevenue": "estimated revenue range",
  "digitalMaturity": "low/medium/high digital adoption level"
}

Focus on extracting concrete business insights that would be relevant for AI solution recommendations.`;

    const analysisPrompt = `Analyze this website content for business intelligence:

Website URL: ${websiteUrl}
Website Content: ${websiteContent}

Please provide a comprehensive business analysis focusing on:
1. Business model and revenue streams
2. Current operational challenges
3. Technology adoption level
4. Customer service processes
5. Sales and marketing approaches
6. Data handling and analytics capabilities
7. Automation opportunities
8. Competitive positioning

Return only valid JSON without any additional text or formatting.`;

    try {
      const response = await this.generateCompletion(analysisPrompt, systemPrompt);
      return JSON.parse(response);
    } catch (error) {
      console.error('Error parsing DeepSeek analysis response:', error);
      throw error;
    }
  }

  async generateRecommendations(analysis: any): Promise<any[]> {
    const systemPrompt = `You are an AI solutions architect specializing in business automation. Based on the business analysis provided, generate specific AI solution recommendations.

Return your recommendations as a JSON array with this exact format:
[
  {
    "solutionType": "specific AI solution category",
    "solutionName": "descriptive solution name",
    "description": "detailed description of the solution",
    "estimatedCostSavings": number (annual savings in USD),
    "estimatedTimeSavings": "time saved description",
    "implementationDifficulty": "easy/medium/hard",
    "roiPercentage": number (expected ROI percentage),
    "industryBenchmark": "relevant industry insight",
    "priorityScore": number (1-10 priority rating),
    "reasoning": "why this solution is recommended for this business"
  }
]

Focus on practical, implementable AI solutions that directly address the business challenges identified.`;

    const recommendationPrompt = `Based on this business analysis, generate 5-8 specific AI solution recommendations:

Business Analysis:
${JSON.stringify(analysis, null, 2)}

Consider solutions in these categories:
- Customer Support & Service Automation
- Sales & Marketing Automation  
- Data Analytics & Business Intelligence
- Operations & Process Automation
- Content Generation & Management
- Predictive Analytics & Forecasting
- Inventory & Supply Chain Optimization
- Financial Analysis & Compliance

Each recommendation should be tailored to the specific business context and challenges identified.

Return only valid JSON array without any additional text.`;

    try {
      const response = await this.generateCompletion(recommendationPrompt, systemPrompt);
      return JSON.parse(response);
    } catch (error) {
      console.error('Error parsing DeepSeek recommendations response:', error);
      throw error;
    }
  }
}

// Create singleton instance
let deepSeekService: DeepSeekService | null = null;

export function getDeepSeekService(): DeepSeekService {
  if (!deepSeekService) {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      throw new Error('DEEPSEEK_API_KEY environment variable is required');
    }
    deepSeekService = new DeepSeekService(apiKey);
  }
  return deepSeekService;
}