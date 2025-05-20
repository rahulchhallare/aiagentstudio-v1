import { useState } from 'react';
import { Handle, Position } from 'reactflow';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GitBranch } from 'lucide-react';

interface LogicNodeData {
  label?: string;
  condition?: string;
  description?: string;
}

interface LogicNodeProps {
  data: LogicNodeData;
  selected: boolean;
  id: string;
}

const LogicNode = ({ data, selected, id }: LogicNodeProps) => {
  return (
    <Card className={`w-[280px] shadow-md ${selected ? 'ring-2 ring-amber-500' : ''}`}>
      <CardHeader className="bg-amber-50 py-2 px-4 flex flex-row items-center gap-2 border-b">
        <div className="w-8 h-8 bg-amber-100 rounded-md flex items-center justify-center">
          <GitBranch className="h-5 w-5 text-amber-600" />
        </div>
        <CardTitle className="text-sm font-medium text-gray-800">{data.label || 'Condition'}</CardTitle>
      </CardHeader>
      <CardContent className="p-3">
        <div className="space-y-3">
          {data.description && (
            <p className="text-xs text-gray-500">{data.description}</p>
          )}
          
          <div className="space-y-2">
            <label className="block text-xs font-medium text-gray-700">Condition:</label>
            <div className="bg-gray-50 border border-gray-200 rounded p-2 text-xs font-mono">
              {data.condition || 'if (input.length > 0)'}
            </div>
          </div>
          
          <div className="flex justify-between pt-2">
            <div className="flex flex-col items-center">
              <span className="text-xs font-medium text-green-600">True</span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-400">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-xs font-medium text-red-600">False</span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-400">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </div>
          </div>
        </div>
      </CardContent>
      <Handle
        type="target"
        position={Position.Top}
        id="input"
        style={{ 
          top: -8, 
          background: '#d97706',
          width: 12,
          height: 12,
          border: '2px solid white'
        }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="true"
        style={{ 
          bottom: -8, 
          left: '30%',
          background: '#22c55e',
          width: 12,
          height: 12,
          border: '2px solid white'
        }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="false"
        style={{ 
          bottom: -8, 
          left: '70%',
          background: '#ef4444',
          width: 12,
          height: 12,
          border: '2px solid white'
        }}
      />
    </Card>
  );
};

export default LogicNode;