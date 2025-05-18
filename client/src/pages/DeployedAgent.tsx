import { useState, useEffect, useRef } from 'react';
import { useParams } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/hooks/use-toast';
import { Loader2, Send, ArrowRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { Agent, FlowData } from '@/lib/types';

export default function DeployedAgent() {
  const { deployId } = useParams();
  const [userInput, setUserInput] = useState('');
  const [messages, setMessages] = useState<Array<{role: string, content: string}>>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  // Fetch the deployed agent information
  const { data: agent, isLoading, error } = useQuery({
    queryKey: [`/api/agent/${deployId}`],
    enabled: !!deployId,
  });
  
  useEffect(() => {
    // Scroll to bottom when messages change
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);
  
  // Initialize with a welcome message
  useEffect(() => {
    if (agent && !isLoading && messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: `👋 Hello! I'm ${agent.name}. How can I help you today?`
      }]);
    }
  }, [agent, isLoading, messages.length]);

  const processUserInput = async (input: string) => {
    if (!input.trim() || !agent) return;
    
    // Add user message to conversation
    setMessages(prev => [...prev, {
      role: 'user',
      content: input
    }]);
    
    setIsProcessing(true);
    
    try {
      // Find the first input and output nodes from the flow
      const flowData = agent.flow_data as FlowData;
      const inputNode = flowData.nodes.find(node => node.type.includes('input'));
      const outputNode = flowData.nodes.find(node => node.type.includes('output'));
      const processingNodes = flowData.nodes.filter(node => 
        node.type.includes('gpt') || 
        node.type.includes('transform') || 
        node.type.includes('bot'));
      
      // If we don't have required nodes, show an error
      if (!inputNode || !processingNodes.length || !outputNode) {
        throw new Error('This agent does not have a complete workflow (missing input, processing, or output nodes)');
      }
      
      // Get the main processing node (ideally the most connected one)
      const mainProcessingNode = processingNodes[0];
      
      // Simulate processing - this would be replaced with actual API calls
      // that process the user input through the agent's nodes
      setTimeout(() => {
        // Get the system prompt from the processing node
        const systemPrompt = mainProcessingNode.data.systemPrompt || 
          'You are a helpful assistant. Provide concise and accurate responses.';
        
        // Example response (in a real implementation, this would be the result of the API call)
        const response = `I've processed your request: "${input}" based on the following system instructions: "${systemPrompt}"
        
This is a simulated response. In a fully implemented system, this would be the actual result from running your input through the GPT model with the agent's configuration.

For visualization purposes, your message went through:
1. Input Node: ${inputNode.data.label || 'Input'}
2. Processing Node: ${mainProcessingNode.data.label || 'Processing'}
3. Output Node: ${outputNode.data.label || 'Output'}`;
        
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: response
        }]);
        
        setIsProcessing(false);
      }, 1500);
      
    } catch (error) {
      console.error('Error processing input:', error);
      toast({
        title: 'Processing Error',
        description: error instanceof Error ? error.message : 'Failed to process your request',
        variant: 'destructive'
      });
      setIsProcessing(false);
    }
    
    setUserInput('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    processUserInput(userInput);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-lg">Loading agent...</span>
      </div>
    );
  }

  if (error || !agent) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold text-destructive mb-4">Agent Not Found</h1>
        <p className="text-center mb-6">
          The agent you're looking for either doesn't exist or is no longer active.
        </p>
        <Button onClick={() => window.history.back()}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-background to-background/80">
      {/* Header */}
      <header className="border-b p-4 bg-card">
        <div className="container mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
              {agent.name || 'AI Agent'}
            </h1>
            {agent.description && (
              <p className="text-sm text-muted-foreground">{agent.description}</p>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={() => window.history.back()}>
            Exit
          </Button>
        </div>
      </header>
      
      {/* Chat Area */}
      <div className="flex-grow container mx-auto p-4 flex flex-col">
        <Card className="flex-grow flex flex-col h-[70vh] overflow-hidden">
          <ScrollArea className="flex-grow p-4" ref={scrollAreaRef}>
            <div className="space-y-4">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground ml-auto'
                        : 'bg-muted'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  </div>
                </div>
              ))}
              {isProcessing && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] rounded-lg p-3 bg-muted">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
          
          <form onSubmit={handleSubmit} className="p-4 border-t">
            <div className="flex space-x-2">
              <Input
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Type your message..."
                disabled={isProcessing}
                className="flex-grow"
              />
              <Button type="submit" disabled={isProcessing || !userInput.trim()}>
                {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}