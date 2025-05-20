import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from '@/hooks/use-toast';
import { Loader2, AlertCircle, Sparkles, Copy } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

export default function AgentTester() {
  const [deployId, setDeployId] = useState('');
  const [userInput, setUserInput] = useState('');
  const [output, setOutput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingAgent, setIsCreatingAgent] = useState(false);
  const [testAgent, setTestAgent] = useState<{
    id: number;
    name: string;
    description: string;
    deploy_id: string;
    deploy_url: string;
  } | null>(null);

  // Function to create a test agent
  const createTestAgent = async () => {
    setIsCreatingAgent(true);
    setTestAgent(null);
    
    try {
      const response = await apiRequest('/api/test-agent/create', {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to create test agent');
      }
      
      const data = await response.json();
      setTestAgent(data.agent);
      setDeployId(data.agent.deploy_id);
      
      toast({
        title: 'Test Agent Created',
        description: `Agent "${data.agent.name}" is ready to use with ID: ${data.agent.deploy_id}`,
      });
    } catch (error) {
      console.error('Error creating test agent:', error);
      toast({
        title: 'Creation Error',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive'
      });
    } finally {
      setIsCreatingAgent(false);
    }
  };
  
  // Function to copy text to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied',
      description: 'Copied to clipboard',
    });
  };
  
  const runAgent = async () => {
    if (!deployId.trim()) {
      toast({
        title: 'Missing Deploy ID',
        description: 'Please enter a valid deployment ID',
        variant: 'destructive'
      });
      return;
    }

    if (!userInput.trim()) {
      toast({
        title: 'Missing Input',
        description: 'Please enter some input for the agent',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    setOutput('');

    try {
      // Call our execute API endpoint
      const response = await apiRequest(`/api/agent/${deployId}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ input: userInput })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to execute agent');
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Agent execution failed');
      }

      setOutput(result.output || 'No output returned');
      toast({
        title: 'Agent Executed Successfully',
        description: 'Check the output below',
      });

    } catch (error) {
      console.error('Error running agent:', error);
      toast({
        title: 'Execution Error',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive'
      });
      setOutput(error instanceof Error ? `Error: ${error.message}` : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-8 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
        AI Agent Tester
      </h1>
      
      <div className="grid gap-8 lg:grid-cols-2 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Create a Test Agent</CardTitle>
            <CardDescription>
              Generate a pre-configured AI agent that's ready to use
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Click the button below to create a demo agent with our Content Creation Assistant template.
              The agent has a basic Input → GPT → Output workflow that's ready to test.
            </p>
            
            {testAgent && (
              <Alert className="mb-4">
                <Sparkles className="h-4 w-4" />
                <AlertTitle className="text-sm">Test Agent Ready!</AlertTitle>
                <AlertDescription className="text-xs">
                  <div className="mt-2 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">Name:</span>
                      <span>{testAgent.name}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">Deploy ID:</span>
                      <div className="flex items-center">
                        <code className="bg-muted px-1 rounded text-xs">{testAgent.deploy_id}</code>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 w-6 p-0 ml-1"
                          onClick={() => copyToClipboard(testAgent.deploy_id)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs mt-1">This ID has been automatically added to the input field below</p>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter>
            <Button 
              onClick={createTestAgent} 
              disabled={isCreatingAgent}
              className="w-full"
              variant="outline"
            >
              {isCreatingAgent ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Test Agent...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Create Test Agent
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Test Your Deployed Agent</CardTitle>
            <CardDescription>
              Enter a deployment ID and input to test how your agent responds
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label htmlFor="deployId" className="block text-sm font-medium mb-1">
                  Agent Deployment ID
                </label>
                <Input
                  id="deployId"
                  value={deployId}
                  onChange={(e) => setDeployId(e.target.value)}
                  placeholder="Enter the agent's deployment ID"
                />
              </div>
              
              <div>
                <label htmlFor="userInput" className="block text-sm font-medium mb-1">
                  Input for the Agent
                </label>
                <Input
                  id="userInput"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder="What would you like to ask the agent?"
                />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={runAgent} 
              disabled={isLoading || !deployId.trim() || !userInput.trim()}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Running Agent...
                </>
              ) : (
                'Execute Agent'
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Agent Response</CardTitle>
          <CardDescription>
            The output from your AI agent will appear here
          </CardDescription>
        </CardHeader>
        <Separator />
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Processing your request...</span>
            </div>
          ) : output ? (
            <div className="whitespace-pre-wrap bg-muted p-4 rounded-md">
              {output}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-10">
              No output yet. Run the agent to see results.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}