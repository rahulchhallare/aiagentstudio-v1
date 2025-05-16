import { useState, useEffect } from 'react';
import { Node } from 'reactflow';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { GPTNodeData, InputNodeData, OutputNodeData } from '@/lib/types';

interface PropertiesPanelProps {
  selectedNode: Node | null;
  updateNode: (node: Node) => void;
}

export default function PropertiesPanel({ selectedNode, updateNode }: PropertiesPanelProps) {
  const [nodeData, setNodeData] = useState<any>(null);

  useEffect(() => {
    if (selectedNode) {
      setNodeData({ ...selectedNode.data });
    } else {
      setNodeData(null);
    }
  }, [selectedNode]);

  if (!selectedNode || !nodeData) {
    return (
      <div className="p-4 text-center">
        <div className="flex flex-col items-center justify-center h-40">
          <div className="text-gray-400 mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9.5 7L13.5 12L9.5 17"></path>
              <path d="M17 13.5L13 8.5L17 3.5"></path>
            </svg>
          </div>
          <p className="text-gray-500">Select a node to edit its properties</p>
        </div>
      </div>
    );
  }

  const handleChange = (key: string, value: any) => {
    const updatedData = { ...nodeData, [key]: value };
    setNodeData(updatedData);
    
    if (selectedNode) {
      const updatedNode = {
        ...selectedNode,
        data: updatedData
      };
      updateNode(updatedNode);
    }
  };

  // Render different properties based on node type
  switch (selectedNode.type) {
    case 'inputNode':
      return renderInputNodeProperties(nodeData as InputNodeData, handleChange);
    case 'gptNode':
      return renderGPTNodeProperties(nodeData as GPTNodeData, handleChange);
    case 'outputNode':
      return renderOutputNodeProperties(nodeData as OutputNodeData, handleChange);
    default:
      return (
        <div className="p-4">
          <h3 className="text-lg font-medium mb-4">Properties</h3>
          <p className="text-gray-500">No editable properties for this node type</p>
        </div>
      );
  }
}

function renderInputNodeProperties(data: InputNodeData, handleChange: (key: string, value: any) => void) {
  return (
    <div className="p-4">
      <h3 className="text-lg font-medium mb-4">Input Properties</h3>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="input-label">Label</Label>
          <Input
            id="input-label"
            value={data.label || ''}
            onChange={(e) => handleChange('label', e.target.value)}
            placeholder="Enter input label"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="input-placeholder">Placeholder</Label>
          <Input
            id="input-placeholder"
            value={data.placeholder || ''}
            onChange={(e) => handleChange('placeholder', e.target.value)}
            placeholder="Enter input placeholder"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="input-description">Description</Label>
          <Textarea
            id="input-description"
            value={data.description || ''}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="Enter description text"
            rows={3}
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <Switch
            id="input-required"
            checked={data.required || false}
            onCheckedChange={(checked) => handleChange('required', checked)}
          />
          <Label htmlFor="input-required">Required field</Label>
        </div>
      </div>
    </div>
  );
}

function renderGPTNodeProperties(data: GPTNodeData, handleChange: (key: string, value: any) => void) {
  return (
    <div className="p-4">
      <h3 className="text-lg font-medium mb-4">GPT Properties</h3>
      
      <Tabs defaultValue="basic">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="basic">Basic</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>
        
        <TabsContent value="basic" className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="gpt-label">Label</Label>
            <Input
              id="gpt-label"
              value={data.label || ''}
              onChange={(e) => handleChange('label', e.target.value)}
              placeholder="Enter GPT block label"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="gpt-model">Model</Label>
            <Select
              value={data.model || 'gpt-4o'}
              onValueChange={(value) => handleChange('model', value)}
            >
              <SelectTrigger id="gpt-model">
                <SelectValue placeholder="Select model" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gpt-4o">GPT-4o (Newest)</SelectItem>
                <SelectItem value="gpt-4">GPT-4</SelectItem>
                <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">The newest OpenAI model is "gpt-4o" which was released May 13, 2024.</p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="gpt-system-prompt">System Prompt</Label>
            <Textarea
              id="gpt-system-prompt"
              value={data.systemPrompt || ''}
              onChange={(e) => handleChange('systemPrompt', e.target.value)}
              placeholder="You are a helpful AI assistant..."
              rows={5}
            />
            <p className="text-xs text-gray-500">Define the AI's persona and behavior</p>
          </div>
        </TabsContent>
        
        <TabsContent value="advanced" className="space-y-4 pt-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="gpt-temperature">Temperature: {data.temperature || 0.7}</Label>
            </div>
            <Slider
              id="gpt-temperature"
              min={0}
              max={1}
              step={0.1}
              value={[data.temperature || 0.7]}
              onValueChange={(value) => handleChange('temperature', value[0])}
            />
            <p className="text-xs text-gray-500">Controls randomness: 0 is deterministic, 1 is creative</p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="gpt-max-tokens">Max Tokens</Label>
            <Input
              id="gpt-max-tokens"
              type="number"
              value={data.maxTokens || 500}
              onChange={(e) => handleChange('maxTokens', parseInt(e.target.value))}
              min={50}
              max={4000}
            />
            <p className="text-xs text-gray-500">Maximum length of the generated response</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function renderOutputNodeProperties(data: OutputNodeData, handleChange: (key: string, value: any) => void) {
  return (
    <div className="p-4">
      <h3 className="text-lg font-medium mb-4">Output Properties</h3>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="output-label">Label</Label>
          <Input
            id="output-label"
            value={data.label || ''}
            onChange={(e) => handleChange('label', e.target.value)}
            placeholder="Enter output label"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="output-format">Output Format</Label>
          <Select
            value={data.format || 'plaintext'}
            onValueChange={(value: 'plaintext' | 'markdown' | 'html') => handleChange('format', value)}
          >
            <SelectTrigger id="output-format">
              <SelectValue placeholder="Select format" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="plaintext">Plain Text</SelectItem>
              <SelectItem value="markdown">Markdown</SelectItem>
              <SelectItem value="html">HTML</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-gray-500">How the output should be displayed</p>
        </div>
      </div>
    </div>
  );
}