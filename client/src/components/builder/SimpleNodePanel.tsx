
import { FileText, SquareFunction, FileOutput, GitBranch, Image, Globe, Brain, Zap, Server } from 'lucide-react';

export default function SimpleNodePanel() {
  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  const onDragEnd = (event: React.DragEvent) => {
    // Reset opacity after dragging
    if (event.currentTarget instanceof HTMLElement) {
      event.currentTarget.style.opacity = '1';
    }
  };

  return (
    <div className="w-full h-full bg-background border-r overflow-y-auto p-4">
      <div className="mb-6">
        <h3 className="font-medium text-lg bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 mb-4">Components</h3>
        <p className="text-sm text-gray-500 mb-4">Drag and drop these components to the canvas:</p>
      </div>

      <div className="space-y-6">
        {/* Input Nodes */}
        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Input
          </h4>
          <div className="space-y-2">
            <div 
              className="p-3 bg-blue-50 border border-blue-200 text-blue-600 rounded-lg cursor-grab hover:shadow-sm transition-shadow flex items-center"
              draggable
              onDragStart={(event) => onDragStart(event, 'inputNode')}
              onDragEnd={onDragEnd}
            >
              <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center mr-3">
                <SquareFunction className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="font-medium text-sm">Text Input</div>
                <div className="text-xs text-blue-500">User text input</div>
              </div>
            </div>

            <div 
              className="p-3 bg-blue-50 border border-blue-200 text-blue-600 rounded-lg cursor-grab hover:shadow-sm transition-shadow flex items-center"
              draggable
              onDragStart={(event) => onDragStart(event, 'fileInputNode')}
              onDragEnd={onDragEnd}
            >
              <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center mr-3">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="font-medium text-sm">File Input</div>
                <div className="text-xs text-blue-500">User file upload</div>
              </div>
            </div>

            <div 
              className="p-3 bg-blue-50 border border-blue-200 text-blue-600 rounded-lg cursor-grab hover:shadow-sm transition-shadow flex items-center"
              draggable
              onDragStart={(event) => onDragStart(event, 'imageInputNode')}
              onDragEnd={onDragEnd}
            >
              <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center mr-3">
                <Image className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="font-medium text-sm">Image Input</div>
                <div className="text-xs text-blue-500">User image upload</div>
              </div>
            </div>

            <div 
              className="p-3 bg-blue-50 border border-blue-200 text-blue-600 rounded-lg cursor-grab hover:shadow-sm transition-shadow flex items-center"
              draggable
              onDragStart={(event) => onDragStart(event, 'webhookInputNode')}
              onDragEnd={onDragEnd}
            >
              <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center mr-3">
                <Globe className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="font-medium text-sm">Webhook Input</div>
                <div className="text-xs text-blue-500">Receive external data</div>
              </div>
            </div>
          </div>
        </div>

        {/* AI Processing */}
        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            AI Processing
          </h4>
          <div className="space-y-2">
            <div 
              className="p-3 bg-green-50 border border-green-200 text-green-600 rounded-lg cursor-grab hover:shadow-sm transition-shadow flex items-center"
              draggable
              onDragStart={(event) => onDragStart(event, 'huggingFaceNode')}
              onDragEnd={onDragEnd}
            >
              <div className="w-8 h-8 bg-green-100 rounded-md flex items-center justify-center mr-3">
                <Brain className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="font-medium text-sm">Free AI Models</div>
                <div className="text-xs text-green-500">Groq, Together AI</div>
              </div>
            </div>

            <div 
              className="p-3 bg-green-50 border border-green-200 text-green-600 rounded-lg cursor-grab hover:shadow-sm transition-shadow flex items-center"
              draggable
              onDragStart={(event) => onDragStart(event, 'ollamaNode')}
              onDragEnd={onDragEnd}
            >
              <div className="w-8 h-8 bg-green-100 rounded-md flex items-center justify-center mr-3">
                <Server className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="font-medium text-sm">Ollama Block</div>
                <div className="text-xs text-green-500">Local AI text generation</div>
              </div>
            </div>
          </div>
        </div>

        {/* Integration */}
        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Integration
          </h4>
          <div className="space-y-2">
            <div 
              className="p-3 bg-indigo-50 border border-indigo-200 text-indigo-600 rounded-lg cursor-grab hover:shadow-sm transition-shadow flex items-center"
              draggable
              onDragStart={(event) => onDragStart(event, 'apiNode')}
              onDragEnd={onDragEnd}
            >
              <div className="w-8 h-8 bg-indigo-100 rounded-md flex items-center justify-center mr-3">
                <Zap className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <div className="font-medium text-sm">API Connector</div>
                <div className="text-xs text-indigo-500">Connect to external APIs</div>
              </div>
            </div>
          </div>
        </div>

        {/* Logic */}
        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Logic
          </h4>
          <div className="space-y-2">
            <div 
              className="p-3 bg-amber-50 border border-amber-200 text-amber-600 rounded-lg cursor-grab hover:shadow-sm transition-shadow flex items-center"
              draggable
              onDragStart={(event) => onDragStart(event, 'logicNode')}
              onDragEnd={onDragEnd}
            >
              <div className="w-8 h-8 bg-amber-100 rounded-md flex items-center justify-center mr-3">
                <GitBranch className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <div className="font-medium text-sm">Logic Block</div>
                <div className="text-xs text-amber-500">Conditional branching</div>
              </div>
            </div>
          </div>
        </div>

        {/* Output */}
        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Output
          </h4>
          <div className="space-y-2">
            <div 
              className="p-3 bg-purple-50 border border-purple-200 text-purple-600 rounded-lg cursor-grab hover:shadow-sm transition-shadow flex items-center"
              draggable
              onDragStart={(event) => onDragStart(event, 'outputNode')}
              onDragEnd={onDragEnd}
            >
              <div className="w-8 h-8 bg-purple-100 rounded-md flex items-center justify-center mr-3">
                <FileOutput className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <div className="font-medium text-sm">Text Output</div>
                <div className="text-xs text-purple-500">Display text results</div>
              </div>
            </div>

            <div 
              className="p-3 bg-purple-50 border border-purple-200 text-purple-600 rounded-lg cursor-grab hover:shadow-sm transition-shadow flex items-center"
              draggable
              onDragStart={(event) => onDragStart(event, 'imageOutputNode')}
              onDragEnd={onDragEnd}
            >
              <div className="w-8 h-8 bg-purple-100 rounded-md flex items-center justify-center mr-3">
                <Image className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <div className="font-medium text-sm">Image Output</div>
                <div className="text-xs text-purple-500">Display images</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
