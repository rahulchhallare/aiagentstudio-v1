import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/context/AuthContext';
import Sidebar from '@/components/dashboard/Sidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Search, MessageCircle, Book, FileText, Youtube, ArrowRight } from 'lucide-react';

export default function Help() {
  const [, navigate] = useLocation();
  const { user, isLoading: authLoading } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/');
    }
  }, [user, authLoading, navigate]);

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user) return null;

  // FAQ questions
  const faqs = [
    {
      question: "What are AI agents?",
      answer: "AI agents are autonomous programs built with artificial intelligence capabilities that can perform tasks, make decisions, and interact with users or other systems on your behalf. In AIagentStudio.ai, these agents are created using a visual drag-and-drop interface that connects input, processing, and output blocks to create customized flows."
    },
    {
      question: "How do I create my first AI agent?",
      answer: "To create your first AI agent, navigate to the Agent Builder page by clicking on 'Create New Agent' in the dashboard or sidebar. Once there, you can drag components from the left panel onto the canvas, connect them together to create a workflow, and configure each component's properties in the right panel. Finally, click 'Save' to store your agent or 'Deploy' to make it live."
    },
    {
      question: "What is the difference between the GPT models available?",
      answer: "We offer several GPT models with different capabilities and costs. GPT-3.5 Turbo is faster and more cost-effective for simpler tasks. GPT-4 provides more advanced reasoning, broader knowledge, and better instruction-following for complex tasks. GPT-4 Turbo combines the latest improvements with extended context capabilities. The best model depends on your specific use case and budget."
    },
    {
      question: "How are API calls counted?",
      answer: "Each time your agent processes a request through a GPT block, it counts as one API call. The number of API calls available depends on your subscription plan. You can monitor your usage in the Billing section. If you need more API calls, you can upgrade your plan or purchase additional call packages."
    },
    {
      question: "Can I connect my agents to external services?",
      answer: "Yes, our agents can be connected to external services through API integrations. This allows your agents to fetch data from your existing systems, trigger actions in other platforms, or process data from external sources. You'll need to configure the appropriate authentication and endpoints in the agent's configuration."
    },
    {
      question: "How do I share my agents with others?",
      answer: "Currently, agents can only be used by the account that created them. We are working on collaboration features that will allow you to share agents with team members or make them publicly available through a marketplace. These features will be available in upcoming updates."
    }
  ];

  const resources = [
    {
      title: "Getting Started Guide",
      description: "Learn the basics of creating and deploying your first AI agent",
      icon: <Book className="h-8 w-8 text-primary-600" />,
      link: "#"
    },
    {
      title: "Video Tutorials",
      description: "Step-by-step video guides for building powerful AI agents",
      icon: <Youtube className="h-8 w-8 text-red-600" />,
      link: "#"
    },
    {
      title: "API Documentation",
      description: "Technical details for integrating with our API",
      icon: <FileText className="h-8 w-8 text-blue-600" />,
      link: "#"
    },
    {
      title: "Component Reference",
      description: "Detailed explanation of all available agent components",
      icon: <FileText className="h-8 w-8 text-purple-600" />,
      link: "#"
    }
  ];

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      {/* Main Content */}
      <div className="flex-1 ml-0 lg:ml-64 transition-all duration-300 overflow-y-auto">
        <div className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Help & Support</h1>
            <p className="text-gray-600">Find answers to common questions and learn how to use AI Agent Studio</p>
          </div>
          
          {/* Search */}
          <div className="relative mb-8">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input 
              placeholder="Search for help..." 
              className="pl-10 py-6 text-lg" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <Tabs defaultValue="faq" className="w-full">
            <TabsList className="grid grid-cols-3 w-full md:w-auto mb-8">
              <TabsTrigger value="faq">
                Frequently Asked Questions
              </TabsTrigger>
              <TabsTrigger value="resources">
                Resources
              </TabsTrigger>
              <TabsTrigger value="contact">
                Contact Support
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="faq">
              <Card>
                <CardHeader>
                  <CardTitle>Frequently Asked Questions</CardTitle>
                  <CardDescription>Find answers to common questions about AIagentStudio.ai</CardDescription>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    {faqs.map((faq, index) => (
                      <AccordionItem key={index} value={`item-${index}`}>
                        <AccordionTrigger className="text-left font-medium">
                          {faq.question}
                        </AccordionTrigger>
                        <AccordionContent>
                          <p className="text-gray-600">{faq.answer}</p>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="resources">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {resources.map((resource, index) => (
                  <Card key={index} className="overflow-hidden">
                    <CardHeader className="flex flex-row items-start gap-4 pb-2">
                      {resource.icon}
                      <div>
                        <CardTitle>{resource.title}</CardTitle>
                        <CardDescription>{resource.description}</CardDescription>
                      </div>
                    </CardHeader>
                    <CardFooter>
                      <Button variant="link" className="px-0">
                        View Resource <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
              
              <Card className="mt-8">
                <CardHeader>
                  <CardTitle>Video Tutorials</CardTitle>
                  <CardDescription>Watch step-by-step guides for using AIagentStudio.ai</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-200 aspect-video rounded-lg flex items-center justify-center">
                      <Youtube className="h-12 w-12 text-gray-500" />
                    </div>
                    <div className="bg-gray-200 aspect-video rounded-lg flex items-center justify-center">
                      <Youtube className="h-12 w-12 text-gray-500" />
                    </div>
                    <div className="bg-gray-200 aspect-video rounded-lg flex items-center justify-center">
                      <Youtube className="h-12 w-12 text-gray-500" />
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="link" className="px-0">
                    View All Tutorials <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            <TabsContent value="contact">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Chat Support</CardTitle>
                    <CardDescription>Chat with our support team in real-time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-center p-6">
                      <MessageCircle className="h-16 w-16 text-primary-600" />
                    </div>
                    <p className="text-center text-gray-600 mb-4">Our support team is available Monday-Friday, 9am-5pm EST</p>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full">Start Chat</Button>
                  </CardFooter>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Email Support</CardTitle>
                    <CardDescription>Send us an email and we'll get back to you</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Subject</label>
                      <Input placeholder="What do you need help with?" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Message</label>
                      <textarea 
                        className="min-h-[120px] w-full rounded-md border border-gray-300 shadow-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 p-3"
                        placeholder="Describe your issue in detail..."
                      />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full">Send Message</Button>
                  </CardFooter>
                </Card>
              </div>
              
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Community Forum</CardTitle>
                  <CardDescription>Connect with other users and share knowledge</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-gray-50 rounded-lg flex justify-between items-center">
                      <div>
                        <h3 className="font-medium">How to build a content summarizer agent?</h3>
                        <p className="text-sm text-gray-500">Started by JohnDoe • 3 replies • 2 days ago</p>
                      </div>
                      <Badge>Popular</Badge>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg flex justify-between items-center">
                      <div>
                        <h3 className="font-medium">Best practices for prompt engineering</h3>
                        <p className="text-sm text-gray-500">Started by AIExpert • 12 replies • 1 week ago</p>
                      </div>
                      <Badge>Featured</Badge>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg flex justify-between items-center">
                      <div>
                        <h3 className="font-medium">Connecting agents to external APIs</h3>
                        <p className="text-sm text-gray-500">Started by DevGuru • 5 replies • 3 days ago</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full">Visit Community Forum</Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}