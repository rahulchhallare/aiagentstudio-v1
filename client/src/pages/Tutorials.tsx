import { useState } from "react";
import { Play, Clock, User, ChevronRight, Search, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import Footer from "@/components/Footer";

interface Tutorial {
  id: string;
  title: string;
  description: string;
  duration: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  category: string;
  author: string;
  videoUrl?: string;
  isVideo: boolean;
  tags: string[];
}

const tutorials: Tutorial[] = [
  {
    id: "getting-started",
    title: "Getting Started with AI Agent Studio",
    description: "Learn the basics of creating your first AI agent using our drag-and-drop interface. Perfect for beginners.",
    duration: "10 min",
    difficulty: "Beginner",
    category: "Getting Started",
    author: "Sarah Chen",
    isVideo: true,
    tags: ["basics", "first-agent", "interface"]
  },
  {
    id: "customer-support-bot",
    title: "Building a Customer Support Chatbot",
    description: "Step-by-step guide to creating an intelligent customer support agent that can handle common inquiries.",
    duration: "25 min",
    difficulty: "Intermediate",
    category: "Customer Service",
    author: "Marcus Rodriguez",
    isVideo: true,
    tags: ["chatbot", "customer-service", "automation"]
  },
  {
    id: "content-generator",
    title: "Creating a Content Generation Agent",
    description: "Build an AI agent that generates blog posts, social media content, and marketing copy tailored to your brand.",
    duration: "30 min",
    difficulty: "Intermediate",
    category: "Content Creation",
    author: "Emma Thompson",
    isVideo: true,
    tags: ["content", "writing", "marketing"]
  },
  {
    id: "api-integration",
    title: "Integrating External APIs",
    description: "Learn how to connect your AI agents to external services and APIs for enhanced functionality.",
    duration: "20 min",
    difficulty: "Advanced",
    category: "Integration",
    author: "David Kim",
    isVideo: false,
    tags: ["api", "integration", "webhooks"]
  },
  {
    id: "workflow-automation",
    title: "Advanced Workflow Automation",
    description: "Create complex multi-step workflows that combine multiple AI models and decision logic.",
    duration: "35 min",
    difficulty: "Advanced",
    category: "Advanced",
    author: "Lisa Zhang",
    isVideo: true,
    tags: ["workflow", "automation", "advanced"]
  },
  {
    id: "data-analysis-agent",
    title: "Building a Data Analysis Agent",
    description: "Create an AI agent that can analyze datasets, generate insights, and create automated reports.",
    duration: "28 min",
    difficulty: "Intermediate",
    category: "Analytics",
    author: "Alex Johnson",
    isVideo: true,
    tags: ["data", "analytics", "reports"]
  },
  {
    id: "deployment-guide",
    title: "Deploying Your AI Agents",
    description: "Learn different deployment options and best practices for making your AI agents accessible to users.",
    duration: "15 min",
    difficulty: "Beginner",
    category: "Deployment",
    author: "Maria Garcia",
    isVideo: false,
    tags: ["deployment", "hosting", "production"]
  },
  {
    id: "prompt-engineering",
    title: "Advanced Prompt Engineering",
    description: "Master the art of crafting effective prompts to get the best results from your AI agents.",
    duration: "22 min",
    difficulty: "Intermediate",
    category: "Optimization",
    author: "James Wilson",
    isVideo: true,
    tags: ["prompts", "optimization", "ai-models"]
  }
];

const categories = ["All", "Getting Started", "Customer Service", "Content Creation", "Integration", "Advanced", "Analytics", "Deployment", "Optimization"];
const difficulties = ["All", "Beginner", "Intermediate", "Advanced"];

export default function Tutorials() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedDifficulty, setSelectedDifficulty] = useState("All");

  const filteredTutorials = tutorials.filter(tutorial => {
    const matchesSearch = tutorial.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tutorial.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tutorial.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === "All" || tutorial.category === selectedCategory;
    const matchesDifficulty = selectedDifficulty === "All" || tutorial.difficulty === selectedDifficulty;
    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Beginner":
        return "bg-brand-green text-white";
      case "Intermediate":
        return "bg-yellow-500 text-white";
      case "Advanced":
        return "bg-red-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-primary-50 to-white py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Learn AI Agent <span className="text-brand-blue">Development</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Master the art of building AI agents with our comprehensive tutorials. From beginner basics to advanced techniques.
            </p>
          </div>
        </section>

        {/* Search and Filters */}
        <section className="py-8 bg-white border-b">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    type="text"
                    placeholder="Search tutorials..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex gap-4">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  >
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                  <select
                    value={selectedDifficulty}
                    onChange={(e) => setSelectedDifficulty(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  >
                    {difficulties.map(difficulty => (
                      <option key={difficulty} value={difficulty}>{difficulty}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="text-center text-gray-600">
                Showing {filteredTutorials.length} of {tutorials.length} tutorials
              </div>
            </div>
          </div>
        </section>

        {/* Tutorials Grid */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredTutorials.map((tutorial) => (
                <Card key={tutorial.id} className="hover:shadow-lg transition-shadow duration-200">
                  <CardHeader>
                    <div className="flex items-center justify-between mb-4">
                      <Badge variant="secondary">{tutorial.category}</Badge>
                      <Badge className={getDifficultyColor(tutorial.difficulty)}>
                        {tutorial.difficulty}
                      </Badge>
                    </div>
                    <CardTitle className="text-xl line-clamp-2">{tutorial.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4 line-clamp-3">{tutorial.description}</p>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {tutorial.duration}
                      </div>
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-1" />
                        {tutorial.author}
                      </div>
                      {tutorial.isVideo && (
                        <div className="flex items-center">
                          <Play className="h-4 w-4 mr-1" />
                          Video
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 mb-6">
                      {tutorial.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>

                    <Button className="w-full bg-brand-blue hover:bg-primary-700">
                      <Play className="h-4 w-4 mr-2" />
                      Start Tutorial
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredTutorials.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg mb-4">No tutorials found matching your criteria.</p>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("All");
                    setSelectedDifficulty("All");
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        </section>

        {/* Learning Path */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Recommended Learning Path</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Follow this structured path to master AI agent development from basics to advanced techniques.
              </p>
            </div>
            <div className="max-w-4xl mx-auto">
              <div className="space-y-6">
                {[
                  { step: 1, title: "Getting Started with AI Agent Studio", duration: "10 min", completed: false },
                  { step: 2, title: "Building Your First Chatbot", duration: "25 min", completed: false },
                  { step: 3, title: "Advanced Prompt Engineering", duration: "22 min", completed: false },
                  { step: 4, title: "Integrating External APIs", duration: "20 min", completed: false },
                  { step: 5, title: "Deploying Your AI Agents", duration: "15 min", completed: false }
                ].map((item) => (
                  <div key={item.step} className="flex items-center p-6 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0 w-10 h-10 bg-brand-blue text-white rounded-full flex items-center justify-center font-semibold mr-4">
                      {item.step}
                    </div>
                    <div className="flex-grow">
                      <h3 className="font-semibold text-gray-900">{item.title}</h3>
                      <p className="text-gray-600 text-sm">{item.duration}</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-gradient-to-r from-brand-blue to-brand-green text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">Start Building Today</h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              Put your knowledge into practice. Start building your first AI agent now.
            </p>
            <Button className="bg-white text-brand-blue hover:bg-white/90 text-lg px-8 py-3">
              Create Your First Agent
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}