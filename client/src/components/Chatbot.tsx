import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { MessageCircle, X, Send, User, Bot, ExternalLink } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface Message {
  id: string;
  sender: 'user' | 'bot';
  message: string;
  timestamp: Date;
  messageType?: string;
}

interface ChatbotResponse {
  message: string;
  requiresInput?: boolean;
  inputType?: 'order_number' | 'email' | 'product_name' | 'return_reason';
  nextStep?: string;
  escalateToHuman?: boolean;
}

interface ChatbotProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default function Chatbot({ isOpen, onToggle }: ChatbotProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showGDPRConsent, setShowGDPRConsent] = useState(false);
  const [gdprConsent, setGdprConsent] = useState<boolean | null>(null);
  const [conversationContext, setConversationContext] = useState<any>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && !sessionId) {
      initializeSession();
    }
  }, [isOpen]);

  const initializeSession = async () => {
    try {
      const response = await apiRequest('POST', '/api/chatbot/session', {});
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      setSessionId(data.sessionId);
      setShowGDPRConsent(data.requiresGDPR || true);
      
      addMessage('bot', data.message || "Hello! I'm here to help you with orders, returns, shipping, and any other questions. How can I assist you today?");
    } catch (error) {
      console.error('Failed to initialize session:', error);
      
      // Create fallback session
      const fallbackSessionId = `fallback_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      setSessionId(fallbackSessionId);
      setShowGDPRConsent(true);
      addMessage('bot', "Hello! I'm here to help you with orders, returns, shipping, and any other questions. How can I assist you today?");
    }
  };

  const handleGDPRConsent = async (consent: boolean) => {
    if (!sessionId) return;

    try {
      const response = await apiRequest('POST', '/api/chatbot/consent', {
        sessionId,
        consent
      });
      
      if (response.ok) {
        const data = await response.json();
        
        setGdprConsent(consent);
        setShowGDPRConsent(false);
        addMessage('bot', data.message);
      } else {
        throw new Error('Failed to update consent');
      }
    } catch (error) {
      console.error('Failed to update consent:', error);
      // Fallback - proceed anyway
      setGdprConsent(consent);
      setShowGDPRConsent(false);
      addMessage('bot', consent 
        ? "Thank you for your consent. How can I help you today?" 
        : "I understand. I can still help with general questions.");
    }
  };

  const addMessage = (sender: 'user' | 'bot', message: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      sender,
      message,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const sendMessage = async () => {
    if (!currentMessage.trim() || !sessionId || isLoading) return;

    const userMessage = currentMessage.trim();
    setCurrentMessage('');
    setIsLoading(true);

    addMessage('user', userMessage);

    try {
      const response = await apiRequest('POST', '/api/chatbot/message', {
        sessionId,
        message: userMessage,
        context: conversationContext
      });
      
      const data: ChatbotResponse = await response.json();
      
      addMessage('bot', data.message);

      // Update conversation context based on response
      if (data.nextStep) {
        setConversationContext(prev => ({
          ...prev,
          currentStep: data.nextStep,
          awaitingInput: data.requiresInput,
          inputType: data.inputType
        }));

        // Handle specific conversation flows
        if (data.nextStep === 'order_tracking') {
          setConversationContext(prev => ({ ...prev, awaitingOrderNumber: true }));
        } else if (data.nextStep === 'return_order_number') {
          setConversationContext(prev => ({ ...prev, awaitingReturnInfo: true }));
        } else if (data.nextStep === 'return_product') {
          setConversationContext(prev => ({ 
            ...prev, 
            orderNumber: userMessage,
            awaitingReturnInfo: true 
          }));
        } else if (data.nextStep === 'return_reason') {
          setConversationContext(prev => ({ 
            ...prev, 
            productName: userMessage,
            awaitingReturnInfo: true 
          }));
        } else if (data.nextStep === 'human_escalation') {
          setConversationContext(prev => ({ ...prev, awaitingEmail: true }));
        }
      } else {
        // Reset context if no next step
        setConversationContext({});
      }

    } catch (error) {
      console.error('Failed to send message:', error);
      addMessage('bot', "I'm sorry, I'm having technical difficulties. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getInputPlaceholder = () => {
    if (conversationContext.inputType === 'order_number') {
      return 'Enter your order number (e.g., #ABC123456)';
    } else if (conversationContext.inputType === 'email') {
      return 'Enter your email address';
    } else if (conversationContext.inputType === 'product_name') {
      return 'Enter the product name';
    } else if (conversationContext.inputType === 'return_reason') {
      return 'Describe the reason for return';
    }
    return 'Type your message...';
  };

  if (!isOpen) {
    return (
      <Button
        onClick={onToggle}
        className="fixed bottom-4 right-4 rounded-full w-14 h-14 shadow-lg hover:shadow-xl transition-shadow z-50"
        size="lg"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-4 right-4 w-96 h-[600px] shadow-xl z-50 flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold">Customer Support</CardTitle>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
            Online
          </Badge>
          <Button variant="ghost" size="sm" onClick={onToggle}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <Separator />

      <CardContent className="flex-1 flex flex-col p-0">
        {showGDPRConsent && (
          <div className="p-4 bg-blue-50 border-b">
            <p className="text-sm text-gray-700 mb-3">
              To provide personalized assistance with orders and returns, we need your consent to collect and process your personal data in accordance with GDPR.
            </p>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                onClick={() => handleGDPRConsent(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                I Consent
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => handleGDPRConsent(false)}
                className="border-gray-300 hover:bg-gray-50"
              >
                Decline
              </Button>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[300px]">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.sender === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                <div className="flex items-start gap-2">
                  {message.sender === 'bot' && <Bot className="h-4 w-4 mt-0.5 flex-shrink-0" />}
                  {message.sender === 'user' && <User className="h-4 w-4 mt-0.5 flex-shrink-0" />}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                    <p className={`text-xs mt-1 opacity-70`}>
                      {formatTime(message.timestamp)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-lg p-3 max-w-[80%]">
                <div className="flex items-center gap-2">
                  <Bot className="h-4 w-4" />
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Section - Always visible */}
        <div className="border-t bg-white p-4">
          <div className="flex gap-2">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(e)}
              placeholder="Type your message..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button 
              onClick={handleSendMessage} 
              disabled={isLoading || !inputMessage.trim()}
              size="sm"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        <Separator />
        
        <div className="p-4 bg-white">
          <div className="flex gap-2">
            <Input
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={getInputPlaceholder()}
              disabled={isLoading || showGDPRConsent}
              className="flex-1"
            />
            <Button 
              onClick={sendMessage} 
              disabled={isLoading || !currentMessage.trim() || showGDPRConsent}
              size="sm"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          
          <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
            <span>Powered by AI • Available 24/7</span>
            {gdprConsent && (
              <Badge variant="outline" className="text-xs">
                GDPR Compliant
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}