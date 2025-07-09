import axios from 'axios';

export interface ConciseOptions {
  maxLength?: number;
  style?: 'bullet' | 'paragraph' | 'sentences';
  preserveStructure?: boolean;
}

export class ResponseConciser {
  private meaningCloudKey?: string;
  private anthropicKey?: string;

  constructor() {
    this.meaningCloudKey = process.env.MEANING_CLOUD_API_KEY;
    this.anthropicKey = process.env.ANTHROPIC_API_KEY;
  }

  async conciseResponse(text: string, options: ConciseOptions = {}): Promise<string> {
    const { maxLength = 150, style = 'paragraph', preserveStructure = true } = options;

    // Try multiple free unlimited services in order of preference
    
    // 1. First try MeaningCloud (40,000 free requests/month)
    if (this.meaningCloudKey) {
      try {
        console.log('Using MeaningCloud for response concising (40k free/month)...');
        const result = await this.conciseWithMeaningCloud(text, maxLength);
        if (result) return result;
      } catch (error) {
        console.log('MeaningCloud failed, trying next option:', error.message);
      }
    }

    // 2. Try Claude/Anthropic (premium option with ANTHROPIC_API_KEY)
    if (this.anthropicKey) {
      try {
        console.log('Using Anthropic Claude for response concising...');
        const result = await this.conciseWithClaude(text, options);
        if (result) return result;
      } catch (error) {
        console.log('Claude failed, trying next option:', error.message);
      }
    }

    // 3. Try simple client-side approach (built-in JavaScript summarization)
    try {
      console.log('Using simple extractive summarization...');
      const result = this.simpleExtractiveConsize(text, maxLength);
      if (result) return result;
    } catch (error) {
      console.log('Simple summarization failed:', error.message);
    }

    // 4. Fallback: return original text truncated
    console.log('All concising methods failed, returning truncated original');
    return this.truncateIntelligently(text, maxLength);
  }

  private async conciseWithMeaningCloud(text: string, maxLength: number): Promise<string> {
    const sentences = Math.max(1, Math.floor(maxLength / 50)); // Estimate sentences needed
    
    const response = await axios.post('https://api.meaningcloud.com/summarization-1.0', new URLSearchParams({
      key: this.meaningCloudKey!,
      txt: text,
      sentences: sentences.toString(),
      lang: 'en'
    }), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 10000
    });

    if (response.data?.status?.code === '0' && response.data?.summary) {
      return response.data.summary;
    }

    throw new Error(`MeaningCloud error: ${response.data?.status?.msg || 'Unknown error'}`);
  }

  private async conciseWithClaude(text: string, options: ConciseOptions): Promise<string> {
    const { maxLength = 150, style = 'paragraph' } = options;

    const systemPrompt = `You are an expert text editor specializing in creating concise, clear summaries while preserving key information and maintaining professional tone.`;

    const prompt = `Please create a concise summary of the following text:

${text}

Requirements:
- Maximum length: ${maxLength} words
- Style: ${style === 'bullet' ? 'bullet points' : style === 'sentences' ? 'short sentences' : 'flowing paragraph'}
- Preserve all key information and technical details
- Maintain professional business tone
- Focus on actionable insights and concrete data

Return only the concise version, no additional text.`;

    const response = await axios.post('https://api.anthropic.com/v1/messages', {
      model: 'claude-3-sonnet-20240229',
      max_tokens: Math.min(maxLength * 2, 1000),
      temperature: 0.3,
      system: systemPrompt,
      messages: [{
        role: 'user',
        content: prompt
      }]
    }, {
      headers: {
        'Authorization': `Bearer ${this.anthropicKey}`,
        'Content-Type': 'application/json',
        'x-api-key': this.anthropicKey,
        'anthropic-version': '2023-06-01'
      },
      timeout: 15000
    });

    if (response.data?.content?.[0]?.text) {
      return response.data.content[0].text.trim();
    }

    throw new Error('No response from Claude API');
  }

  private simpleExtractiveConsize(text: string, maxLength: number): string {
    // Simple extractive summarization using sentence scoring
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
    
    if (sentences.length <= 3) {
      return text; // Already short enough
    }

    // Score sentences based on:
    // 1. Length (medium length preferred)
    // 2. Position (first and last sentences important)
    // 3. Keywords (business/technical terms)
    const keywords = ['AI', 'business', 'solution', 'cost', 'savings', 'ROI', 'analytics', 'automation', 'efficiency', 'revenue'];
    
    const scoredSentences = sentences.map((sentence, index) => {
      let score = 0;
      
      // Position scoring
      if (index === 0) score += 3; // First sentence important
      if (index === sentences.length - 1) score += 2; // Last sentence somewhat important
      
      // Length scoring (prefer medium length)
      const wordCount = sentence.trim().split(/\s+/).length;
      if (wordCount >= 8 && wordCount <= 20) score += 2;
      
      // Keyword scoring
      const lowerSentence = sentence.toLowerCase();
      keywords.forEach(keyword => {
        if (lowerSentence.includes(keyword.toLowerCase())) score += 1;
      });
      
      // Numbers and percentages (often important)
      if (/\d+%|\$\d+|\d+x/.test(sentence)) score += 2;
      
      return { sentence: sentence.trim(), score, index };
    });

    // Sort by score and take top sentences
    const topSentences = scoredSentences
      .sort((a, b) => b.score - a.score)
      .slice(0, Math.min(4, Math.ceil(sentences.length / 2)))
      .sort((a, b) => a.index - b.index); // Restore original order

    let result = topSentences.map(s => s.sentence).join('. ') + '.';
    
    // Ensure it's within length limit
    if (result.split(/\s+/).length > maxLength) {
      const words = result.split(/\s+/);
      result = words.slice(0, maxLength).join(' ') + '...';
    }
    
    return result;
  }

  private truncateIntelligently(text: string, maxLength: number): string {
    const words = text.split(/\s+/);
    
    if (words.length <= maxLength) {
      return text;
    }

    // Try to end at a sentence boundary
    const truncated = words.slice(0, maxLength).join(' ');
    const lastSentenceEnd = Math.max(
      truncated.lastIndexOf('.'),
      truncated.lastIndexOf('!'),
      truncated.lastIndexOf('?')
    );

    if (lastSentenceEnd > truncated.length * 0.7) {
      // If we can end at a sentence within 70% of target, do that
      return truncated.substring(0, lastSentenceEnd + 1);
    }

    // Otherwise, truncate at word boundary with ellipsis
    return truncated + '...';
  }

  // Method to check which services are available
  async getAvailableServices(): Promise<string[]> {
    const services: string[] = [];
    
    if (this.meaningCloudKey) services.push('MeaningCloud (40k free/month)');
    if (this.anthropicKey) services.push('Claude/Anthropic');
    services.push('Extractive Summarization');
    services.push('Intelligent Truncation');
    
    return services;
  }
}

export const responseConciser = new ResponseConciser();