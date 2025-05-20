import { Handle, Position } from 'reactflow';
import { GitBranch } from 'lucide-react';

interface LogicNodeProps {
  data: {
    label?: string;
    description?: string;
    condition?: string;
  };
  isConnectable: boolean;
}

export default function LogicNode({ data, isConnectable }: LogicNodeProps) {
  return (
    <div className="bg-white shadow-md rounded-md border border-amber-200 w-60">
      <div className="bg-amber-50 p-3 rounded-t-md border-b border-amber-200 flex items-center">
        <div className="bg-amber-100 h-8 w-8 rounded-md flex items-center justify-center mr-3">
          <GitBranch className="h-5 w-5 text-amber-600" />
        </div>
        <div>
          <h3 className="font-medium text-amber-900">
            {data.label || 'Condition'}
          </h3>
          <p className="text-xs text-amber-700">
            {data.description || 'Branching logic'}
          </p>
        </div>
      </div>
      
      <div className="p-3">
        <div className="text-xs text-gray-500 mb-1">Condition</div>
        <div className="p-2 bg-gray-50 border border-gray-200 rounded text-sm mb-2 break-all">
          <code className="text-gray-700 text-xs">
            {data.condition || 'input.length > 0'}
          </code>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-green-50 border border-green-200 p-2 rounded text-center">
            <span className="text-xs text-green-700">True Branch</span>
          </div>
          <div className="bg-red-50 border border-red-200 p-2 rounded text-center">
            <span className="text-xs text-red-700">False Branch</span>
          </div>
        </div>
      </div>
      
      <Handle
        type="target"
        position={Position.Top}
        id="input"
        isConnectable={isConnectable}
        className="w-3 h-3 bg-amber-500"
      />
      
      <Handle
        type="source"
        position={Position.Bottom}
        id="true"
        isConnectable={isConnectable}
        className="w-3 h-3 bg-green-500 -ml-5"
      />
      
      <Handle
        type="source"
        position={Position.Bottom}
        id="false"
        isConnectable={isConnectable}
        className="w-3 h-3 bg-red-500 ml-5"
      />
    </div>
  );
}