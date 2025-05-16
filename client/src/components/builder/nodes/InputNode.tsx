import { useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { SquareFunction } from 'lucide-react';

interface InputNodeData {
  label?: string;
  placeholder?: string;
  description?: string;
  required?: boolean;
}

export default function InputNode({ data, selected }: NodeProps<InputNodeData>) {
  const [value, setValue] = useState('');
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
  };
  
  return (
    <div className={`bg-white shadow-lg rounded-lg overflow-hidden transition-shadow duration-200 ${selected ? 'ring-2 ring-blue-500' : 'border border-gray-200'}`}>
      <div className="bg-blue-500 h-2 w-full"></div>
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 rounded bg-blue-100 flex items-center justify-center">
              <SquareFunction className="h-3 w-3 text-blue-600" />
            </div>
            <h4 className="font-medium text-gray-900">{data.label || 'Text Input'}</h4>
          </div>
        </div>
        
        <div className="space-y-1">
          {data.description && (
            <p className="text-xs text-gray-500">{data.description}</p>
          )}
          <input
            type="text"
            placeholder={data.placeholder || 'Enter text here...'}
            value={value}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
            required={data.required}
          />
        </div>
      </div>
      
      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        className="w-3 h-3 bg-blue-500 border-2 border-white"
      />
    </div>
  );
}
