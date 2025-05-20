import { useState } from 'react';
import { Handle, Position } from 'reactflow';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Zap } from 'lucide-react';

interface APINodeData {
  label?: string;
  endpoint?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: string;
  body?: string;
}

interface APINodeProps {
  data: APINodeData;
  selected: boolean;
  id: string;
}

const APINode = ({ data, selected, id }: APINodeProps) => {
  const [response, setResponse] = useState('API response will appear here...');
  
  return (
    <Card className={`w-[280px] shadow-md ${selected ? 'ring-2 ring-indigo-500' : ''}`}>
      <CardHeader className="bg-indigo-50 py-2 px-4 flex flex-row items-center gap-2 border-b">
        <div className="w-8 h-8 bg-indigo-100 rounded-md flex items-center justify-center">
          <Zap className="h-5 w-5 text-indigo-600" />
        </div>
        <CardTitle className="text-sm font-medium text-gray-800">{data.label || 'API Connector'}</CardTitle>
      </CardHeader>
      <CardContent className="p-3">
        <div className="space-y-2">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-medium text-gray-700">Endpoint:</span>
            <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded truncate max-w-[180px]">
              {data.endpoint || 'https://api.example.com'}
            </span>
          </div>
          
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-medium text-gray-700">Method:</span>
            <span className={`text-xs px-2.5 py-0.5 rounded-full text-white 
              ${data.method === 'GET' ? 'bg-green-500' : 
                data.method === 'POST' ? 'bg-blue-500' : 
                data.method === 'PUT' ? 'bg-yellow-500' : 
                data.method === 'DELETE' ? 'bg-red-500' : 'bg-gray-500'
              }`}
            >
              {data.method || 'GET'}
            </span>
          </div>
          
          <div className="text-xs text-gray-700">
            <div className="font-medium mb-1">Response:</div>
            <div className="bg-gray-50 p-2 rounded border border-gray-200 max-h-[80px] overflow-y-auto">
              {response}
            </div>
          </div>
        </div>
      </CardContent>
      <Handle
        type="target"
        position={Position.Top}
        id="input"
        style={{ 
          top: -8, 
          background: '#4f46e5',
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
          background: '#4f46e5',
          width: 12,
          height: 12,
          border: '2px solid white'
        }}
      />
    </Card>
  );
};

export default APINode;