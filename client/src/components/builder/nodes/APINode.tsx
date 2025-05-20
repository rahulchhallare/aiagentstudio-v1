import { Handle, Position } from 'reactflow';
import { Zap } from 'lucide-react';

interface APINodeProps {
  data: {
    label?: string;
    endpoint?: string;
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    headers?: string;
    body?: string;
  };
  isConnectable: boolean;
}

export default function APINode({ data, isConnectable }: APINodeProps) {
  return (
    <div className="bg-white shadow-md rounded-md border border-indigo-200 w-60">
      <div className="bg-indigo-50 p-3 rounded-t-md border-b border-indigo-200 flex items-center">
        <div className="bg-indigo-100 h-8 w-8 rounded-md flex items-center justify-center mr-3">
          <Zap className="h-5 w-5 text-indigo-600" />
        </div>
        <div>
          <h3 className="font-medium text-indigo-900">
            {data.label || 'API Connector'}
          </h3>
          <p className="text-xs text-indigo-700">
            Connect to external APIs
          </p>
        </div>
      </div>
      
      <div className="p-3">
        <div className="text-xs text-gray-500 mb-1">Endpoint</div>
        <div className="p-1.5 bg-gray-50 border border-gray-200 rounded text-sm mb-2 break-all">
          <span className="text-gray-700 text-xs">
            {data.endpoint || 'https://api.example.com/data'}
          </span>
        </div>
        
        <div className="text-xs text-gray-500 mb-1">Method</div>
        <div className="p-1.5 bg-gray-50 border border-gray-200 rounded text-sm mb-2">
          <span className="truncate text-gray-700">
            {data.method || 'GET'}
          </span>
        </div>
        
        <div className="text-xs text-gray-500 mb-1">Headers</div>
        <div className="p-1.5 bg-gray-50 border border-gray-200 rounded text-sm h-10 overflow-hidden text-xs">
          <code className="text-gray-600">
            {data.headers || '{"Content-Type": "application/json"}'}
          </code>
        </div>
      </div>
      
      <Handle
        type="target"
        position={Position.Top}
        id="input"
        isConnectable={isConnectable}
        className="w-3 h-3 bg-indigo-500"
      />
      
      <Handle
        type="source"
        position={Position.Bottom}
        id="output"
        isConnectable={isConnectable}
        className="w-3 h-3 bg-indigo-500"
      />
    </div>
  );
}