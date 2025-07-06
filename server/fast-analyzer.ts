import type { WebsiteAnalysisResult } from "./website-analyzer";

export class FastAnalyzer {
  /**
   * Quick analysis mode that provides immediate results
   * Uses intelligent fallbacks and optimized processing
   */
  async quickAnalyze(url: string): Promise<WebsiteAnalysisResult> {
    console.log('FastAnalyzer: Starting quick analysis for:', url);
    
    try {
      // Quick content extraction with shorter timeout
      const content = await this.extractQuickContent(url);
      
      // Generate analysis based on URL pattern and basic content
      return this.generateSmartAnalysis(url, content);
    } catch (error) {
      console.log('FastAnalyzer: Falling back to URL-based analysis');
      return this.generateURLBasedAnalysis(url);
    }
  }

  private async extractQuickContent(url: string): Promise<any> {
    // Normalize URL with protocol if missing
    let normalizedUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      normalizedUrl = `https://${url}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
    
    try {
      const response = await fetch(normalizedUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; BusinessAnalyzer/1.0)',
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) throw new Error('Failed to fetch');
      
      const html = await response.text();
      
      // Quick extraction - just get title and key elements
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      const title = titleMatch ? titleMatch[1].trim() : '';
      
      // Extract meta description
      const metaMatch = html.match(/<meta[^>]*name=['""]description['""][^>]*content=['""]([^'"]*)['""][^>]*>/i);
      const description = metaMatch ? metaMatch[1] : '';
      
      // Look for key business indicators
      const businessKeywords = this.extractBusinessKeywords(html);
      
      return {
        title,
        description,
        businessKeywords,
        url
      };
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  private extractBusinessKeywords(html: string): string[] {
    const keywords: string[] = [];
    const businessTerms = [
      'shop', 'store', 'buy', 'sell', 'ecommerce', 'e-commerce',
      'service', 'consulting', 'agency', 'company', 'business',
      'restaurant', 'food', 'hotel', 'booking', 'reservation',
      'software', 'app', 'platform', 'technology', 'tech',
      'healthcare', 'medical', 'legal', 'finance', 'insurance',
      'education', 'learning', 'course', 'training', 'school'
    ];
    
    const lowerHtml = html.toLowerCase();
    
    businessTerms.forEach(term => {
      if (lowerHtml.includes(term)) {
        keywords.push(term);
      }
    });
    
    return keywords.slice(0, 5); // Return top 5 keywords
  }

  private generateSmartAnalysis(url: string, content: any): WebsiteAnalysisResult {
    // Normalize URL with protocol if missing
    let normalizedUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      normalizedUrl = `https://${url}`;
    }
    
    const domain = new URL(normalizedUrl).hostname.replace('www.', '');
    const title = content.title || domain;
    const keywords = content.businessKeywords || [];
    
    // Smart business type detection
    let businessType = 'General Business';
    let industry = 'Technology';
    
    if (keywords.includes('shop') || keywords.includes('store') || keywords.includes('ecommerce')) {
      businessType = 'E-commerce Store';
      industry = 'Retail';
    } else if (keywords.includes('restaurant') || keywords.includes('food')) {
      businessType = 'Restaurant';
      industry = 'Food Service';
    } else if (keywords.includes('hotel') || keywords.includes('booking')) {
      businessType = 'Hospitality Business';
      industry = 'Travel & Hospitality';
    } else if (keywords.includes('consulting') || keywords.includes('agency')) {
      businessType = 'Professional Services';
      industry = 'Consulting';
    } else if (keywords.includes('software') || keywords.includes('app') || keywords.includes('platform')) {
      businessType = 'Software Company';
      industry = 'Technology';
    }
    
