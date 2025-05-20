import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

export default function SimpleTest() {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const runAITest = async () => {
    if (!prompt.trim()) {
      toast({
        title: 'Empty Prompt',
        description: 'Please enter a prompt to test the AI',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    setResponse('');

    try {
      // Call our direct test API endpoint
      const result = await apiRequest('/api/direct-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      }).then(res => res.json());

      if (!result.success) {
        throw new Error(result.error || 'Failed to generate response');
      }

      setResponse(result.output);
    } catch (error) {
      console.error('AI test error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive'
      });
      setResponse('Error: Failed to generate a response. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-8 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
        AI Quick Test
      </h1>
      
      <div className="grid gap-8 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Test AI Response</CardTitle>
            <CardDescription>
              Enter a prompt and see how the AI responds
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div>
              <Textarea
                placeholder="Enter your prompt (e.g., 'Write a blog post about artificial intelligence')"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="min-h-24"
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={runAITest} 
              disabled={isLoading || !prompt.trim()}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Generate Response'
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>AI Response</CardTitle>
          <CardDescription>
            The AI-generated content will appear here
          </CardDescription>
        </CardHeader>
        <Separator />
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Generating content...</span>
            </div>
          ) : response ? (
            <div className="whitespace-pre-wrap bg-muted p-4 rounded-md">
              {response}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-10">
              No response yet. Generate content to see results.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}