import { Brain, ArrowRightLeft, FileText, SquareFunction, FileOutput, GitBranch, Repeat, SearchIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useState } from 'react';

export default function NodePanel() {
  const [searchTerm, setSearchTerm] = useState('');

  const nodeTypes = [
    {
      type: 'input',
      category: 'Input',
      nodes: [
        {
          type: 'inputNode',
          name: 'Text Input',
          description: 'User text input',
          icon: <SquareFunction className="h-5 w-5" />,
          color: 'blue'
        },
        {
          type: 'fileInputNode',
          name: 'File Input',
          description: 'User file upload',
          icon: <FileText className="h-5 w-5" />,
          color: 'blue'
        }
      ]
    },
    {
      type: 'processing',
      category: 'Processing',
      nodes: [
        {
          type: 'gptNode',
          name: 'GPT Block',
          description: 'AI text generation',
          icon: <Brain className="h-5 w-5" />,
          color: 'green'
        },
        {
          type: 'transformNode',
          name: 'Transform',
          description: 'Process data',
          icon: <ArrowRightLeft className="h-5 w-5" />,
          color: 'green'
        }
      ]
    },
    {
      type: 'output',
      category: 'Output',
      nodes: [
        {
          type: 'outputNode',
          name: 'Text Output',
          description: 'Display text results',
          icon: <FileOutput className="h-5 w-5" />,
          color: 'purple'
        },
        {
          type: 'imageOutputNode',
          name: 'Image Output',
          description: 'Display images',
          icon: <FileOutput className="h-5 w-5" />,
          color: 'purple'
        }
      ]
    },
    {
      type: 'logic',
      category: 'Logic',
      nodes: [
        {
          type: 'conditionNode',
          name: 'Condition',
          description: 'Branching logic',
          icon: <GitBranch className="h-5 w-5" />,
          color: 'amber'
        },
        {
          type: 'loopNode',
          name: 'Loop',
          description: 'Iterate over data',
          icon: <Repeat className="h-5 w-5" />,
          color: 'amber'
        }
      ]
    }
  ];

  const filteredNodeTypes = nodeTypes.map(category => ({
    ...category,
    nodes: category.nodes.filter(node => 
      node.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      node.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(category => category.nodes.length > 0);

  // Helper to get background color based on node type
  const getNodeColor = (color: string) => {
    const colors = {
      blue: 'bg-blue-50 border-blue-200 text-blue-600',
      green: 'bg-green-50 border-green-200 text-green-600',
      purple: 'bg-purple-50 border-purple-200 text-purple-600',
      amber: 'bg-amber-50 border-amber-200 text-amber-600'
    };
    return colors[color as keyof typeof colors] || 'bg-gray-50 border-gray-200 text-gray-600';
  };

  // Helper to get icon background color
  const getIconBgColor = (color: string) => {
    const colors = {
      blue: 'bg-blue-100',
      green: 'bg-green-100',
      purple: 'bg-purple-100',
      amber: 'bg-amber-100'
    };
    return colors[color as keyof typeof colors] || 'bg-gray-100';
  };

  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="w-64 bg-white shadow-md p-4 overflow-y-auto" id="components-panel">
      <h3 className="font-medium text-gray-900 mb-4">Components</h3>
      
      {/* Search Components */}
      <div className="mb-4">
        <div className="relative">
          <Input 
            placeholder="Search components..." 
            className="w-full px-3 py-2 bg-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <SearchIcon className="h-4 w-4 absolute right-3 top-2.5 text-gray-500" />
        </div>
      </div>
      
      {/* Component Categories */}
      <div className="space-y-4">
        {filteredNodeTypes.map((category) => (
          <div key={category.type}>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              {category.category}
            </h4>
            <div className="space-y-2">
              {category.nodes.map((node) => (
                <div 
                  key={node.type}
                  className={`p-3 ${getNodeColor(node.color)} border rounded-lg cursor-grab flex items-center`} 
                  draggable 
                  onDragStart={(event) => onDragStart(event, node.type)}
                >
                  <div className={`w-8 h-8 ${getIconBgColor(node.color)} rounded flex items-center justify-center mr-3`}>
                    {node.icon}
                  </div>
                  <div>
                    <h5 className="font-medium text-sm text-gray-900">{node.name}</h5>
                    <p className="text-xs text-gray-500">{node.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
