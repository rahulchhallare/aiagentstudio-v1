import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Node } from 'reactflow';
import { InputNodeData, GPTNodeData, OutputNodeData, OllamaNodeData } from '@/lib/types';
import { X } from 'lucide-react';

interface PropertiesPanelProps {
  selectedNode: Node | null;
  updateNode: (node: Node) => void;
}

export default function PropertiesPanel({ selectedNode, updateNode }: PropertiesPanelProps) {
  if (!selectedNode) return null;

  // Generic handler for updating node data
  const handleChange = (key: string, value: any) => {
    if (!selectedNode) return;

    const updatedNode = {
      ...selectedNode,
      data: {
        ...selectedNode.data,
        [key]: value
      }
    };

    updateNode(updatedNode);
  };

  const handleNodeDataChange = (key: string, value: any) => {
    if (!selectedNode) return;

    updateNode({
      ...selectedNode,
      data: {
        ...selectedNode.data,
        [key]: value,
      },
    });
  };

  // Render properties based on node type
  const renderPropertiesPanel = () => {
    if (selectedNode.type === 'inputNode') {
      return renderInputNodeProperties(selectedNode.data as InputNodeData, handleChange);
    } else if (selectedNode.type === 'gptNode') {
      return renderGPTNodeProperties(selectedNode.data as GPTNodeData, handleChange);
    } else if (selectedNode.type === 'ollamaNode') {
      return renderOllamaNodeProperties(selectedNode.data as OllamaNodeData, handleChange);
    } else if (selectedNode.type === 'outputNode') {
      return renderOutputNodeProperties(selectedNode.data as OutputNodeData, handleChange);
    } else if (selectedNode.type === 'huggingFaceNode') {
      return renderHuggingFaceNodeProperties(selectedNode.data as HuggingFaceNodeData, handleChange);
    } else if (selectedNode.type === 'hfInferenceNode') {
      return renderHuggingFaceNodeProperties(selectedNode.data as HuggingFaceNodeData, handleChange);
    }

    return <div className="p-4">No properties available for this node type.</div>;
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-4 border-b flex justify-between items-center">
        <h3 className="font-medium text-lg">Node Properties</h3>
        <X className="h-5 w-5 text-gray-500 cursor-pointer" onClick={() => updateNode({ ...selectedNode, selected: false })} />
      </div>

      {renderPropertiesPanel()}
    </div>
  );
}

function renderInputNodeProperties(data: InputNodeData, handleChange: (key: string, value: any) => void) {
  return (
    <div className="p-4 space-y-4">
      <div className="space-y-2">
        <Label htmlFor="label">Label</Label>
        <Input
          id="label"
          value={data.label || ''}
          onChange={(e) => handleChange('label', e.target.value)}
          placeholder="Node Label"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="placeholder">Placeholder Text</Label>
        <Input
          id="placeholder"
          value={data.placeholder || ''}
          onChange={(e) => handleChange('placeholder', e.target.value)}
          placeholder="Enter placeholder text..."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={data.description || ''}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder="Describe this input..."
          className="resize-none"
          rows={3}
        />
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="required"
          checked={data.required || false}
          onChange={(e) => handleChange('required', e.target.checked)}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <Label htmlFor="required">Required Field</Label>
      </div>
    </div>
  );
}

function renderHuggingFaceNodeProperties(data: any, handleChange: (key: string, value: any) => void) {
  return (
    <div className="p-4 space-y-4">
      <div className="space-y-2">
        <Label htmlFor="label">Label</Label>
        <Input
          id="label"
          value={data.label || ''}
          onChange={(e) => handleChange('label', e.target.value)}
          placeholder="Node Label"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="model">Model</Label>
        <Select
          value={data.model || 'microsoft/DialoGPT-medium'}
          onValueChange={(value) => handleChange('model', value)}
        >
          <SelectTrigger id="model">
            <SelectValue placeholder="Select model" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="gpt2">GPT-2 (Recommended)</SelectItem>
            <SelectItem value="distilgpt2">DistilGPT-2</SelectItem>
            <SelectItem value="microsoft/DialoGPT-small">DialoGPT Small</SelectItem>
            <SelectItem value="facebook/blenderbot-400M-distill">BlenderBot 400M</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="systemPrompt">System Prompt</Label>
        <Textarea
          id="systemPrompt"
          value={data.systemPrompt || ''}
          onChange={(e) => handleChange('systemPrompt', e.target.value)}
          placeholder="Enter system instructions..."
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="temperature">Temperature: {data.temperature || 0.7}</Label>
        <Slider
          id="temperature"
          min={0}
          max={2}
          step={0.1}
          value={[data.temperature || 0.7]}
          onValueChange={(value) => handleChange('temperature', value[0])}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="maxTokens">Max Tokens</Label>
        <Input
          id="maxTokens"
          type="number"
          value={data.maxTokens || 1000}
          onChange={(e) => handleChange('maxTokens', parseInt(e.target.value) || 1000)}
          min={1}
          max={4000}
        />
      </div>
    </div>
  );
}

