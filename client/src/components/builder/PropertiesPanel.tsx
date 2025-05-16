import { useState, useEffect } from 'react';
import { Brain, Settings, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Node } from 'reactflow';

interface PropertiesPanelProps {
  selectedNode: Node | null;
  updateNode: (node: Node) => void;
}

export default function PropertiesPanel({ selectedNode, updateNode }: PropertiesPanelProps) {
  const [localData, setLocalData] = useState<any>({});

  // Update local state when selected node changes
  useEffect(() => {
    if (selectedNode) {
      setLocalData({ ...selectedNode.data });
    } else {
      setLocalData({});
    }
  }, [selectedNode]);

  // Update the node data when local data changes
  const handleDataChange = (key: string, value: any) => {
    const updatedData = { ...localData, [key]: value };
    setLocalData(updatedData);
    
    if (selectedNode) {
      const updatedNode = {
        ...selectedNode,
        data: updatedData
      };
      updateNode(updatedNode);
    }
  };

  // Get node icon based on type
  const getNodeIcon = () => {
    if (!selectedNode) return null;
    
    switch (selectedNode.type) {
      case 'inputNode':
        return (
          <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded flex items-center justify-center">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              className="h-5 w-5"
            >
              <rect width="18" height="18" x="3" y="3" rx="2" />
              <path d="M7 9h10" />
              <path d="M7 13h10" />
              <path d="M7 17h10" />
            </svg>
          </div>
        );
      case 'gptNode':
        return (
          <div className="w-8 h-8 bg-green-100 text-green-600 rounded flex items-center justify-center">
            <Brain className="h-5 w-5" />
          </div>
        );
      case 'outputNode':
        return (
          <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded flex items-center justify-center">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              className="h-5 w-5"
            >
              <path d="M17.5 5v13.5" />
              <path d="M5.5 17 17 5.5" />
              <path d="M19 19H5" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 bg-gray-100 text-gray-600 rounded flex items-center justify-center">
            <Settings className="h-5 w-5" />
          </div>
        );
    }
  };

  // Render properties based on node type
  const renderNodeProperties = () => {
    if (!selectedNode) return null;
    
    switch (selectedNode.type) {
      case 'inputNode':
        return (
          <div className="space-y-4">
            <div>
              <Label className="text-xs text-gray-500 mb-1">Label</Label>
              <Input 
                value={localData.label || ''} 
                onChange={(e) => handleDataChange('label', e.target.value)} 
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
              />
            </div>
            <div>
              <Label className="text-xs text-gray-500 mb-1">Placeholder</Label>
              <Input 
                value={localData.placeholder || ''} 
                onChange={(e) => handleDataChange('placeholder', e.target.value)} 
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
              />
            </div>
            <div>
              <Label className="text-xs text-gray-500 mb-1">Description</Label>
              <Input 
                value={localData.description || ''} 
                onChange={(e) => handleDataChange('description', e.target.value)} 
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
              />
            </div>
            <div>
              <Label className="text-xs text-gray-500 mb-1">Required</Label>
              <Select 
                value={localData.required ? 'true' : 'false'} 
                onValueChange={(value) => handleDataChange('required', value === 'true')}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Yes</SelectItem>
                  <SelectItem value="false">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );
      case 'gptNode':
        return (
          <div className="space-y-4">
            <div>
              <Label className="text-xs text-gray-500 mb-1">Name</Label>
              <Input 
                value={localData.label || ''} 
                onChange={(e) => handleDataChange('label', e.target.value)} 
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
              />
            </div>
            <div>
              <Label className="text-xs text-gray-500 mb-1">Model</Label>
              <Select 
                value={localData.model || 'gpt-4'} 
                onValueChange={(value) => handleDataChange('model', value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gpt-4">GPT-4</SelectItem>
                  <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                  <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-gray-500 mb-1">System Prompt</Label>
              <Textarea 
                value={localData.systemPrompt || ''} 
                onChange={(e) => handleDataChange('systemPrompt', e.target.value)} 
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm h-20"
              />
            </div>
            <div>
              <Label className="text-xs text-gray-500 mb-1">Temperature</Label>
              <Slider
                value={[localData.temperature || 0.7]} 
                min={0} 
                max={1} 
                step={0.1} 
                onValueChange={(value) => handleDataChange('temperature', value[0])}
                className="my-4"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>0.0</span>
                <span>{localData.temperature || 0.7}</span>
                <span>1.0</span>
              </div>
            </div>
            <div>
              <Label className="text-xs text-gray-500 mb-1">Max Tokens</Label>
              <Input 
                type="number" 
                value={localData.maxTokens || 1000} 
                onChange={(e) => handleDataChange('maxTokens', Number(e.target.value))} 
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
              />
            </div>
          </div>
        );
      case 'outputNode':
        return (
          <div className="space-y-4">
            <div>
              <Label className="text-xs text-gray-500 mb-1">Label</Label>
              <Input 
                value={localData.label || ''} 
                onChange={(e) => handleDataChange('label', e.target.value)} 
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
              />
            </div>
            <div>
              <Label className="text-xs text-gray-500 mb-1">Output Format</Label>
              <Select 
                value={localData.format || 'plaintext'} 
                onValueChange={(value) => handleDataChange('format', value)}
              >
                <SelectTrigger className="w-full">
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
      default:
        return (
          <div className="text-center py-4 text-gray-500">
            No properties available for this node type.
          </div>
        );
    }
  };

  return (
    <div className="w-80 bg-white shadow-md p-4 overflow-y-auto" id="properties-panel">
      <h3 className="font-medium text-gray-900 mb-4">Properties</h3>
      
      {!selectedNode ? (
        <div id="no-selection" className="text-center py-8 text-gray-500">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className="h-12 w-12 mx-auto mb-2 text-gray-400"
          >
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <p>Select a node to edit its properties</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Node Type Header */}
          <div className="pb-3 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              {getNodeIcon()}
              <h4 className="font-medium text-gray-900">{localData.label || 'Unnamed Node'}</h4>
            </div>
          </div>
          
          {/* Node Properties */}
          {renderNodeProperties()}
        </div>
      )}
    </div>
  );
}
