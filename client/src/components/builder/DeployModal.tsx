import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Check, Copy, ExternalLink, Loader2 } from 'lucide-react';
import { FlowData } from '@/lib/types';

interface DeployModalProps {
  isOpen: boolean;
  onClose: () => void;
  agentName: string;
  agentId?: string | number;
  flowData: FlowData;
  userId: number;
  onDeploy: () => void;
}

export default function DeployModal({
  isOpen,
  onClose,
  agentName,
  agentId,
  flowData,
  userId,
  onDeploy,
}: DeployModalProps) {
  const { toast } = useToast();
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployUrl, setDeployUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Check if the agent has required nodes
  const hasInputNode = flowData.nodes.some(node => node.type?.includes('input'));
  const hasProcessingNode = flowData.nodes.some(node => 
    node.type?.includes('gpt') || 
    node.type?.includes('transform') || 
    node.type?.includes('bot'));
  const hasOutputNode = flowData.nodes.some(node => node.type?.includes('output'));
  
  const isValid = hasInputNode && hasProcessingNode && hasOutputNode;

  const handleDeploy = async () => {
    if (!isValid) return;
    
    setIsDeploying(true);
    
    try {
      // Prepare the API request
      const url = agentId ? `/api/agents/${agentId}` : '/api/agents';
      const method = agentId ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: agentName,
          flow_data: flowData,
          is_active: true,
          ...(agentId ? {} : { user_id: userId }),
          description: 'AI Agent created with AIagentStudio'
        }),
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to deploy agent');
      }
      
      const data = await response.json();
      
      // Show success toast and set the deployment URL
      if (data.deploy_url) {
        setDeployUrl(data.deploy_url);
      }
      
      // Callback to refresh agent data
      onDeploy();
      
    } catch (error) {
      console.error('Deployment error:', error);
      toast({
        title: 'Deployment failed',
        description: error instanceof Error ? error.message : 'An error occurred during deployment',
        variant: 'destructive',
      });
    } finally {
      setIsDeploying(false);
    }
  };

  const copyToClipboard = () => {
    if (deployUrl) {
      navigator.clipboard.writeText(deployUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Reset state when modal is closed
  const handleClose = () => {
    if (!isDeploying) {
      setDeployUrl(null);
      setCopied(false);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {deployUrl ? '🎉 Agent Deployed!' : 'Deploy Agent'}
          </DialogTitle>
          <DialogDescription>
            {deployUrl
              ? `Your agent "${agentName}" is now live and ready to use.`
              : 'Make your agent accessible with a shareable URL.'}
          </DialogDescription>
        </DialogHeader>

        {!deployUrl ? (
          <>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Deployment Requirements</h3>
                <ul className="text-sm space-y-1">
                  <li className={`flex items-center ${hasInputNode ? 'text-green-600' : 'text-red-600'}`}>
                    {hasInputNode ? <Check className="h-4 w-4 mr-2" /> : <span className="h-4 w-4 mr-2">✗</span>}
                    Input node
                  </li>
                  <li className={`flex items-center ${hasProcessingNode ? 'text-green-600' : 'text-red-600'}`}>
                    {hasProcessingNode ? <Check className="h-4 w-4 mr-2" /> : <span className="h-4 w-4 mr-2">✗</span>}
                    Processing node (GPT, Transformation, etc.)
                  </li>
                  <li className={`flex items-center ${hasOutputNode ? 'text-green-600' : 'text-red-600'}`}>
                    {hasOutputNode ? <Check className="h-4 w-4 mr-2" /> : <span className="h-4 w-4 mr-2">✗</span>}
                    Output node
                  </li>
                </ul>
              </div>
              
              {!isValid && (
                <div className="text-sm text-red-600 rounded-md bg-red-50 p-3">
                  Your agent needs at least one input node, one processing node, and one output node to be deployed.
                </div>
              )}
            </div>
            
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button 
                onClick={handleDeploy} 
                disabled={!isValid || isDeploying}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              >
                {isDeploying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deploying...
                  </>
                ) : (
                  'Deploy Agent'
                )}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Deployment URL</h3>
                <div className="flex items-center space-x-2">
                  <div className="border rounded-md flex-1 p-2 text-sm bg-slate-50 truncate">
                    {deployUrl}
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={copyToClipboard}
                  >
                    {copied ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              
              <div>
                <Button 
                  asChild 
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                >
                  <a href={deployUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Open Agent
                  </a>
                </Button>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Close
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}