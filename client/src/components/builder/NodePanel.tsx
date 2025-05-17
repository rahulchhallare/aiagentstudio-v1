import { Brain, ArrowRightLeft, FileText, SquareFunction, FileOutput, GitBranch, Repeat, SearchIcon, Image, MessageSquare, Database, Globe, Zap, BarChart, Palette, Share2, Mail, BellRing, Calculator, Cloud, Languages } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

export default function NodePanel() {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentTab, setCurrentTab] = useState('blocks');

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
  };

  return (
    <div className="w-72 bg-white shadow-md overflow-hidden flex flex-col" id="components-panel">
      <div className="p-4 border-b">
        <h3 className="font-medium text-gray-900 mb-4">Components</h3>
        
        {/* Search Components */}
        <div className="mb-4">
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
        
        {/* Component Tabs */}
        <Tabs defaultValue="blocks" className="w-full" onValueChange={setCurrentTab}>
          <TabsList className="w-full grid grid-cols-2 mb-2">
            <TabsTrigger value="blocks" className="text-sm">AI Blocks</TabsTrigger>
            <TabsTrigger value="templates" className="text-sm">Templates</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      <div className="overflow-y-auto flex-grow">
        <TabsContent value="blocks" className="p-4 m-0">
          {/* Quick Access - Popular Components */}
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
          
          {/* Component Categories */}
          <div className="space-y-6">
            {filteredNodeTypes.map((category) => (
              <div key={category.type}>
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
        </TabsContent>
        
        <TabsContent value="templates" className="p-4 m-0">
          <div className="space-y-4">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Ready-to-Use Agents
            </h4>
            
            {/* Mini Template Cards */}
            <div className="grid grid-cols-1 gap-3">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-3 cursor-pointer hover:shadow-sm transition-shadow">
                <div className="flex items-center mb-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center mr-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                  </div>
                  <h5 className="font-medium text-blue-900">Blog Writer</h5>
                </div>
                <p className="text-xs text-blue-700 mb-2">Generate complete blog posts from topics</p>
                <div className="flex gap-1">
                  <Badge className="bg-blue-100 text-blue-700 px-1.5 py-0.5 text-[10px] h-auto">Content</Badge>
                  <Badge className="bg-blue-100 text-blue-700 px-1.5 py-0.5 text-[10px] h-auto">Popular</Badge>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-green-50 to-teal-50 border border-green-200 rounded-lg p-3 cursor-pointer hover:shadow-sm transition-shadow">
                <div className="flex items-center mb-2">
                  <div className="w-8 h-8 bg-green-100 rounded-md flex items-center justify-center mr-2">
                    <MessageSquare className="h-5 w-5 text-green-600" />
                  </div>
                  <h5 className="font-medium text-green-900">Customer Support</h5>
                </div>
                <p className="text-xs text-green-700 mb-2">AI-powered customer service responses</p>
                <div className="flex gap-1">
                  <Badge className="bg-green-100 text-green-700 px-1.5 py-0.5 text-[10px] h-auto">Service</Badge>
                  <Badge className="bg-green-100 text-green-700 px-1.5 py-0.5 text-[10px] h-auto">New</Badge>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-3 cursor-pointer hover:shadow-sm transition-shadow">
                <div className="flex items-center mb-2">
                  <div className="w-8 h-8 bg-purple-100 rounded-md flex items-center justify-center mr-2">
                    <Share2 className="h-5 w-5 text-purple-600" />
                  </div>
                  <h5 className="font-medium text-purple-900">Social Media Suite</h5>
                </div>
                <p className="text-xs text-purple-700 mb-2">Generate posts for multiple platforms</p>
                <div className="flex gap-1">
                  <Badge className="bg-purple-100 text-purple-700 px-1.5 py-0.5 text-[10px] h-auto">Marketing</Badge>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </div>
    </div>
  );
}
