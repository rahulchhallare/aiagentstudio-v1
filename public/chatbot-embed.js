(function() {
  'use strict';

  // Default configuration
  const defaultConfig = {
    apiUrl: window.location.origin,
    theme: 'light',
    position: 'bottom-right',
    primaryColor: '#3b82f6',
    fontFamily: 'system-ui, -apple-system, sans-serif'
  };

  // Merge user config with defaults
  const config = Object.assign(defaultConfig, window.chatbotConfig || {});

  // Prevent multiple instances
  if (window.EcommerceChatbot) {
    return;
  }

  class EcommerceChatbot {
    constructor() {
      this.isOpen = false;
      this.sessionId = null;
      this.messages = [];
      this.conversationContext = {};
      this.gdprConsent = null;
      this.init();
    }

    init() {
      this.createStyles();
      this.createChatbotHTML();
      this.attachEventListeners();
    }

    createStyles() {
      const style = document.createElement('style');
      style.textContent = `
        #ecommerce-chatbot {
          position: fixed;
          ${config.position.includes('right') ? 'right: 20px;' : 'left: 20px;'}
          ${config.position.includes('bottom') ? 'bottom: 20px;' : 'top: 20px;'}
          z-index: 10000;
          font-family: ${config.fontFamily};
        }
        
        #chatbot-toggle {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: ${config.primaryColor};
          border: none;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        #chatbot-toggle:hover {
          transform: scale(1.05);
          box-shadow: 0 6px 16px rgba(0,0,0,0.2);
        }
        
        #chatbot-toggle svg {
          width: 24px;
          height: 24px;
          fill: white;
        }
        
        #chatbot-widget {
          width: 350px;
          height: 500px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.15);
          display: none;
          flex-direction: column;
          overflow: hidden;
        }
        
        #chatbot-header {
          background: ${config.primaryColor};
          color: white;
          padding: 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        #chatbot-header h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
        }
        
        #chatbot-close {
          background: none;
          border: none;
          color: white;
          cursor: pointer;
          font-size: 20px;
          padding: 0;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        #chatbot-messages {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          background: #fafafa;
        }
        
        .message {
          margin-bottom: 12px;
          display: flex;
          align-items: flex-end;
          gap: 8px;
        }
        
        .message.user {
          justify-content: flex-end;
        }
        
        .message-bubble {
          max-width: 80%;
          padding: 10px 14px;
          border-radius: 18px;
          font-size: 14px;
          line-height: 1.4;
        }
        
        .message.bot .message-bubble {
          background: white;
          border: 1px solid #e5e7eb;
        }
        
        .message.user .message-bubble {
          background: ${config.primaryColor};
          color: white;
        }
        
        #chatbot-input-area {
          padding: 16px;
          border-top: 1px solid #e5e7eb;
          background: white;
        }
        
        #chatbot-input-container {
          display: flex;
          gap: 8px;
          align-items: center;
        }
        
        #chatbot-input {
          flex: 1;
          padding: 10px 12px;
          border: 1px solid #d1d5db;
          border-radius: 20px;
          font-size: 14px;
          outline: none;
        }
        
        #chatbot-input:focus {
          border-color: ${config.primaryColor};
        }
        
        #chatbot-send {
          background: ${config.primaryColor};
          border: none;
          border-radius: 50%;
          width: 36px;
          height: 36px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        #chatbot-send svg {
          width: 16px;
          height: 16px;
          fill: white;
        }
        
        .gdpr-consent {
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          border-radius: 8px;
          padding: 12px;
          margin-bottom: 12px;
          font-size: 13px;
        }
        
        .gdpr-buttons {
          display: flex;
          gap: 8px;
          margin-top: 8px;
        }
        
        .gdpr-button {
          padding: 6px 12px;
          border: none;
          border-radius: 4px;
          font-size: 12px;
          cursor: pointer;
        }
        
        .gdpr-accept {
          background: ${config.primaryColor};
          color: white;
        }
        
        .gdpr-decline {
          background: #6b7280;
          color: white;
        }
      `;
      document.head.appendChild(style);
    }

    createChatbotHTML() {
      const chatbotHTML = `
        <div id="ecommerce-chatbot">
          <button id="chatbot-toggle">
            <svg viewBox="0 0 24 24">
              <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
            </svg>
          </button>
          
          <div id="chatbot-widget">
            <div id="chatbot-header">
              <h3>Customer Support</h3>
              <button id="chatbot-close">×</button>
            </div>
            
            <div id="chatbot-messages"></div>
            
            <div id="chatbot-input-area">
              <div id="chatbot-input-container">
                <input type="text" id="chatbot-input" placeholder="Type your message..." />
                <button id="chatbot-send">
                  <svg viewBox="0 0 24 24">
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
      
      document.body.insertAdjacentHTML('beforeend', chatbotHTML);
    }

    attachEventListeners() {
      const toggle = document.getElementById('chatbot-toggle');
      const close = document.getElementById('chatbot-close');
      const input = document.getElementById('chatbot-input');
      const send = document.getElementById('chatbot-send');

      toggle.addEventListener('click', () => this.toggleChatbot());
      close.addEventListener('click', () => this.closeChatbot());
      send.addEventListener('click', () => this.sendMessage());
      
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.sendMessage();
        }
      });
    }

    async toggleChatbot() {
      if (this.isOpen) {
        this.closeChatbot();
      } else {
        await this.openChatbot();
      }
    }

    async openChatbot() {
      this.isOpen = true;
      document.getElementById('chatbot-widget').style.display = 'flex';
      document.getElementById('chatbot-toggle').style.display = 'none';
      
      if (!this.sessionId) {
        await this.initializeSession();
      }
    }

    closeChatbot() {
      this.isOpen = false;
      document.getElementById('chatbot-widget').style.display = 'none';
      document.getElementById('chatbot-toggle').style.display = 'flex';
    }

    async initializeSession() {
      try {
        const response = await fetch(`${config.apiUrl}/api/chatbot/session`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        
        const data = await response.json();
        this.sessionId = data.sessionId;
        
        this.addMessage('bot', data.message);
        
        if (data.requiresGDPR) {
          this.showGDPRConsent();
        }
      } catch (error) {
        console.error('Failed to initialize chatbot session:', error);
        this.addMessage('bot', "I'm having trouble connecting. Please refresh and try again.");
      }
    }

    showGDPRConsent() {
      const consentHTML = `
        <div class="gdpr-consent">
          To provide personalized assistance with orders and returns, we need your consent to collect and process your personal data in accordance with GDPR.
          <div class="gdpr-buttons">
            <button class="gdpr-button gdpr-accept" onclick="window.EcommerceChatbot.handleGDPRConsent(true)">I Consent</button>
            <button class="gdpr-button gdpr-decline" onclick="window.EcommerceChatbot.handleGDPRConsent(false)">Decline</button>
          </div>
        </div>
      `;
      
      document.getElementById('chatbot-messages').insertAdjacentHTML('beforeend', consentHTML);
      this.scrollToBottom();
    }

    async handleGDPRConsent(consent) {
      try {
        const response = await fetch(`${config.apiUrl}/api/chatbot/consent`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: this.sessionId, consent })
        });
        
        const data = await response.json();
        this.gdprConsent = consent;
        
        // Remove consent UI
        const consentDiv = document.querySelector('.gdpr-consent');
        if (consentDiv) {
          consentDiv.remove();
        }
        
        this.addMessage('bot', data.message);
      } catch (error) {
        console.error('Failed to update consent:', error);
      }
    }

    async sendMessage() {
      const input = document.getElementById('chatbot-input');
      const message = input.value.trim();
      
      if (!message || !this.sessionId) return;
      
      input.value = '';
      this.addMessage('user', message);
      
      try {
        const response = await fetch(`${config.apiUrl}/api/chatbot/message`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: this.sessionId,
            message: message,
            context: this.conversationContext
          })
        });
        
        const data = await response.json();
        this.addMessage('bot', data.message);
        
        // Update conversation context
        if (data.nextStep) {
          this.conversationContext = {
            ...this.conversationContext,
            currentStep: data.nextStep,
            awaitingInput: data.requiresInput,
            inputType: data.inputType
          };
        } else {
          this.conversationContext = {};
        }
        
      } catch (error) {
        console.error('Failed to send message:', error);
        this.addMessage('bot', "I'm sorry, I'm having technical difficulties. Please try again.");
      }
    }

    addMessage(sender, message) {
      const messagesContainer = document.getElementById('chatbot-messages');
      const messageHTML = `
        <div class="message ${sender}">
          <div class="message-bubble">${message}</div>
        </div>
      `;
      
      messagesContainer.insertAdjacentHTML('beforeend', messageHTML);
      this.scrollToBottom();
    }

    scrollToBottom() {
      const messagesContainer = document.getElementById('chatbot-messages');
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }

  // Initialize chatbot when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.EcommerceChatbot = new EcommerceChatbot();
    });
  } else {
    window.EcommerceChatbot = new EcommerceChatbot();
  }
})();