import { Handle, Position } from 'reactflow';
import { File } from 'lucide-react';

interface FileInputNodeProps {
  data: {
    label?: string;
    description?: string;
    fileTypes?: string;
  };
  isConnectable: boolean;
}

export default function FileInputNode({ data, isConnectable }: FileInputNodeProps) {
  return (
    <div className="bg-white shadow-md rounded-md border border-blue-200 w-60">
      <div className="bg-blue-50 p-3 rounded-t-md border-b border-blue-200 flex items-center">
        <div className="bg-blue-100 h-8 w-8 rounded-md flex items-center justify-center mr-3">
          <File className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <h3 className="font-medium text-blue-900">
            {data.label || 'File Input'}
          </h3>
          <p className="text-xs text-blue-700">
            {data.description || 'User file upload'}
          </p>
        </div>
      </div>
      
      <div className="p-3">
        <div className="text-xs text-gray-500 mb-1">Upload file here</div>
        <div className="border border-dashed border-gray-300 bg-gray-50 rounded-md p-3 text-sm text-center text-gray-500">
          Drop files here or click to browse
        </div>
        
        <div className="mt-2 text-xs text-gray-500">
          Accepted types: {data.fileTypes || '.pdf, .docx, .txt, .csv'}
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