function renderGPTNodeProperties(data: GPTNodeData, handleChange: (key: string, value: any) => void) {
  return (
    <div className="p-4 space-y-4">
      <div className="space-y-2">
        <Label htmlFor="label">Label</Label>
        <Input
          id="label"
          value={data.label || ''}
          onChange={(e) => handleChange('label', e.target.value)}
          placeholder="Node Label"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="model">Model</Label>
        <Select
          value={data.model || 'gpt-4o'}
          onValueChange={(value) => handleChange('model', value)}
        >
          <SelectTrigger id="model">
            <SelectValue placeholder="Select model" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="gpt-4o">GPT-4o</SelectItem>
            <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
            <SelectItem value="claude-3-opus">Claude 3 Opus</SelectItem>
            <SelectItem value="claude-3-sonnet">Claude 3 Sonnet</SelectItem>
            <SelectItem value="gemini-pro">Gemini Pro</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="systemPrompt">System Prompt</Label>
        <Textarea
          id="systemPrompt"
          value={data.systemPrompt || ''}
          onChange={(e) => handleChange('systemPrompt', e.target.value)}
          placeholder="Enter system instructions..."
          className="resize-none"
          rows={4}
        />
      </div>

      <div className="space-y-2">
        <div className="flex justify-between">
          <Label htmlFor="temperature">Temperature: {data.temperature || 0.7}</Label>
        </div>
        <Slider
          id="temperature"
          min={0}
          max={2}
          step={0.1}
          value={[data.temperature || 0.7]}
          onValueChange={(value) => handleChange('temperature', value[0])}
          className="py-4"
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>More Precise</span>
          <span>More Creative</span>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="maxTokens">Max Tokens</Label>
        <Input
          id="maxTokens"
          type="number"
          min={1}
          max={4000}
          value={data.maxTokens || 1000}
          onChange={(e) => handleChange('maxTokens', parseInt(e.target.value, 10))}
        />
      </div>
    </div>
  );
}

function renderOllamaNodeProperties(data: OllamaNodeData, handleChange: (key: string, value: any) => void) {
  return (
    <div className="p-4 space-y-4">
      <div className="space-y-2">
        <Label htmlFor="label">Label</Label>
        <Input
          id="label"
          value={data.label || ''}
          onChange={(e) => handleChange('label', e.target.value)}
          placeholder="Node Label"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="model">Model</Label>
        <Select
          value={data.model || 'llama2'}
          onValueChange={(value) => handleChange('model', value)}
        >
          <SelectTrigger id="model">
            <SelectValue placeholder="Select model" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="llama2">Llama 2</SelectItem>
            <SelectItem value="codellama">Code Llama</SelectItem>
            <SelectItem value="mistral">Mistral</SelectItem>
            <SelectItem value="neural-chat">Neural Chat</SelectItem>
            <SelectItem value="starling-lm">Starling</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="endpoint">Endpoint</Label>
        <Input
          id="endpoint"
          value={data.endpoint || 'http://localhost:11434'}
          onChange={(e) => handleChange('endpoint', e.target.value)}
          placeholder="http://localhost:11434"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="systemPrompt">System Prompt</Label>
        <Textarea
          id="systemPrompt"
          value={data.systemPrompt || ''}
          onChange={(e) => handleChange('systemPrompt', e.target.value)}
          placeholder="Enter system instructions..."
          className="min-h-24"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="temperature">Temperature: {data.temperature || 0.7}</Label>
        <Slider
          id="temperature"
          min={0}
          max={1}
          step={0.1}
          value={[data.temperature || 0.7]}
          onValueChange={(value) => handleChange('temperature', value[0])}
        />
      </div>
    </div>
  );
}

function renderOutputNodeProperties(data: OutputNodeData, handleChange: (key: string, value: any) => void) {
  return (
    <div className="p-4 space-y-4">
      <div className="space-y-2">
        <Label htmlFor="label">Label</Label>
        <Input
          id="label"
          value={data.label || ''}
          onChange={(e) => handleChange('label', e.target.value)}
          placeholder="Node Label"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="format">Output Format</Label>
        <Select
          value={data.format || 'markdown'}
          onValueChange={(value) => handleChange('format', value)}
        >
          <SelectTrigger id="format">
            <SelectValue placeholder="Select format" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="plaintext">Plain Text</SelectItem>
            <SelectItem value="markdown">Markdown</SelectItem>
            <SelectItem value="html">HTML</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}