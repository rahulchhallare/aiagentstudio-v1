import OpenAI from "openai";
import { generateReturnAuthNumber } from "./utils";

const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

export interface ChatbotResponse {
  message: string;
  requiresInput?: boolean;
  inputType?: 'order_number' | 'email' | 'product_name' | 'return_reason';
  nextStep?: string;
  escalateToHuman?: boolean;
}

export class ChatbotService {
  private sessions: { [sessionId: string]: { messages: any[], context: any } } = {};
  
  private faqs = {
    shipping: {
      keywords: ['shipping', 'delivery', 'ship', 'deliver', 'when will', 'how long'],
      responses: [
        "We offer free standard shipping on orders over $50. Standard shipping takes 3-5 business days.",
        "Express shipping (1-2 business days) is available for $9.99.",
        "International shipping is available to most countries and takes 7-14 business days."
      ]
    },
    returns: {
      keywords: ['return', 'refund', 'exchange', 'send back'],
      responses: [
        "We accept returns within 30 days of purchase.",
        "Items must be in original condition with tags attached.",
        "Return shipping is free for defective items, $5.99 for other returns."
      ]
    },
    payment: {
      keywords: ['payment', 'pay', 'card', 'paypal', 'checkout'],
      responses: [
        "We accept all major credit cards, PayPal, Apple Pay, and Google Pay.",
        "Your payment information is secure and encrypted.",
        "For payment issues, please check your card details or try a different payment method."
      ]
    },
    tracking: {
      keywords: ['track', 'where is', 'status', 'order'],
      responses: [
        "You can track your order using the tracking number sent to your email.",
        "Orders typically ship within 1-2 business days.",
        "If you need help finding your tracking information, I can help with your order number."
      ]
    }
  };

  async processMessage(sessionId: string, message: string, context?: any): Promise<ChatbotResponse> {
    console.log(`Processing message for session ${sessionId}: ${message}`, context);

    // Initialize session if not exists
    if (!this.sessions[sessionId]) {
      this.sessions[sessionId] = { messages: [], context: {} };
    }

    // Use client-passed context first, then session context
    const sessionContext = context || this.sessions[sessionId].context;
    console.log('Using context:', sessionContext);
    
    let response: ChatbotResponse;

    // Handle conversation states based on context
    if (sessionContext.awaitingOrderNumber || sessionContext.currentStep === 'order_tracking') {
      console.log('Handling order inquiry...');
      response = await this.handleOrderInquiry(sessionId, message);
      // Clear context after successful order lookup
      this.sessions[sessionId].context = {};
    } else if (sessionContext.awaitingReturnConfirmation || sessionContext.currentStep === 'return_confirmation') {
      console.log('Handling return confirmation...');
      response = await this.handleReturnConfirmation(sessionId, message);
    } else if (sessionContext.awaitingReturnInfo) {
      console.log('Handling return process...');
      response = await this.handleReturnProcess(sessionId, message, sessionContext);
    } else if (sessionContext.awaitingEmail) {
      console.log('Handling email collection...');
      response = await this.handleEmailCollection(sessionId, message);
    } else {
      console.log('Handling general inquiry...');
      response = await this.handleGeneralInquiry(sessionId, message);
    }

    // Update session context based on response
    if (response.nextStep) {
      this.sessions[sessionId].context = {
        currentStep: response.nextStep,
        awaitingOrderNumber: response.nextStep === 'order_tracking',
        awaitingReturnConfirmation: response.nextStep === 'return_confirmation',
        awaitingReturnInfo: response.nextStep === 'return_process',
        awaitingEmail: response.nextStep === 'human_escalation'
      };
      console.log('Updated context:', this.sessions[sessionId].context);
    } else {
      // Clear context if no next step
      this.sessions[sessionId].context = {};
    }

    return response;
  }

  private async handleGeneralInquiry(sessionId: string, message: string): Promise<ChatbotResponse> {
    const lowerMessage = message.toLowerCase();

    // Handle specific shipping questions
    if (lowerMessage.includes('shipping') && lowerMessage.includes('options')) {
      return {
        message: "We offer several shipping options:\n\n" +
                "• **Free Standard Shipping** (3-5 business days) - on orders over $50\n" +
                "• **Express Shipping** (1-2 business days) - $9.99\n" +
                "• **Overnight Shipping** (next business day) - $19.99\n" +
                "• **International Shipping** (7-14 business days) - varies by location\n\n" +
                "Would you like more details about any of these options?"
      };
    }

    // Check for FAQ matches
    for (const [category, faq] of Object.entries(this.faqs)) {
      if (faq.keywords.some(keyword => lowerMessage.includes(keyword))) {
        if (category === 'tracking' && lowerMessage.includes('order')) {
          return {
            message: "I can help you track your order! Please provide your order number (it usually starts with #):",
            requiresInput: true,
            inputType: 'order_number',
            nextStep: 'order_tracking'
          };
        }
        
        if (category === 'returns') {
          return {
            message: `${faq.responses.join(' ')} Would you like to start a return request? I can help you with that!`,
            requiresInput: false
          };
        }

        const randomResponse = faq.responses[Math.floor(Math.random() * faq.responses.length)];
        return {
          message: randomResponse
        };
      }
    }

    // Handle payment methods question
    if (lowerMessage.includes('payment') && lowerMessage.includes('methods')) {
      return {
        message: "We accept the following payment methods:\n\n" +
                "• All major credit cards (Visa, MasterCard, American Express, Discover)\n" +
                "• PayPal\n" +
                "• Apple Pay\n" +
                "• Google Pay\n" +
                "• Shop Pay\n\n" +
                "All payments are processed securely with 256-bit SSL encryption."
      };
    }

    // Check if message requests human agent/escalation
    const humanPatterns = [
      'speak to human', 'human agent', 'representative', 'agent', 'manager', 
      'complaint', 'frustrated', 'angry', 'terrible', 'awful', 'disappointed',
      'escalate', 'supervisor', 'person', 'real person'
    ];

    if (humanPatterns.some(pattern => lowerMessage.includes(pattern))) {
      return {
        message: "I understand you'd like to speak with a human agent. I'll connect you right away! Please provide your email address so our team can follow up with you within 2 hours:",
        requiresInput: true,
        inputType: 'email',
        escalateToHuman: true,
        nextStep: 'human_escalation'
      };
    }

    // Default helpful response
    return {
      message: "I'd be happy to help! I can assist you with:\n\n" +
              "• Order tracking and status updates\n" +
              "• Shipping information and options\n" +
              "• Returns and exchanges\n" +
              "• Payment methods and billing questions\n" +
              "• Product information\n\n" +
              "What specific question can I help you with today?"
    };
  }

