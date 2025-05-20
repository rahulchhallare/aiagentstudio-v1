import { FileText, SquareFunction, FileOutput, GitBranch, Image, Globe, Brain, Zap } from 'lucide-react';

export default function SimpleNodePanel({ addNode }: { addNode: (type: string) => void }) {
  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="w-full h-full bg-background border-r overflow-y-auto p-4">
      <div className="mb-6">
        <h3 className="font-medium text-lg bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 mb-4">Components</h3>
        <p className="text-sm text-gray-500 mb-4">Drag and drop these components to the canvas or click to add them directly:</p>
      </div>

      <div className="space-y-6">
        {/* Input Nodes */}
        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Input
          </h4>
          <div className="space-y-2">
            <div 
              className="p-3 bg-blue-50 border border-blue-200 text-blue-600 rounded-lg cursor-pointer hover:shadow-sm transition-shadow flex items-center"
              draggable
              onDragStart={(event) => onDragStart(event, 'inputNode')}
              onClick={() => addNode('inputNode')}
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
              className="p-3 bg-blue-50 border border-blue-200 text-blue-600 rounded-lg cursor-pointer hover:shadow-sm transition-shadow flex items-center"
              draggable
              onDragStart={(event) => onDragStart(event, 'fileInputNode')}
              onClick={() => addNode('fileInputNode')}
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
              className="p-3 bg-blue-50 border border-blue-200 text-blue-600 rounded-lg cursor-pointer hover:shadow-sm transition-shadow flex items-center"
              draggable
              onDragStart={(event) => onDragStart(event, 'imageInputNode')}
              onClick={() => addNode('imageInputNode')}
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
              className="p-3 bg-blue-50 border border-blue-200 text-blue-600 rounded-lg cursor-pointer hover:shadow-sm transition-shadow flex items-center"
              draggable
              onDragStart={(event) => onDragStart(event, 'webhookInputNode')}
              onClick={() => addNode('webhookInputNode')}
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
              className="p-3 bg-green-50 border border-green-200 text-green-600 rounded-lg cursor-pointer hover:shadow-sm transition-shadow flex items-center"
              draggable
              onDragStart={(event) => onDragStart(event, 'gptNode')}
              onClick={() => addNode('gptNode')}
            >
              <div className="w-8 h-8 bg-green-100 rounded-md flex items-center justify-center mr-3">
                <Brain className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="font-medium text-sm">GPT Block</div>
                <div className="text-xs text-green-500">AI text generation</div>
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
              className="p-3 bg-indigo-50 border border-indigo-200 text-indigo-600 rounded-lg cursor-pointer hover:shadow-sm transition-shadow flex items-center"
              draggable
              onDragStart={(event) => onDragStart(event, 'apiNode')}
              onClick={() => addNode('apiNode')}
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
              className="p-3 bg-amber-50 border border-amber-200 text-amber-600 rounded-lg cursor-pointer hover:shadow-sm transition-shadow flex items-center"
              draggable
              onDragStart={(event) => onDragStart(event, 'logicNode')}
              onClick={() => addNode('logicNode')}
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
              className="p-3 bg-purple-50 border border-purple-200 text-purple-600 rounded-lg cursor-pointer hover:shadow-sm transition-shadow flex items-center"
              draggable
              onDragStart={(event) => onDragStart(event, 'outputNode')}
              onClick={() => addNode('outputNode')}
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
              className="p-3 bg-purple-50 border border-purple-200 text-purple-600 rounded-lg cursor-pointer hover:shadow-sm transition-shadow flex items-center"
              draggable
              onDragStart={(event) => onDragStart(event, 'imageOutputNode')}
              onClick={() => addNode('imageOutputNode')}
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