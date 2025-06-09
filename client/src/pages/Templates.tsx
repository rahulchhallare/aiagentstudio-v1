import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import Sidebar from "@/components/dashboard/Sidebar";
import { Button } from "@/components/ui/button";
import {
  Bot,
  FileText,
  Zap,
  Database,
  MessageSquare,
  Brain,
} from "lucide-react";
import Footer from "@/components/Footer";

export default function Templates() {
  const [, navigate] = useLocation();
  const { user, isLoading: authLoading } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // No redirect needed - allow non-authenticated users to view templates

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Template categories
  const templateCategories = [
    {
      name: "Customer Support",
      templates: [
        {
          id: "cs-1",
          name: "FAQ Responder",
          description:
            "Answers common customer questions based on a provided knowledge base.",
          icon: <MessageSquare className="h-12 w-12 text-primary-600" />,
        },
        {
          id: "cs-2",
          name: "Ticket Classifier",
          description:
            "Analyzes support tickets and routes them to the appropriate department.",
          icon: <Bot className="h-12 w-12 text-green-600" />,
        },
      ],
    },
    {
      name: "Content Creation",
      templates: [
        {
          id: "cc-1",
          name: "Blog Writer",
          description:
            "Generates blog post drafts based on a topic and outline.",
          icon: <FileText className="h-12 w-12 text-purple-600" />,
        },
        {
          id: "cc-2",
          name: "Social Media Creator",
          description:
            "Creates engaging social media posts for multiple platforms.",
          icon: <Zap className="h-12 w-12 text-amber-600" />,
        },
      ],
    },
    {
      name: "Data Processing",
      templates: [
        {
          id: "dp-1",
          name: "Data Summarizer",
          description:
            "Analyzes structured data and generates human-readable summaries.",
          icon: <Database className="h-12 w-12 text-blue-600" />,
        },
        {
          id: "dp-2",
          name: "Research Assistant",
          description: "Helps with literature reviews and research synthesis.",
          icon: <Brain className="h-12 w-12 text-teal-600" />,
        },
      ],
    },
  ];

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Sidebar - only show for logged-in users */}
      {user && (
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div
        className={`flex-1 ${user ? "ml-0 lg:ml-64" : "ml-0"} transition-all duration-300 overflow-y-auto`}
      >
        <div className="w-full px-6 py-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-12 text-center">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Agent Templates
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Get started quickly with pre-built agent templates designed for various use cases
              </p>
            </div>

            <div className="space-y-16">
              {templateCategories.map((category, index) => (
                <div key={index}>
                  <div className="mb-8">
                    <h2 className="text-3xl font-semibold text-gray-900 mb-3">
                      {category.name}
                    </h2>
                    <div className="w-24 h-1 bg-gradient-to-r from-primary-600 to-purple-500 rounded"></div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {category.templates.map((template) => (
                      <div
                        key={template.id}
                        className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 hover:shadow-lg hover:border-primary-200 transition-all duration-300 group"
                      >
                        <div className="mb-6 group-hover:scale-110 transition-transform duration-300">{template.icon}</div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-3">
                          {template.name}
                        </h3>
                        <p className="text-gray-600 mb-6 leading-relaxed">
                          {template.description}
                        </p>
                        <Button
                          className="w-full py-3 text-base font-medium"
                          onClick={() => {
                            if (!user) {
                              // Redirect to home page with login prompt for non-logged-in users
                              navigate("/");
                              return;
                            }
                            // Store template ID for the builder to load
                            localStorage.setItem("selectedTemplate", template.id);
                            navigate("/builder");
                          }}
                        >
                          {user ? "Use Template" : "Sign up to use"}
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <Footer />
      </div>
    </div>
  );
}