    return {
      businessType,
      businessName: title,
      industry,
      painPoints: this.generatePainPoints(businessType),
      workflows: this.generateWorkflows(businessType),
      contentSummary: `${businessType} operating in the ${industry} sector. Quick analysis based on website indicators.`,
      keyFeatures: this.generateFeatures(businessType),
      targetAudience: this.generateTargetAudience(businessType),
      currentTech: ['Website', 'Online Presence']
    };
  }

  private generateURLBasedAnalysis(url: string): WebsiteAnalysisResult {
    // Normalize URL with protocol if missing
    let normalizedUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      normalizedUrl = `https://${url}`;
    }
    
    console.log('FastAnalyzer: Normalized URL:', normalizedUrl);
    
    let domain: string;
    try {
      domain = new URL(normalizedUrl).hostname.replace('www.', '');
    } catch (error) {
      console.error('FastAnalyzer: URL parsing error:', error);
      // Fallback to extract domain from URL string
      domain = normalizedUrl.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
    }
    
    return {
      businessType: 'Online Business',
      businessName: domain,
      industry: 'Digital Services',
      painPoints: [
        'Online customer engagement',
        'Digital marketing optimization',
        'Customer support automation',
        'Lead generation improvement'
      ],
      workflows: [
        'Website management',
        'Customer inquiries',
        'Online marketing',
        'Content management'
      ],
      contentSummary: `Online business with digital presence at ${domain}. Analysis based on domain and industry patterns.`,
      keyFeatures: [
        'Web presence',
        'Online accessibility',
        'Digital platform'
      ],
      targetAudience: 'Online customers and digital users',
      currentTech: ['Website', 'Domain hosting']
    };
  }

  private generatePainPoints(businessType: string): string[] {
    const painPointsMap: Record<string, string[]> = {
      'E-commerce Store': [
        'Abandoned cart recovery',
        'Customer support volume',
        'Inventory management complexity',
        'Personalized product recommendations'
      ],
      'Restaurant': [
        'Reservation management',
        'Order processing efficiency',
        'Customer feedback handling',
        'Staff scheduling optimization'
      ],
      'Software Company': [
        'Customer onboarding complexity',
        'Technical support scalability',
        'Feature request management',
        'User engagement tracking'
      ],
      'Professional Services': [
        'Lead qualification process',
        'Client communication efficiency',
        'Project management overhead',
        'Proposal generation time'
      ],
      'Hospitality Business': [
        'Booking management complexity',
        'Guest service optimization',
        'Revenue management',
        'Seasonal demand fluctuations'
      ]
    };
    
    return painPointsMap[businessType] || [
      'Customer service efficiency',
      'Process automation needs',
      'Data analysis challenges',
      'Growth scaling issues'
    ];
  }

  private generateWorkflows(businessType: string): string[] {
    const workflowsMap: Record<string, string[]> = {
      'E-commerce Store': [
        'Order processing',
        'Customer support',
        'Inventory management',
        'Marketing campaigns'
      ],
      'Restaurant': [
        'Reservation system',
        'Order management',
        'Customer service',
        'Menu updates'
      ],
      'Software Company': [
        'User onboarding',
        'Support tickets',
        'Feature development',
        'Customer success'
      ],
      'Professional Services': [
        'Lead generation',
        'Client meetings',
        'Project delivery',
        'Billing process'
      ],
      'Hospitality Business': [
        'Booking management',
        'Guest services',
        'Housekeeping coordination',
        'Revenue optimization'
      ]
    };
    
    return workflowsMap[businessType] || [
      'Customer interactions',
      'Business operations',
      'Administrative tasks',
      'Growth activities'
    ];
  }

  private generateFeatures(businessType: string): string[] {
    const featuresMap: Record<string, string[]> = {
      'E-commerce Store': [
        'Product catalog',
        'Shopping cart',
        'Payment processing',
        'Customer accounts'
      ],
      'Restaurant': [
        'Menu display',
        'Reservation system',
        'Location information',
        'Contact details'
      ],
      'Software Company': [
        'Product information',
        'Documentation',
        'Support resources',
        'User accounts'
      ],
      'Professional Services': [
        'Service descriptions',
        'Team profiles',
        'Contact forms',
        'Portfolio showcase'
      ],
      'Hospitality Business': [
        'Room information',
        'Booking system',
        'Amenities list',
        'Guest reviews'
      ]
    };
    
    return featuresMap[businessType] || [
      'Information display',
      'Contact capabilities',
      'Service descriptions',
      'Business details'
    ];
  }

  private generateTargetAudience(businessType: string): string {
    const audienceMap: Record<string, string> = {
      'E-commerce Store': 'Online shoppers looking for products and convenient purchasing experience',
      'Restaurant': 'Local diners and food enthusiasts seeking dining experiences',
      'Software Company': 'Businesses and individuals needing software solutions',
      'Professional Services': 'Companies requiring specialized expertise and consulting',
      'Hospitality Business': 'Travelers and guests seeking accommodation and hospitality services'
    };
    
    return audienceMap[businessType] || 'General customers seeking products or services online';
  }
}

export const fastAnalyzer = new FastAnalyzer();