import { useState } from "react";
import { MessageSquare, FileText, ShoppingCart, Users, Mail, BarChart3, Headphones, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Footer from "@/components/Footer";

interface UseCase {
  id: string;
  title: string;
  description: string;
  icon: any;
  category: string;
  benefits: string[];
  template: string;
}

const useCases: UseCase[] = [
  {
    id: "customer-support",
    title: "Customer Support Assistant",
    description: "Automate customer inquiries with intelligent responses that understand context and provide helpful solutions 24/7.",
    icon: Headphones,
    category: "Customer Service",
    benefits: [
      "24/7 availability for customer inquiries",
      "Instant responses to common questions",
      "Escalation to human agents when needed",
      "Multi-language support capabilities"
    ],
    template: "Customer Support Template"
  },
  {
    id: "content-creation",
    title: "Content Generation",
    description: "Create engaging blog posts, social media content, and marketing materials tailored to your brand voice and audience.",
    icon: FileText,
    category: "Marketing",
    benefits: [
      "Consistent brand voice across content",
      "SEO-optimized article generation",
      "Social media post scheduling",
      "Content calendar management"
    ],
    template: "Blog Writer Template"
  },
  {
    id: "lead-qualification",
    title: "Lead Qualification",
    description: "Intelligently qualify leads by asking the right questions and routing prospects to appropriate sales teams.",
    icon: Users,
    category: "Sales",
    benefits: [
      "Automated lead scoring",
      "Qualification questionnaires",
      "CRM integration capabilities",
      "Sales team notifications"
    ],
    template: "Lead Qualifier Template"
  },
  {
    id: "email-automation",
    title: "Email Marketing Automation",
    description: "Personalize email campaigns based on customer behavior and preferences for higher engagement rates.",
    icon: Mail,
    category: "Marketing",
    benefits: [
      "Personalized email content",
      "Behavioral trigger campaigns",
      "A/B testing automation",
      "Performance analytics"
    ],
    template: "Email Marketer Template"
  },
  {
    id: "data-analysis",
    title: "Data Analysis & Reporting",
    description: "Transform raw data into actionable insights with automated analysis and custom report generation.",
    icon: BarChart3,
    category: "Analytics",
    benefits: [
      "Automated data processing",
      "Custom report generation",
      "Trend identification",
      "Executive dashboards"
    ],
    template: "Data Analyzer Template"
  },
  {
    id: "appointment-booking",
    title: "Appointment Scheduling",
    description: "Streamline appointment booking with intelligent scheduling that considers availability and preferences.",
    icon: Calendar,
    category: "Operations",
    benefits: [
      "Calendar integration",
      "Automated confirmations",
      "Reminder notifications",
      "Rescheduling management"
    ],
    template: "Scheduler Template"
  },
  {
    id: "ecommerce-assistant",
    title: "E-commerce Support",
    description: "Help customers find products, track orders, and resolve issues with personalized shopping assistance.",
    icon: ShoppingCart,
    category: "E-commerce",
    benefits: [
      "Product recommendations",
      "Order tracking assistance",
      "Return process automation",
      "Inventory notifications"
    ],
    template: "E-commerce Assistant Template"
  },
  {
    id: "social-media",
    title: "Social Media Management",
    description: "Create, schedule, and optimize social media posts across multiple platforms with AI-driven insights.",
    icon: MessageSquare,
    category: "Marketing",
    benefits: [
      "Multi-platform posting",
      "Engagement optimization",
      "Hashtag suggestions",
      "Performance tracking"
    ],
    template: "Social Media Template"
  }
];

const categories = ["All", "Customer Service", "Marketing", "Sales", "Analytics", "Operations", "E-commerce"];

export default function UseCases() {
  const [selectedCategory, setSelectedCategory] = useState("All");

  const filteredUseCases = selectedCategory === "All" 
    ? useCases 
    : useCases.filter(useCase => useCase.category === selectedCategory);

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-primary-50 to-white py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              AI Agent <span className="text-brand-blue">Use Cases</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Discover how businesses across industries are using AI agents to automate workflows, improve customer experience, and drive growth.
            </p>
          </div>
        </section>

        {/* Category Filter */}
        <section className="py-8 bg-white">
          <div className="container mx-auto px-4">
            <div className="flex flex-wrap justify-center gap-4">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className={selectedCategory === category ? 
                    "bg-brand-blue hover:bg-primary-700" : 
                    "hover:bg-primary-50 hover:border-brand-blue hover:text-brand-blue"
                  }
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>
        </section>

        {/* Use Cases Grid */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredUseCases.map((useCase) => (
                <Card key={useCase.id} className="hover:shadow-lg transition-shadow duration-200">
                  <CardHeader>
                    <div className="flex items-center justify-between mb-4">
                      <div className="bg-brand-blue/10 rounded-lg p-3">
                        <useCase.icon className="h-8 w-8 text-brand-blue" />
                      </div>
                      <Badge variant="secondary">{useCase.category}</Badge>
                    </div>
                    <CardTitle className="text-xl">{useCase.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-6">{useCase.description}</p>
                    
                    <div className="mb-6">
                      <h4 className="font-semibold text-gray-900 mb-3">Key Benefits:</h4>
                      <ul className="space-y-2">
                        {useCase.benefits.map((benefit, index) => (
                          <li key={index} className="flex items-start text-sm text-gray-600">
                            <span className="text-brand-green mr-2">✓</span>
                            {benefit}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="space-y-3">
                      <Button className="w-full bg-brand-blue hover:bg-primary-700">
                        Use This Template
                      </Button>
                      <Button variant="outline" className="w-full">
                        View Demo
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Industry Applications */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Industry Applications</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                See how different industries are leveraging AI agents to transform their operations.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="bg-brand-blue/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <ShoppingCart className="h-8 w-8 text-brand-blue" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Retail & E-commerce</h3>
                <p className="text-gray-600">Customer support, product recommendations, order management</p>
              </div>
              <div className="text-center">
                <div className="bg-brand-green/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Headphones className="h-8 w-8 text-brand-green" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">SaaS & Technology</h3>
                <p className="text-gray-600">User onboarding, technical support, feature announcements</p>
              </div>
              <div className="text-center">
                <div className="bg-brand-blue/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-brand-blue" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Professional Services</h3>
                <p className="text-gray-600">Lead qualification, appointment booking, client communication</p>
              </div>
              <div className="text-center">
                <div className="bg-brand-green/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <FileText className="h-8 w-8 text-brand-green" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Content & Media</h3>
                <p className="text-gray-600">Content creation, social media management, audience engagement</p>
              </div>
            </div>
          </div>
        </section>

        {/* Success Stories */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Success Stories</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Real results from businesses using AI agents to transform their operations.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="text-3xl font-bold text-brand-blue mb-2">85%</div>
                  <p className="text-gray-600 mb-4">Reduction in response time</p>
                  <p className="text-sm text-gray-500">E-commerce company using customer support AI</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="text-3xl font-bold text-brand-green mb-2">3x</div>
                  <p className="text-gray-600 mb-4">Increase in qualified leads</p>
                  <p className="text-sm text-gray-500">B2B SaaS using lead qualification AI</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="text-3xl font-bold text-brand-blue mb-2">60%</div>
                  <p className="text-gray-600 mb-4">Time saved on content creation</p>
                  <p className="text-sm text-gray-500">Marketing agency using content AI</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-gradient-to-r from-brand-blue to-brand-green text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Build Your AI Agent?</h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              Choose from our library of proven templates or create a custom solution for your specific needs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button className="bg-white text-brand-blue hover:bg-white/90 text-lg px-8 py-3">
                Browse Templates
              </Button>
              <Button variant="outline" className="border-white text-white hover:bg-white/10 text-lg px-8 py-3">
                Start Building
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}