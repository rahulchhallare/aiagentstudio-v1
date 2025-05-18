import { useState } from 'react';
import { Handle, Position } from 'reactflow';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SquareFunction } from 'lucide-react';
import { InputNodeData } from '@/lib/types';

interface InputNodeProps {
  data: InputNodeData;
  selected: boolean;
  id: string;
}

const InputNode = ({ data, selected, id }: InputNodeProps) => {
  const [inputText, setInputText] = useState('');
  
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
  };
  
  return (
    <Card className={`w-[280px] shadow-md ${selected ? 'ring-2 ring-blue-500' : ''}`}>
      <CardHeader className="bg-blue-50 py-2 px-4 flex flex-row items-center gap-2 border-b">
        <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center">
          <SquareFunction className="h-5 w-5 text-blue-600" />
        </div>
        <CardTitle className="text-sm font-medium text-gray-800">{data.label || 'Text Input'}</CardTitle>
      </CardHeader>
      <CardContent className="p-3">
        <div className="space-y-2">
          {data.description && (
            <p className="text-xs text-gray-500">{data.description}</p>
          )}
          <textarea
            placeholder={data.placeholder || "Enter text here..."}
            className="w-full min-h-[80px] text-sm resize-none p-2 border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
            value={inputText}
            onChange={handleChange}
          />
        </div>
      </CardContent>
      <Handle
        type="source"
        position={Position.Bottom}
        id="output"
        style={{ 
          bottom: -8, 
          background: '#2563eb',
          width: 12,
          height: 12,
          border: '2px solid white'
        }}
      />
    </Card>
  );
};

export default InputNode;