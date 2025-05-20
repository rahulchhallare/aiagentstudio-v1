import { Handle, Position } from 'reactflow';
import { Image } from 'lucide-react';

interface ImageOutputNodeProps {
  data: {
    label?: string;
    format?: 'jpg' | 'png' | 'gif';
    maxSize?: string;
  };
  isConnectable: boolean;
}

export default function ImageOutputNode({ data, isConnectable }: ImageOutputNodeProps) {
  return (
    <div className="bg-white shadow-md rounded-md border border-purple-200 w-60">
      <div className="bg-purple-50 p-3 rounded-t-md border-b border-purple-200 flex items-center">
        <div className="bg-purple-100 h-8 w-8 rounded-md flex items-center justify-center mr-3">
          <Image className="h-5 w-5 text-purple-600" />
        </div>
        <div>
          <h3 className="font-medium text-purple-900">
            {data.label || 'Image Output'}
          </h3>
          <p className="text-xs text-purple-700">
            Display generated images
          </p>
        </div>
      </div>
      
      <div className="p-3">
        <div className="text-xs text-gray-500 mb-1">Format</div>
        <div className="border border-gray-200 bg-gray-50 rounded-md p-3 text-sm text-center text-gray-400">
          {data.format || 'PNG'} • {data.maxSize || 'Max 2048x2048'}
        </div>
        
        <div className="mt-3 mb-1 text-xs text-gray-500">Preview</div>
        <div className="h-24 bg-gray-100 border border-gray-200 rounded-md flex items-center justify-center">
          <span className="text-xs text-gray-400">Image will appear here</span>
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