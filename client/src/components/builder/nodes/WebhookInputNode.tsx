import { Handle, Position } from 'reactflow';
import { Globe } from 'lucide-react';

interface WebhookInputNodeProps {
  data: {
    label?: string;
    description?: string;
    webhookUrl?: string;
  };
  isConnectable: boolean;
}

export default function WebhookInputNode({ data, isConnectable }: WebhookInputNodeProps) {
  return (
    <div className="bg-white shadow-md rounded-md border border-blue-200 w-60">
      <div className="bg-blue-50 p-3 rounded-t-md border-b border-blue-200 flex items-center">
        <div className="bg-blue-100 h-8 w-8 rounded-md flex items-center justify-center mr-3">
          <Globe className="h-5 w-5 text-blue-600" />
        </div>
        <div className="flex items-center justify-between w-full">
          <div>
            <h3 className="font-medium text-blue-900">
              {data.label || 'Webhook Input'}
            </h3>
            <p className="text-xs text-blue-700">
              {data.description || 'Receive external data'}
            </p>
          </div>
          <div className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white text-[10px] px-1.5 py-0.5 rounded-full">
            Pro
          </div>
        </div>
      </div>
      
      <div className="p-3">
        <div className="text-xs text-gray-500 mb-1">Webhook URL</div>
        <div className="flex items-center p-1.5 bg-gray-50 border border-gray-200 rounded text-sm">
          <span className="truncate text-gray-700">
            {data.webhookUrl || 'https://api.aiagent.studio/webhook/'}
          </span>
        </div>
        
        <div className="mt-3 text-xs text-gray-500">
          Data received via this webhook will be processed through this flow
        </div>
      </div>
      
      <Handle
        type="source"
        position={Position.Bottom}
        id="output"
        isConnectable={isConnectable}
        className="w-3 h-3 bg-blue-500"
      />
    </div>
  );
}