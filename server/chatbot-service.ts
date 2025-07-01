import OpenAI from "openai";
import { storage } from "./storage";
import { generateReturnAuthNumber } from "./utils";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface ChatbotResponse {
  message: string;
  requiresInput?: boolean;
  inputType?: 'order_number' | 'email' | 'product_name' | 'return_reason';
  nextStep?: string;
  escalateToHuman?: boolean;
}

export class ChatbotService {
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
    // Log the message
    await storage.createChatMessage({
      session_id: sessionId,
      sender: 'user',
      message: message,
      message_type: 'text'
    });

    // Track analytics
    await storage.createAnalyticsEvent({
      session_id: sessionId,
      event_type: 'message_sent',
      event_data: { message_length: message.length, has_context: !!context }
    });

    let response: ChatbotResponse;

    // Handle different conversation states
    if (context?.awaitingOrderNumber) {
      response = await this.handleOrderInquiry(sessionId, message);
    } else if (context?.awaitingReturnInfo) {
      response = await this.handleReturnProcess(sessionId, message, context);
    } else if (context?.awaitingEmail) {
      response = await this.handleEmailCollection(sessionId, message);
    } else {
      response = await this.handleGeneralInquiry(sessionId, message);
    }

    // Log bot response
    await storage.createChatMessage({
      session_id: sessionId,
      sender: 'bot',
      message: response.message,
      message_type: response.inputType || 'text'
    });

    return response;
  }

  private async handleGeneralInquiry(sessionId: string, message: string): Promise<ChatbotResponse> {
    const lowerMessage = message.toLowerCase();

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

        return {
          message: faq.responses.join(' ')
        };
      }
    }

    // Check if message seems complex or frustrated
    const complexPatterns = [
      'speak to human', 'representative', 'agent', 'manager', 'complaint',
      'frustrated', 'angry', 'terrible', 'awful', 'disappointed'
    ];

    if (complexPatterns.some(pattern => lowerMessage.includes(pattern))) {
      return {
        message: "I understand you'd like to speak with a human agent. I'll connect you right away! Please provide your email address so our team can follow up:",
        requiresInput: true,
        inputType: 'email',
        escalateToHuman: true,
        nextStep: 'human_escalation'
      };
    }

    // Use OpenAI for more complex queries
    return await this.generateAIResponse(sessionId, message);
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
    
    await storage.createReturnRequest({
      session_id: sessionId,
      order_number: context.orderNumber,
      product_name: context.productName,
      return_reason: message,
      authorization_number: authNumber,
      user_email: context.userEmail
    });

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

    // Update session with email and escalation flag
    await storage.updateChatSession(sessionId, {
      user_email: email,
      escalated_to_human: true
    });

    await storage.createAnalyticsEvent({
      session_id: sessionId,
      event_type: 'escalation',
      event_data: { reason: 'user_request', email: email }
    });

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
    await storage.createChatSession({
      session_id: sessionId,
      gdpr_consent: false
    });

    await storage.createAnalyticsEvent({
      session_id: sessionId,
      event_type: 'session_start',
      event_data: { timestamp: new Date() }
    });
  }

  async updateGDPRConsent(sessionId: string, consent: boolean): Promise<void> {
    await storage.updateChatSession(sessionId, {
      gdpr_consent: consent
    });
  }
}

export const chatbotService = new ChatbotService();