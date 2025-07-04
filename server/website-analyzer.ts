import OpenAI from "openai";
import { load } from "cheerio";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface WebsiteAnalysisResult {
  businessType: string;
  businessName: string;
  industry: string;
  painPoints: string[];
  workflows: string[];
  contentSummary: string;
  keyFeatures: string[];
  targetAudience: string;
  currentTech: string[];
}

export class WebsiteAnalyzer {
  async analyzeWebsite(url: string): Promise<WebsiteAnalysisResult> {
    try {
      // Normalize URL - add https:// if no protocol is provided
      let normalizedUrl = url.trim();
      if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
        normalizedUrl = 'https://' + normalizedUrl;
      }
      
      let response;
      let finalUrl = normalizedUrl;
      
      try {
        // First try with HTTPS
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        response = await fetch(normalizedUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
      } catch (httpsError) {
        // If HTTPS fails, try HTTP
        if (normalizedUrl.startsWith('https://')) {
          finalUrl = normalizedUrl.replace('https://', 'http://');
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);
            
            response = await fetch(finalUrl, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
              },
              signal: controller.signal
            });
            
            clearTimeout(timeoutId);
          } catch (httpError) {
            throw new Error(`Unable to access website. Please check if the URL is correct and the website is online.`);
          }
        } else {
          throw new Error(`Unable to access website. Please check if the URL is correct and the website is online.`);
        }
      }
      
      if (!response.ok) {
        throw new Error(`Website returned an error (${response.status}). Please check if the URL is correct.`);
      }

      const html = await response.text();
      const extractedContent = this.extractContent(html);
      
      // Use AI to analyze the content
      const analysis = await this.analyzeContentWithAI(extractedContent, finalUrl);
      
      return analysis;
    } catch (error) {
      console.error('Error analyzing website:', error);
      
      // Provide user-friendly error messages
      if (error instanceof Error) {
        if (error.message.includes('Invalid URL') || error.message.includes('Failed to parse URL')) {
          throw new Error('Please enter a valid website URL (e.g., www.example.com or https://example.com)');
        }
        if (error.message.includes('timeout') || error.message.includes('TIMEOUT')) {
          throw new Error('Website took too long to respond. Please try again or check if the website is online.');
        }
        if (error.message.includes('DNS') || error.message.includes('ENOTFOUND')) {
          throw new Error('Website not found. Please check the URL and try again.');
        }
        throw new Error(error.message);
      }
      
      throw new Error('Failed to analyze website. Please check the URL and try again.');
    }
  }

  private extractContent(html: string): {
    title: string;
    headings: string[];
    mainContent: string;
    navigationItems: string[];
    metaDescription: string;
    images: string[];
    links: string[];
  } {
    const $ = load(html);
    
    // Remove scripts, styles, and other non-content elements
    $('script, style, nav, footer, header, aside, .advertisement, .ads, .popup').remove();
    
    const title = $('title').text().trim() || '';
    const metaDescription = $('meta[name="description"]').attr('content') || '';
    
    // Extract headings
    const headings: string[] = [];
    $('h1, h2, h3, h4, h5, h6').each((_, el) => {
      const text = $(el).text().trim();
      if (text && text.length > 2) {
        headings.push(text);
      }
    });
    
    // Extract main content
    const contentSelectors = [
      'main', '.main-content', '.content', '.page-content',
      'article', '.article', '.post', '.entry-content',
      '.description', '.about', '.services', '.products'
    ];
    
    let mainContent = '';
    for (const selector of contentSelectors) {
      const content = $(selector).text().trim();
      if (content && content.length > mainContent.length) {
        mainContent = content;
      }
    }
    
    // Fallback to body content if no main content found
    if (!mainContent) {
      mainContent = $('body').text().trim();
    }
    
    // Extract navigation items
    const navigationItems: string[] = [];
    $('nav a, .nav a, .menu a, .navigation a, header a').each((_, el) => {
      const text = $(el).text().trim();
      if (text && text.length > 1 && text.length < 50) {
        navigationItems.push(text);
      }
    });
    
    // Extract image alt texts
    const images: string[] = [];
    $('img[alt]').each((_, el) => {
      const alt = $(el).attr('alt')?.trim();
      if (alt && alt.length > 2) {
        images.push(alt);
      }
    });
    
    // Extract important links
    const links: string[] = [];
    $('a').each((_, el) => {
      const text = $(el).text().trim();
      const href = $(el).attr('href');
      if (text && href && text.length > 2 && text.length < 100) {
        links.push(text);
      }
    });
    
    return {
      title,
      headings: headings.slice(0, 20), // Limit to first 20 headings
      mainContent: mainContent.slice(0, 5000), // Limit content length
      navigationItems: [...new Set(navigationItems)].slice(0, 15),
      metaDescription,
      images: images.slice(0, 10),
      links: [...new Set(links)].slice(0, 20)
    };
  }

  private async analyzeContentWithAI(content: any, url: string): Promise<WebsiteAnalysisResult> {
    const prompt = `Analyze this website content and provide a structured analysis:

Website URL: ${url}
Title: ${content.title}
Meta Description: ${content.metaDescription}
Headings: ${content.headings.join(', ')}
Navigation: ${content.navigationItems.join(', ')}
Main Content: ${content.mainContent}
Image Alt Texts: ${content.images.join(', ')}
Key Links: ${content.links.join(', ')}

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

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "You are a business analyst expert at identifying business types, workflows, and potential areas for AI automation. Provide detailed, actionable analysis in the requested JSON format."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 1500
    });

    const analysisText = response.choices[0].message.content;
    if (!analysisText) {
      throw new Error('Failed to get analysis from AI');
    }

    try {
      const analysis = JSON.parse(analysisText);
      
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
    } catch (error) {
      console.error('Failed to parse AI analysis response:', error);
      throw new Error('Failed to parse analysis results');
    }
  }
}

export const websiteAnalyzer = new WebsiteAnalyzer();