  private async handleOrderInquiry(sessionId: string, orderNumber: string): Promise<ChatbotResponse> {
    // Validate order number format
    if (!orderNumber.match(/^#?\w{6,}/)) {
      return {
        message: "That doesn't look like a valid order number. Order numbers usually start with # and contain letters and numbers. Please try again:",
        requiresInput: true,
        inputType: 'order_number'
      };
    }

    // Here you would integrate with Shopify/Stripe API
    const orderStatus = await this.checkOrderStatus(orderNumber);
    
    if (!orderStatus) {
      return {
        message: "I couldn't find an order with that number. Please double-check and try again, or contact our support team if you continue having issues.",
      };
    }

    return {
      message: `Order ${orderNumber} Status: ${orderStatus.status}\n` +
               `Tracking: ${orderStatus.tracking || 'Not yet shipped'}\n` +
               `Expected delivery: ${orderStatus.expectedDelivery || 'TBD'}`
    };
  }

  private async handleReturnProcess(sessionId: string, message: string, context: any): Promise<ChatbotResponse> {
    if (!context.orderNumber) {
      // First step: collect order number
      return {
        message: "I'll help you process a return. First, please provide your order number:",
        requiresInput: true,
        inputType: 'order_number',
        nextStep: 'return_order_number'
      };
    }

    if (!context.productName) {
      // Second step: collect product name
      return {
        message: "What product would you like to return?",
        requiresInput: true,
        inputType: 'product_name',
        nextStep: 'return_product'
      };
    }

    if (!context.returnReason) {
      // Third step: collect return reason
      return {
        message: "What's the reason for your return? (e.g., defective, wrong size, didn't like it, etc.)",
        requiresInput: true,
        inputType: 'return_reason',
        nextStep: 'return_reason'
      };
    }

    // Generate return authorization
    const authNumber = generateReturnAuthNumber();

    return {
      message: `Return request submitted successfully!\n\n` +
               `Return Authorization Number: ${authNumber}\n` +
               `Order Number: ${context.orderNumber}\n` +
               `Product: ${context.productName}\n\n` +
               `Please include this authorization number with your return package. ` +
               `You'll receive return instructions via email within 24 hours.`
    };
  }

  private async handleEmailCollection(sessionId: string, email: string): Promise<ChatbotResponse> {
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      return {
        message: "That doesn't look like a valid email address. Please try again:",
        requiresInput: true,
        inputType: 'email'
      };
    }

    return {
      message: `Thank you! I've escalated your inquiry to our human support team. ` +
               `They'll contact you at ${email} within 2 hours during business hours ` +
               `(9 AM - 6 PM EST, Monday-Friday). Is there anything else I can help you with in the meantime?`
    };
  }

  private async generateAIResponse(sessionId: string, message: string): Promise<ChatbotResponse> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: `You are a helpful customer service chatbot for an e-commerce website. 
                     Be friendly, professional, and concise. If you can't help with something specific, 
                     offer to escalate to a human agent. Keep responses under 100 words.
                     
                     Available services:
                     - Order tracking (ask for order number)
                     - Return requests (guide through process)
                     - General FAQ about shipping, returns, payments
                     - Escalation to human agents`
          },
          {
            role: "user",
            content: message
          }
        ]
      });

      return {
        message: response.choices[0].message.content || "I'm sorry, I didn't understand that. Could you please rephrase your question?"
      };
    } catch (error) {
      console.error('OpenAI API error:', error);
      return {
        message: "I'm having trouble processing your request right now. Would you like me to connect you with a human agent?",
        escalateToHuman: true
      };
    }
  }

  private async checkOrderStatus(orderNumber: string) {
    // This would integrate with Shopify/Stripe API
    // For now, return mock data
    const mockStatuses = ['Processing', 'Shipped', 'Delivered', 'Cancelled'];
    const mockStatus = mockStatuses[Math.floor(Math.random() * mockStatuses.length)];
    
    return {
      status: mockStatus,
      tracking: mockStatus === 'Shipped' ? '1Z999AA1234567890' : null,
      expectedDelivery: mockStatus === 'Shipped' ? 'Dec 28, 2024' : null
    };
  }

  async createSession(sessionId: string): Promise<void> {
    // Basic session tracking without database dependencies
    console.log(`Created session: ${sessionId}`);
  }

  async updateGDPRConsent(sessionId: string, consent: boolean): Promise<void> {
    // Basic consent tracking without database dependencies  
    console.log(`Updated GDPR consent for ${sessionId}: ${consent}`);
  }
}

export const chatbotService = new ChatbotService();