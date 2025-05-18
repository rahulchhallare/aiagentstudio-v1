import { useState } from 'react';
import { Handle, Position } from 'reactflow';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileOutput } from 'lucide-react';
import { OutputNodeData } from '@/lib/types';

interface OutputNodeProps {
  data: OutputNodeData;
  selected: boolean;
  id: string;
}

const OutputNode = ({ data, selected, id }: OutputNodeProps) => {
  const [output, setOutput] = useState('Your AI response will appear here...');
  
  return (
    <Card className={`w-[280px] shadow-md ${selected ? 'ring-2 ring-purple-500' : ''}`}>
      <CardHeader className="bg-purple-50 py-2 px-4 flex flex-row items-center gap-2 border-b">
        <div className="w-8 h-8 bg-purple-100 rounded-md flex items-center justify-center">
          <FileOutput className="h-5 w-5 text-purple-600" />
        </div>
        <CardTitle className="text-sm font-medium text-gray-800">{data.label || 'Text Output'}</CardTitle>
      </CardHeader>
      <CardContent className="p-3">
        <div className="space-y-2">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-medium text-gray-700">Format:</span>
            <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
              {data.format || 'markdown'}
            </span>
          </div>
          <div className="min-h-[100px] bg-gray-50 p-3 rounded border border-gray-200 text-sm text-gray-600 overflow-y-auto">
            {output}
          </div>
        </div>
      </CardContent>
      <Handle
        type="target"
        position={Position.Top}
        id="input"
        style={{ 
          top: -8, 
          background: '#9333ea',
          width: 12,
          height: 12,
          border: '2px solid white'
        }}
      />
    </Card>
  );
};

export default OutputNode;