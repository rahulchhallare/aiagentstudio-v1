
import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/context/AuthContext';
import Sidebar from '@/components/dashboard/Sidebar';
import LoginModal from '@/components/LoginModal';
import SignupModal from '@/components/SignupModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot, FileText, Zap, Database, MessageSquare, Brain, Star } from 'lucide-react';

export default function Templates() {
  const [, navigate] = useLocation();
  const { user, isLoading: authLoading } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Template categories with enhanced structure
  const templateCategories = [
    {
      name: 'Customer Support',
      description: 'Enhance your customer service with AI-powered support agents',
      templates: [
        {
          id: 'cs-1',
          name: 'FAQ Responder',
          description: 'Automatically answers common customer questions based on your knowledge base with contextual understanding.',
          icon: <MessageSquare className="h-12 w-12 text-primary-600" />,
          popular: true,
        },
        {
          id: 'cs-2',
          name: 'Ticket Classifier',
          description: 'Intelligently analyzes support tickets and routes them to the appropriate department for faster resolution.',
          icon: <Bot className="h-12 w-12 text-green-600" />,
          popular: false,
        },
      ]
    },
    {
      name: 'Content Creation',
      description: 'Scale your content production with intelligent writing assistants',
      templates: [
        {
          id: 'cc-1',
          name: 'Blog Writer',
          description: 'Generates comprehensive blog post drafts based on your topic, outline, and brand voice guidelines.',
          icon: <FileText className="h-12 w-12 text-purple-600" />,
          popular: true,
        },
        {
          id: 'cc-2',
          name: 'Social Media Creator',
          description: 'Creates engaging, platform-specific social media posts optimized for maximum reach and engagement.',
          icon: <Zap className="h-12 w-12 text-amber-600" />,
          popular: false,
        },
      ]
    },
    {
      name: 'Data Processing',
      description: 'Transform complex data into actionable insights automatically',
      templates: [
        {
          id: 'dp-1',
          name: 'Data Summarizer',
          description: 'Analyzes structured and unstructured data to generate clear, human-readable summaries and insights.',
          icon: <Database className="h-12 w-12 text-blue-600" />,
          popular: false,
        },
        {
          id: 'dp-2',
          name: 'Research Assistant',
          description: 'Assists with comprehensive literature reviews, research synthesis, and academic report generation.',
          icon: <Brain className="h-12 w-12 text-teal-600" />,
          popular: true,
        },
      ]
    }
  ];

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Login/Signup Modals */}
      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)}
        onSignupClick={() => {
          setIsLoginModalOpen(false);
          setIsSignupModalOpen(true);
        }}
      />
      <SignupModal 
        isOpen={isSignupModalOpen} 
        onClose={() => setIsSignupModalOpen(false)}
        onLoginClick={() => {
          setIsSignupModalOpen(false);
          setIsLoginModalOpen(true);
        }}
      />
      
      {/* Sidebar - only show if user is authenticated */}
      {user && <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />}
      
      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 overflow-y-auto ${user ? 'ml-0 lg:ml-64' : ''}`}>
        <div className="container max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
          {/* Header Section */}
          <div className="text-center mb-16">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Agent Templates</h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Get started quickly with pre-built agent templates designed for common business use cases.
              Each template is fully customizable to fit your specific needs.
            </p>
          </div>
          
          {/* Templates Grid */}
          <div className="space-y-16">
            {templateCategories.map((category, categoryIndex) => (
              <div key={categoryIndex}>
                <div className="text-center mb-12">
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">{category.name}</h2>
                  <p className="text-lg text-gray-600 max-w-2xl mx-auto">{category.description}</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {category.templates.map((template) => (
                    <Card key={template.id} className="border-gray-200 shadow-sm hover:shadow-md transition-shadow relative">
                      {template.popular && (
                        <div className="absolute top-4 right-4">
                          <div className="bg-primary-100 text-primary-700 px-2 py-1 rounded-full text-xs font-medium flex items-center">
                            <Star className="h-3 w-3 mr-1" />
                            Popular
                          </div>
                        </div>
                      )}
                      
                      <CardHeader className="pb-4">
                        <div className="mb-4">{template.icon}</div>
                        <CardTitle className="text-xl">{template.name}</CardTitle>
                      </CardHeader>
                      
                      <CardContent>
                        <CardDescription className="text-gray-600 text-base mb-6">
                          {template.description}
                        </CardDescription>
                        
                        <Button 
                          className="w-full"
                          onClick={() => {
                            if (!user) {
                              // Store template ID for after login
                              localStorage.setItem('selectedTemplate', template.id);
                              // Open login modal instead of redirecting
                              setIsLoginModalOpen(true);
                              return;
                            }
                            // Store template ID for the builder to load
                            localStorage.setItem('selectedTemplate', template.id);
                            navigate('/builder');
                          }}
                        >
                          {user ? 'Use Template' : 'Login to Use Template'}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Call to Action Section */}
          <div className="bg-primary-50 rounded-2xl p-8 md:p-12 mt-16">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to build your custom agent?</h2>
              <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
                Start with a template or create your own agent from scratch using our intuitive visual builder.
              </p>
              <div className="flex justify-center">
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  onClick={() => {
                    if (!user) {
                      setIsLoginModalOpen(true);
                      return;
                    }
                    navigate('/builder');
                  }}
                >
                  Get Started Now
                </Button>
              </div>
            </div>
          </div>

          {/* How It Works Section */}
          <div className="text-center mt-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">How Templates Work</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-12">
              Our templates provide a starting point that you can customize to your exact requirements.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="bg-primary-100 text-primary-700 w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">1</div>
                <h3 className="text-xl font-semibold mb-2">Choose Template</h3>
                <p className="text-gray-600">
                  Select from our library of pre-built templates designed for specific use cases.
                </p>
              </div>
              <div className="text-center">
                <div className="bg-primary-100 text-primary-700 w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">2</div>
                <h3 className="text-xl font-semibold mb-2">Customize & Configure</h3>
                <p className="text-gray-600">
                  Modify the template to match your requirements using our visual editor.
                </p>
              </div>
              <div className="text-center">
                <div className="bg-primary-100 text-primary-700 w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">3</div>
                <h3 className="text-xl font-semibold mb-2">Deploy & Use</h3>
                <p className="text-gray-600">
                  Deploy your customized agent and start using it in your workflow immediately.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
