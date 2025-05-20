import { Handle, Position } from 'reactflow';
import { Mail } from 'lucide-react';

interface EmailNodeProps {
  data: {
    label?: string;
    recipient?: string;
    subject?: string;
    template?: string;
  };
  isConnectable: boolean;
}

export default function EmailNode({ data, isConnectable }: EmailNodeProps) {
  return (
    <div className="bg-white shadow-md rounded-md border border-purple-200 w-60">
      <div className="bg-purple-50 p-3 rounded-t-md border-b border-purple-200 flex items-center">
        <div className="bg-purple-100 h-8 w-8 rounded-md flex items-center justify-center mr-3">
          <Mail className="h-5 w-5 text-purple-600" />
        </div>
        <div className="flex items-center justify-between w-full">
          <div>
            <h3 className="font-medium text-purple-900">
              {data.label || 'Email Sender'}
            </h3>
            <p className="text-xs text-purple-700">
              Send email outputs
            </p>
          </div>
          <div className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white text-[10px] px-1.5 py-0.5 rounded-full">
            Pro
          </div>
        </div>
      </div>
      
      <div className="p-3">
        <div className="text-xs text-gray-500 mb-1">Recipient</div>
        <div className="p-1.5 bg-gray-50 border border-gray-200 rounded text-sm mb-2">
          <span className="truncate text-gray-700">
            {data.recipient || '{{user.email}}'}
          </span>
        </div>
        
        <div className="text-xs text-gray-500 mb-1">Subject</div>
        <div className="p-1.5 bg-gray-50 border border-gray-200 rounded text-sm mb-2">
          <span className="truncate text-gray-700">
            {data.subject || 'Response from your AI assistant'}
          </span>
        </div>
        
        <div className="text-xs text-gray-500 mb-1">Template</div>
        <div className="p-1.5 bg-gray-50 border border-gray-200 rounded text-sm">
          <span className="truncate text-gray-700">
            {data.template || 'Default Template'}
          </span>
        </div>
      </div>
      
      <Handle
        type="target"
        position={Position.Top}
        id="input"
        isConnectable={isConnectable}
        className="w-3 h-3 bg-purple-500"
      />
    </div>
  );
}