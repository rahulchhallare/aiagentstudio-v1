import { Brain, ArrowRightLeft, FileText, SquareFunction, FileOutput, GitBranch, Repeat, SearchIcon, Image, MessageSquare, Database, Globe, Zap, BarChart, Palette, Share2, Mail, BellRing, Calculator, Cloud, Languages } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { Badge } from "@/components/ui/badge";

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
          color: 'blue',
          popular: true
        },
        {
          type: 'fileInputNode',
          name: 'File Input',
          description: 'User file upload',
          icon: <FileText className="h-5 w-5" />,
          color: 'blue'
        },
        {
          type: 'imageInputNode',
          name: 'Image Input',
          description: 'User image upload',
          icon: <Image className="h-5 w-5" />,
          color: 'blue'
        },
        {
          type: 'webhookInputNode',
          name: 'Webhook Input',
          description: 'Receive external data',
          icon: <Globe className="h-5 w-5" />,
          color: 'blue',
          badge: 'Pro'
        }
      ]
    },
    {
      type: 'processing',
      category: 'AI & Processing',
      nodes: [
        {
          type: 'gptNode',
          name: 'GPT Block',
          description: 'AI text generation',
          icon: <Brain className="h-5 w-5" />,
          color: 'green',
          popular: true
        },
        {
          type: 'imageGenerationNode',
          name: 'Image Generation',
          description: 'AI image creation',
          icon: <Palette className="h-5 w-5" />,
          color: 'green',
          badge: 'New'
        },
        {
          type: 'chatbotNode',
          name: 'Chatbot',
          description: 'Conversational AI',
          icon: <MessageSquare className="h-5 w-5" />,
          color: 'green'
        },
        {
          type: 'transformNode',
          name: 'Transform',
          description: 'Process data',
          icon: <ArrowRightLeft className="h-5 w-5" />,
          color: 'green'
        },
        {
          type: 'translationNode',
          name: 'Translation',
          description: 'Translate text',
          icon: <Languages className="h-5 w-5" />,
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
          color: 'purple',
          popular: true
        },
        {
          type: 'imageOutputNode',
          name: 'Image Output',
          description: 'Display images',
          icon: <Image className="h-5 w-5" />,
          color: 'purple'
        },
        {
          type: 'emailNode',
          name: 'Email Sender',
          description: 'Send email outputs',
          icon: <Mail className="h-5 w-5" />,
          color: 'purple',
          badge: 'Pro'
        },
        {
          type: 'notificationNode',
          name: 'Notification',
          description: 'Send notifications',
          icon: <BellRing className="h-5 w-5" />,
          color: 'purple'
        },
        {
          type: 'dashboardNode',
          name: 'Dashboard Output',
          description: 'Visualize data',
          icon: <BarChart className="h-5 w-5" />,
          color: 'purple',
          badge: 'Pro'
        }
      ]
    },
    {
      type: 'logic',
      category: 'Logic & Control',
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
        },
        {
          type: 'calculatorNode',
          name: 'Calculator',
          description: 'Perform calculations',
          icon: <Calculator className="h-5 w-5" />,
          color: 'amber'
        }
      ]
    },
    {
      type: 'integrations',
      category: 'Integrations',
      nodes: [
        {
          type: 'databaseNode',
          name: 'Database',
          description: 'Store and retrieve data',
          icon: <Database className="h-5 w-5" />,
          color: 'indigo',
          badge: 'Pro'
        },
        {
          type: 'apiNode',
          name: 'API Connector',
          description: 'Connect to external APIs',
          icon: <Zap className="h-5 w-5" />,
          color: 'indigo'
        },
        {
          type: 'socialMediaNode',
          name: 'Social Media',
          description: 'Post to social platforms',
          icon: <Share2 className="h-5 w-5" />,
          color: 'indigo',
          badge: 'Pro'
        },
        {
          type: 'webhookNode',
          name: 'Webhook',
          description: 'Send data to endpoints',
          icon: <Cloud className="h-5 w-5" />,
          color: 'indigo'
        }
      ]
    }
  ];

  // Filter nodes based on search term
  const filteredNodeTypes = nodeTypes.map(category => ({
    ...category,
    nodes: category.nodes.filter(node => 
      node.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      node.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(category => category.nodes.length > 0);

  // Get popular nodes for quick access
  const popularNodes = nodeTypes.flatMap(category => 
    category.nodes.filter(node => node.popular)
  );

  // Helper to get background color based on node type
  const getNodeColor = (color: string) => {
    const colors = {
      blue: 'bg-blue-50 border-blue-200 text-blue-600',
      green: 'bg-green-50 border-green-200 text-green-600',
      purple: 'bg-purple-50 border-purple-200 text-purple-600',
      amber: 'bg-amber-50 border-amber-200 text-amber-600',
      indigo: 'bg-indigo-50 border-indigo-200 text-indigo-600'
    };
    return colors[color as keyof typeof colors] || 'bg-gray-50 border-gray-200 text-gray-600';
  };

  // Helper to get icon background color
  const getIconBgColor = (color: string) => {
    const colors = {
      blue: 'bg-blue-100',
      green: 'bg-green-100',
      purple: 'bg-purple-100',
      amber: 'bg-amber-100',
      indigo: 'bg-indigo-100'
    };
    return colors[color as keyof typeof colors] || 'bg-gray-100';
  };

  // Helper for badge color
  const getBadgeColor = (badge?: string) => {
    if (!badge) return '';
    
    const colors: Record<string, string> = {
      'Pro': 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white',
      'New': 'bg-gradient-to-r from-green-400 to-cyan-500 text-white'
    };
    
    return colors[badge] || 'bg-gray-100 text-gray-800';
  };

  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
    // Add opacity to make it clear something is being dragged
    if (event.currentTarget instanceof HTMLElement) {
      event.currentTarget.style.opacity = '0.4';
    }
  };
  
  const onDragEnd = (event: React.DragEvent) => {
    // Reset opacity after dragging
    if (event.currentTarget instanceof HTMLElement) {
      event.currentTarget.style.opacity = '1';
    }
  };

  return (
    <div className="w-full h-full bg-background border-r overflow-hidden flex flex-col" id="components-panel">
      <div className="p-4 border-b">
        <h3 className="font-medium text-lg bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 mb-4">AI Components</h3>
        
        {/* Search Components */}
        <div className="mb-2">
          <div className="relative">
            <Input 
              placeholder="Search components..." 
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <SearchIcon className="h-4 w-4 absolute right-3 top-2.5 text-gray-500" />
          </div>
        </div>
      </div>
      
      <div className="overflow-y-auto flex-grow">
        {/* Component Categories */}
        <div className="p-4 space-y-6">
          {searchTerm === '' && (
            <div className="mb-6">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Quick Start
              </h4>
              <div className="grid grid-cols-3 gap-2">
                {popularNodes.slice(0, 3).map((node) => (
                  <div 
                    key={`quick-${node.type}`}
                    className={`p-2 ${getNodeColor(node.color)} border rounded-lg cursor-grab flex flex-col items-center text-center`} 
                    draggable 
                    onDragStart={(event) => onDragStart(event, node.type)}
                    onDragEnd={onDragEnd}
                  >
                    <div className={`w-8 h-8 ${getIconBgColor(node.color)} rounded-full flex items-center justify-center mb-1`}>
                      {node.icon}
                    </div>
                    <h5 className="font-medium text-xs text-gray-900 line-clamp-1">{node.name}</h5>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {filteredNodeTypes.map((category) => (
            <div key={category.type} className="mb-6">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                {category.category}
              </h4>
              <div className="space-y-2">
                {category.nodes.map((node) => (
                  <div 
                    key={node.type}
                    className={`p-3 ${getNodeColor(node.color)} border border-opacity-80 rounded-lg cursor-grab flex items-center hover:shadow-sm transition-shadow`} 
                    draggable 
                    onDragStart={(event) => onDragStart(event, node.type)}
                    onDragEnd={onDragEnd}
                  >
                    <div className={`w-8 h-8 ${getIconBgColor(node.color)} rounded-md flex items-center justify-center mr-3 flex-shrink-0`}>
                      {node.icon}
                    </div>
                    <div className="flex-grow min-w-0">
                      <div className="flex items-center gap-2">
                        <h5 className="font-medium text-sm text-gray-900 truncate">{node.name}</h5>
                        {node.badge && (
                          <Badge className={`px-1.5 py-0.5 text-[10px] h-auto font-medium ${getBadgeColor(node.badge)}`}>
                            {node.badge}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 truncate">{node.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
