import { Handle, Position, NodeProps } from 'reactflow';
import { FileOutput } from 'lucide-react';

interface OutputNodeData {
  label?: string;
  format?: 'plaintext' | 'markdown' | 'html';
}

export default function OutputNode({ data, selected }: NodeProps<OutputNodeData>) {
  const getFormatLabel = () => {
    switch (data.format) {
      case 'markdown':
        return 'Markdown';
      case 'html':
        return 'HTML';
      default:
        return 'Plain Text';
    }
  };
  
  return (
    <div className={`bg-white shadow-lg rounded-lg overflow-hidden transition-shadow duration-200 ${selected ? 'ring-2 ring-purple-500' : 'border border-gray-200'}`}>
      <div className="bg-purple-500 h-2 w-full"></div>
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 rounded bg-purple-100 flex items-center justify-center">
              <FileOutput className="h-3 w-3 text-purple-600" />
            </div>
            <h4 className="font-medium text-gray-900">{data.label || 'Text Output'}</h4>
          </div>
        </div>
        
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-3 min-h-[80px] flex items-center justify-center">
          <p className="text-sm text-gray-500 text-center">
            {data.format ? (
              <span>Output will be displayed as {getFormatLabel()}</span>
            ) : (
              <span>Connect to see output</span>
            )}
          </p>
        </div>
        
        <div className="mt-3 text-xs text-gray-500">
          <div className="flex justify-between">
            <span>Format:</span>
            <span className="font-medium">{getFormatLabel()}</span>
          </div>
        </div>
      </div>
      
      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        className="w-3 h-3 bg-purple-500 border-2 border-white"
      />
    </div>
  );
}
