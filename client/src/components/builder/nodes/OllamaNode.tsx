
import { Handle, Position } from 'reactflow';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Server } from 'lucide-react';
import { OllamaNodeData } from '@/lib/types';

interface OllamaNodeProps {
  data: OllamaNodeData;
  selected: boolean;
  id: string;
}

const OllamaNode = ({ data, selected, id }: OllamaNodeProps) => {
  return (
    <Card className={`w-[280px] shadow-md ${selected ? 'ring-2 ring-orange-500' : ''}`}>
      <CardHeader className="bg-orange-50 py-2 px-4 flex flex-row items-center gap-2 border-b">
        <div className="w-8 h-8 bg-orange-100 rounded-md flex items-center justify-center">
          <Server className="h-5 w-5 text-orange-600" />
        </div>
        <CardTitle className="text-sm font-medium text-gray-800">{data.label || 'Ollama'}</CardTitle>
      </CardHeader>
      <CardContent className="p-3">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium text-gray-700">Model:</span>
            <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
              {data.model || 'llama2'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium text-gray-700">Endpoint:</span>
            <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
              {data.endpoint || 'http://localhost:11434'}
            </span>
          </div>
          {data.systemPrompt && (
            <div>
              <span className="text-xs font-medium text-gray-700 block mb-1">System Prompt:</span>
              <div className="text-xs bg-gray-50 p-2 rounded border border-gray-200 max-h-20 overflow-y-auto">
                {data.systemPrompt}
              </div>
            </div>
          )}
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium text-gray-700">Temperature:</span>
            <span className="text-xs text-gray-600">{data.temperature || 0.7}</span>
          </div>
        </div>
      </CardContent>
      <Handle
        type="target"
        position={Position.Top}
        id="input"
        style={{ 
          top: -8, 
          background: '#ea580c',
          width: 12,
          height: 12,
          border: '2px solid white'
        }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="output"
        style={{ 
          bottom: -8, 
          background: '#ea580c',
          width: 12,
          height: 12,
          border: '2px solid white'
        }}
      />
    </Card>
  );
};

export default OllamaNode;
