import { Handle, Position, NodeProps } from 'reactflow';
import { Brain, Settings } from 'lucide-react';

interface GPTNodeData {
  label?: string;
  model?: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
}

export default function GPTNode({ data, selected }: NodeProps<GPTNodeData>) {
  return (
    <div className={`bg-white shadow-lg rounded-lg overflow-hidden transition-shadow duration-200 ${selected ? 'ring-2 ring-green-500' : 'border border-gray-200'}`}>
      <div className="bg-green-500 h-2 w-full"></div>
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 rounded bg-green-100 flex items-center justify-center">
              <Brain className="h-3 w-3 text-green-600" />
            </div>
            <h4 className="font-medium text-gray-900">{data.label || 'GPT-4 Processor'}</h4>
          </div>
          <button className="text-gray-400 hover:text-gray-600">
            <Settings className="h-4 w-4" />
          </button>
        </div>
        
        <div className="space-y-3 text-xs text-gray-500">
          <div className="flex justify-between">
            <span>Model:</span>
            <span className="font-medium">{data.model || 'gpt-4'}</span>
          </div>
          
          {data.systemPrompt && (
            <div>
              <span className="block mb-1">System Prompt:</span>
              <p className="bg-gray-50 p-2 rounded text-gray-600 line-clamp-2">{data.systemPrompt}</p>
            </div>
          )}
          
          <div className="flex justify-between">
            <span>Temperature:</span>
            <span className="font-medium">{data.temperature || 0.7}</span>
          </div>
          
          <div className="flex justify-between">
            <span>Max Tokens:</span>
            <span className="font-medium">{data.maxTokens || 1000}</span>
          </div>
        </div>
      </div>
      
      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        className="w-3 h-3 bg-green-500 border-2 border-white"
      />
      
      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        className="w-3 h-3 bg-green-500 border-2 border-white"
      />
    </div>
  );
}
