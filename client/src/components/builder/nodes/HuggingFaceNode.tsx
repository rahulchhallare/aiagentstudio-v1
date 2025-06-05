import { Handle, Position } from 'reactflow';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Zap } from 'lucide-react';
import { HuggingFaceNodeData } from '@/lib/types';

interface HuggingFaceNodeProps {
  data: HuggingFaceNodeData;
  selected: boolean;
  id: string;
}

const HuggingFaceNode = ({ data, selected, id }: HuggingFaceNodeProps) => {
  return (
    <Card className={`w-[280px] shadow-md ${selected ? 'ring-2 ring-purple-500' : ''}`}>
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-purple-500 !border-2 !border-white !w-3 !h-3"
      />
      <CardHeader className="bg-purple-50 py-2 px-4 flex flex-row items-center gap-2 border-b">
        <div className="w-8 h-8 bg-purple-100 rounded-md flex items-center justify-center">
          <Zap className="h-5 w-5 text-purple-600" />
        </div>
        <CardTitle className="text-sm font-medium text-gray-800">{data.label || 'Hugging Face'}</CardTitle>
      </CardHeader>
      <CardContent className="p-3">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium text-gray-700">Model:</span>
            <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
              {data.model || 'microsoft/DialoGPT-medium'}
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
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium text-gray-700">Max Tokens:</span>
            <span className="text-xs text-gray-600">{data.maxTokens || 1000}</span>
          </div>
        </div>
      </CardContent>
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-purple-500 !border-2 !border-white !w-3 !h-3"
      />
    </Card>
  );
};

export default HuggingFaceNode;