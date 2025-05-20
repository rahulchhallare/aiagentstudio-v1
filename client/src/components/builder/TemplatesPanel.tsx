import { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { LayoutGrid } from 'lucide-react';
import { FlowData } from '@/lib/types';
import { 
  blogWriterTemplate, 
  socialMediaTemplate, 
  faqResponderTemplate, 
  dataSummarizerTemplate, 
  researchAssistantTemplate 
} from '@/lib/templates';
import {
  getDefaultLayout,
  getSimpleLayout,
  getLogicLayout,
  getAPILayout
} from '@/lib/initialLayouts';

interface TemplatesPanelProps {
  onSelectTemplate: (template: FlowData) => void;
}

interface TemplateCardProps {
  title: string;
  description: string;
  category: string;
  isPopular?: boolean;
  isNew?: boolean;
  onClick: () => void;
}

const TemplateCard = ({ title, description, category, isPopular, isNew, onClick }: TemplateCardProps) => {
  return (
    <div 
      className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer bg-white"
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-medium text-base">{title}</h3>
        {isNew && (
          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">New</span>
        )}
        {isPopular && !isNew && (
          <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full font-medium">Popular</span>
        )}
      </div>
      <p className="text-sm text-gray-500 mb-3">{description}</p>
      <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">{category}</span>
    </div>
  );
};

export default function TemplatesPanel({ onSelectTemplate }: TemplatesPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const templates = [
    {
      id: 'blank',
      title: 'Blank Canvas',
      description: 'Start from scratch with a simple template',
      category: 'Essentials',
      isPopular: true,
      template: getDefaultLayout()
    },
    {
      id: 'blog-writer',
      title: 'Blog Writer',
      description: 'Generate blog posts from simple prompts',
      category: 'Content',
      isPopular: true,
      template: blogWriterTemplate()
    },
    {
      id: 'social-media',
      title: 'Social Media Assistant',
      description: 'Create engaging social media content',
      category: 'Content',
      template: socialMediaTemplate()
    },
    {
      id: 'faq-responder',
      title: 'FAQ Responder',
      description: 'Answer common questions automatically',
      category: 'Customer Support',
      template: faqResponderTemplate()
    },
    {
      id: 'data-summarizer',
      title: 'Data Summarizer',
      description: 'Summarize complex data into insights',
      category: 'Data Processing',
      isNew: true,
      template: dataSummarizerTemplate()
    },
    {
      id: 'research-assistant',
      title: 'Research Assistant',
      description: 'Help with research and information gathering',
      category: 'Research',
      template: researchAssistantTemplate()
    },
    {
      id: 'simple-assistant',
      title: 'Simple Assistant',
      description: 'Basic question and answer AI assistant',
      category: 'Essentials',
      template: getDefaultLayout()
    },
    {
      id: 'logic-based',
      title: 'Logic-Based Agent',
      description: 'Agent with conditional branching based on user input',
      category: 'Advanced',
      isNew: true,
      template: getLogicLayout()
    },
    {
      id: 'api-integration',
      title: 'API Integration',
      description: 'Connect to external APIs and process the responses',
      category: 'Advanced',
      template: getAPILayout()
    },
    {
      id: 'simple-io',
      title: 'Input-Output Only',
      description: 'Minimal template with just input and output nodes',
      category: 'Essentials',
      template: getSimpleLayout()
    }
  ];
  
  const handleSelectTemplate = (templateData: FlowData) => {
    onSelectTemplate(templateData);
    setIsOpen(false);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center">
          <LayoutGrid className="mr-1 h-4 w-4" />
          Templates
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Template Gallery</DialogTitle>
        </DialogHeader>
        
        <div className="mt-4">
          <h3 className="font-medium text-sm text-gray-500 uppercase mb-3">Popular Templates</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {templates
              .filter(t => t.isPopular)
              .map(template => (
                <TemplateCard
                  key={template.id}
                  title={template.title}
                  description={template.description}
                  category={template.category}
                  isPopular={template.isPopular}
                  isNew={template.isNew}
                  onClick={() => handleSelectTemplate(template.template)}
                />
              ))}
          </div>
          
          <h3 className="font-medium text-sm text-gray-500 uppercase mb-3">All Templates</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {templates
              .filter(t => !t.isPopular)
              .map(template => (
                <TemplateCard
                  key={template.id}
                  title={template.title}
                  description={template.description}
                  category={template.category}
                  isPopular={template.isPopular}
                  isNew={template.isNew}
                  onClick={() => handleSelectTemplate(template.template)}
                />
              ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}