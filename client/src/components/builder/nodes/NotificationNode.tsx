import { Handle, Position } from 'reactflow';
import { BellRing } from 'lucide-react';

interface NotificationNodeProps {
  data: {
    label?: string;
    channel?: string;
    priority?: 'low' | 'medium' | 'high';
  };
  isConnectable: boolean;
}

export default function NotificationNode({ data, isConnectable }: NotificationNodeProps) {
  return (
    <div className="bg-white shadow-md rounded-md border border-purple-200 w-60">
      <div className="bg-purple-50 p-3 rounded-t-md border-b border-purple-200 flex items-center">
        <div className="bg-purple-100 h-8 w-8 rounded-md flex items-center justify-center mr-3">
          <BellRing className="h-5 w-5 text-purple-600" />
        </div>
        <div>
          <h3 className="font-medium text-purple-900">
            {data.label || 'Notification'}
          </h3>
          <p className="text-xs text-purple-700">
            Send notifications
          </p>
        </div>
      </div>
      
      <div className="p-3">
        <div className="text-xs text-gray-500 mb-1">Channel</div>
        <div className="p-1.5 bg-gray-50 border border-gray-200 rounded text-sm mb-2">
          <span className="truncate text-gray-700">
            {data.channel || 'In-app notification'}
          </span>
        </div>
        
        <div className="text-xs text-gray-500 mb-1">Priority</div>
        <div className="p-1.5 bg-gray-50 border border-gray-200 rounded text-sm mb-2">
          <span className="truncate text-gray-700">
            {data.priority || 'medium'}
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