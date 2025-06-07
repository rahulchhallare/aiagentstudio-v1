import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, BookOpen, Code, FileText, PlayCircle, ChevronRight } from "lucide-react";
import Footer from '@/components/Footer';

export default function Documentation() {
  const [searchQuery, setSearchQuery] = useState("");

  // Navigation categories and topics
  const docSections = {
    "Getting Started": [
      "Introduction to AIagentStudio",
      "Creating your first agent",
      "Understanding the interface",
      "Agent deployment basics",
    ],
    "Core Concepts": [
      "Agent architecture",
      "Input and output blocks",
      "GPT integration",
      "Flow control",
      "Data handling",
    ],
    "Advanced Topics": [
      "Custom prompt engineering",
      "External API integration",
      "Webhook configuration",
      "Authentication and security",
      "Performance optimization",
    ],
    "API Reference": [
      "Authentication",
      "Agent management",
      "Execution API",
      "Webhook events",
      "Rate limits and quotas",
    ],
  };

  const tableOfContents = [
    { id: "introduction", title: "Introduction", level: 1 },
    { id: "what-are-ai-agents", title: "What are AI agents?", level: 2 },
    { id: "key-features", title: "Key features", level: 2 },
    { id: "getting-started", title: "Getting started", level: 1 },
    { id: "installation", title: "Creating an account", level: 2 },
    { id: "first-agent", title: "Building your first agent", level: 2 },
    { id: "agent-components", title: "Agent components", level: 1 },
    { id: "input-blocks", title: "Input blocks", level: 2 },
    { id: "gpt-blocks", title: "GPT blocks", level: 2 },
    { id: "output-blocks", title: "Output blocks", level: 2 },
    { id: "connecting-blocks", title: "Connecting blocks", level: 2 },
  ];

  return (
    <div className="container max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <aside className="w-full md:w-64 lg:w-72 flex-shrink-0">
          <div className="sticky top-20">
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-2 flex items-center">
                <BookOpen className="h-5 w-5 mr-2" />
                Documentation
              </h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search docs..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <nav className="space-y-6">
              {Object.entries(docSections).map(([category, topics]) => (
                <div key={category}>
                  <h3 className="font-medium text-gray-900 mb-2">{category}</h3>
                  <ul className="space-y-1">
                    {topics.map((topic, index) => (
                      <li key={index}>
                        <a
                          href="#"
                          className="block px-2 py-1 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded"
                        >
                          {topic}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1">
          <Tabs defaultValue="guides" className="w-full mb-8">
            <TabsList className="w-full md:w-auto grid grid-cols-3 mb-6">
              <TabsTrigger value="guides" className="flex items-center">
                <BookOpen className="h-4 w-4 mr-2" />
                <span>Guides</span>
              </TabsTrigger>
              <TabsTrigger value="api" className="flex items-center">
                <Code className="h-4 w-4 mr-2" />
                <span>API Reference</span>
              </TabsTrigger>
              <TabsTrigger value="tutorials" className="flex items-center">
                <PlayCircle className="h-4 w-4 mr-2" />
                <span>Tutorials</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="guides">
              <div className="prose prose-primary max-w-none">
                <div className="flex justify-between items-center mb-6">
                  <h1 className="text-3xl font-bold m-0">Building Your First AI Agent</h1>
                  <div className="text-sm text-gray-500">Updated June 2, 2023</div>
                </div>

                {/* Table of contents */}
                <div className="bg-gray-50 rounded-lg p-4 mb-8">
                  <h3 className="text-lg font-medium mb-2">On this page</h3>
                  <nav>
                    <ul className="space-y-1">
                      {tableOfContents.map((item) => (
                        <li
                          key={item.id}
                          className={`${
                            item.level === 1 ? "font-medium" : "pl-4 text-gray-600"
                          }`}
                        >
                          <a
                            href={`#${item.id}`}
                            className="hover:text-primary-600 transition-colors"
                          >
                            {item.title}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </nav>
                </div>

                <h2 id="introduction">Introduction</h2>
                <p>
                  This guide will walk you through the process of building your first AI agent using
                  AIagentStudio.ai. By the end, you'll have a functional agent that can respond to user
                  inputs using OpenAI's GPT models.
                </p>

                <h3 id="what-are-ai-agents">What are AI agents?</h3>
                <p>
                  AI agents are autonomous programs built with artificial intelligence capabilities that can
                  perform tasks, make decisions, and interact with users or other systems on your behalf. In
                  AIagentStudio.ai, these agents are created using a visual drag-and-drop interface that
                  connects input, processing, and output blocks to create customized workflows.
                </p>

                <h3 id="key-features">Key features</h3>
                <ul>
                  <li>No coding required - build agents using a visual interface</li>
                  <li>Connect to powerful AI models like GPT-4</li>
                  <li>Process various types of inputs including text, images, and structured data</li>
                  <li>Customize AI responses with advanced prompt engineering</li>
                  <li>Deploy agents as APIs, chatbots, or embedded widgets</li>
                </ul>

                <h2 id="getting-started">Getting Started</h2>
                <p>
                  Before you can start building agents, you'll need to set up your AIagentStudio.ai
                  account and familiarize yourself with the interface.
                </p>

                <h3 id="installation">Creating an account</h3>
                <p>
                  To get started with AIagentStudio.ai, you'll need to create an account. Visit the
                  <a href="/" className="text-primary-600 hover:text-primary-700"> signup page </a>
                  and follow the instructions to create your account.
                </p>

                <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-blue-700">
                        You'll need an OpenAI API key to use the GPT models in your agents. You can obtain one
                        from the OpenAI website.
                      </p>
                    </div>
                  </div>
                </div>

                <h3 id="first-agent">Building your first agent</h3>
                <p>
                  Once you've created your account and logged in, you'll be taken to the dashboard. From
                  here, you can create a new agent by clicking the "Create New Agent" button.
                </p>
                <p>
                  This will open the Agent Builder interface, where you'll see three main panels:
                </p>
                <ol>
                  <li><strong>Components Panel:</strong> On the left, you'll find all the available blocks you can use to build your agent.</li>
                  <li><strong>Canvas:</strong> The central area where you'll design your agent by placing and connecting blocks.</li>
                  <li><strong>Properties Panel:</strong> On the right, you'll configure the properties of the selected block.</li>
                </ol>

                <h2 id="agent-components">Agent Components</h2>
                <p>
                  Agents are built using different types of blocks that handle different aspects of the
                  agent's functionality. Let's explore the main block types:
                </p>

                <h3 id="input-blocks">Input blocks</h3>
                <p>
                  Input blocks are the entry points for data into your agent. They can collect information
                  from users or external systems. Common input blocks include:
                </p>
                <ul>
                  <li><strong>Text Input:</strong> Collects text from the user</li>
                  <li><strong>File Upload:</strong> Allows users to upload files</li>
                  <li><strong>API Input:</strong> Receives data from external APIs</li>
                </ul>

                <h3 id="gpt-blocks">GPT blocks</h3>
                <p>
                  GPT blocks are the core of your AI agent. They process input data using OpenAI's GPT models
                  to generate intelligent responses. You can configure various parameters such as:
                </p>
                <ul>
                  <li><strong>Model Selection:</strong> Choose between GPT-3.5, GPT-4, or other available models</li>
                  <li><strong>System Prompt:</strong> Define the AI's persona and behavior</li>
                  <li><strong>Temperature:</strong> Control the randomness of the AI's responses</li>
                  <li><strong>Max Tokens:</strong> Limit the length of generated responses</li>
                </ul>

                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 my-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                        <path
                          fillRule="evenodd"
                          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-yellow-700">
                        Higher temperature values (closer to 1.0) will make responses more creative but
                        potentially less accurate. Lower values (closer to 0.0) make responses more
                        deterministic and focused.
                      </p>
                    </div>
                  </div>
                </div>

                <h3 id="output-blocks">Output blocks</h3>
                <p>
                  Output blocks determine how the processed data is presented to the user. Options include:
                </p>
                <ul>
                  <li><strong>Text Output:</strong> Displays text responses</li>
                  <li><strong>Markdown Output:</strong> Renders formatted text with Markdown</li>
                  <li><strong>JSON Output:</strong> Returns structured data in JSON format</li>
                </ul>

                <h3 id="connecting-blocks">Connecting blocks</h3>
                <p>
                  To create a functional agent, you need to connect your blocks in a logical flow:
                </p>
                <ol>
                  <li>Drag blocks from the Components Panel onto the Canvas</li>
                  <li>Connect blocks by clicking and dragging from one block's output node to another block's input node</li>
                  <li>Configure each block by selecting it and adjusting its properties in the Properties Panel</li>
                </ol>
                <p>
                  For a basic agent, you might connect a Text Input block to a GPT block, and then connect
                  the GPT block to a Text Output block. This creates a simple flow where the user's input is
                  processed by the AI and then displayed back to the user.
                </p>

                <div className="bg-green-50 border-l-4 border-green-400 p-4 mt-8 mb-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-green-700">
                        <strong>Pro tip:</strong> Test your agent frequently as you build it to make sure each
                        component works as expected. Use the "Test" button in the top-right corner of the
                        builder interface.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center border-t border-b border-gray-200 py-4 my-8">
                  <Button variant="link" className="flex items-center">
                    <ChevronRight className="h-4 w-4 mr-1 rotate-180" />
                    Previous: Introduction
                  </Button>
                  <Button variant="link" className="flex items-center">
                    Next: Advanced Configuration
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="api">
              <div className="prose max-w-none">
                <h1 className="text-3xl font-bold mb-6">API Reference</h1>
                <p className="lead-text text-lg text-gray-600 mb-8">
                  This comprehensive API reference documentation provides all the information you need to
                  interact with the AIagentStudio.ai API programmatically.
                </p>

                <div className="bg-gray-50 rounded-lg p-6 mb-8">
                  <h2 className="text-xl font-semibold mb-4">Authentication</h2>
                  <p className="mb-4">
                    All API requests must include your API key in the Authorization header:
                  </p>
                  <div className="bg-gray-900 text-gray-100 p-4 rounded font-mono text-sm overflow-x-auto">
                    Authorization: Bearer your_api_key_here
                  </div>
                </div>

                <h2 className="text-2xl font-bold mt-8 mb-4">Agents</h2>
                <p className="mb-6">
                  The Agents API allows you to create, retrieve, update, and delete AI agents.
                </p>

                <div className="border border-gray-200 rounded-md mb-6">
                  <div className="flex items-center p-4 border-b border-gray-200 bg-gray-50">
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-medium mr-3">
                      GET
                    </span>
                    <code className="font-mono">/api/agents</code>
                  </div>
                  <div className="p-4">
                    <h3 className="font-medium mb-2">List all agents</h3>
                    <p className="text-gray-600 mb-4">
                      Returns a list of all agents associated with your account.
                    </p>
                    <h4 className="font-medium text-sm text-gray-500 uppercase mt-4 mb-2">
                      Query Parameters
                    </h4>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Parameter
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Type
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Required
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Description
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          <tr>
                            <td className="px-4 py-2 whitespace-nowrap text-sm font-medium">
                              limit
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                              integer
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                              No
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-500">
                              Maximum number of agents to return (default: 10, max: 100)
                            </td>
                          </tr>
                          <tr>
                            <td className="px-4 py-2 whitespace-nowrap text-sm font-medium">
                              offset
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                              integer
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                              No
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-500">
                              Number of agents to skip (default: 0)
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-md mb-6">
                  <div className="flex items-center p-4 border-b border-gray-200 bg-gray-50">
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-medium mr-3">
                      POST
                    </span>
                    <code className="font-mono">/api/agents</code>
                  </div>
                  <div className="p-4">
                    <h3 className="font-medium mb-2">Create an agent</h3>
                    <p className="text-gray-600 mb-4">
                      Creates a new agent with the specified configuration.
                    </p>
                    <h4 className="font-medium text-sm text-gray-500 uppercase mt-4 mb-2">
                      Request Body
                    </h4>
                    <div className="bg-gray-900 text-gray-100 p-4 rounded font-mono text-sm overflow-x-auto mb-4">
                      {`{
  "name": "Customer Support Agent",
  "description": "Handles common customer inquiries",
  "flow_data": {
    "nodes": [...],
    "edges": [...]
  },
  "is_active": true
}`}
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="tutorials">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-100 aspect-video flex items-center justify-center">
                    <PlayCircle className="h-16 w-16 text-gray-400" />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-lg mb-2">Building a Customer Support Agent</h3>
                    <p className="text-gray-600 mb-4">
                      Learn how to create a support agent that can answer common customer questions based on
                      your knowledge base.
                    </p>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">15 min</span>
                      <Button variant="link" className="text-primary-600">
                        Watch Tutorial
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-100 aspect-video flex items-center justify-center">
                    <PlayCircle className="h-16 w-16 text-gray-400" />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-lg mb-2">Advanced Prompt Engineering</h3>
                    <p className="text-gray-600 mb-4">
                      Discover techniques to optimize your GPT prompts for better, more consistent responses.
                    </p>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">12 min</span>
                      <Button variant="link" className="text-primary-600">
                        Watch Tutorial
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-100 aspect-video flex items-center justify-center">
                    <PlayCircle className="h-16 w-16 text-gray-400" />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-lg mb-2">Integrating External APIs</h3>
                    <p className="text-gray-600 mb-4">
                      Learn how to connect your AI agents to external data sources and services.
                    </p>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">18 min</span>
                      <Button variant="link" className="text-primary-600">
                        Watch Tutorial
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-100 aspect-video flex items-center justify-center">
                    <PlayCircle className="h-16 w-16 text-gray-400" />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-lg mb-2">Deploying and Monitoring Agents</h3>
                    <p className="text-gray-600 mb-4">
                      Best practices for deploying agents and monitoring their performance in production.
                    </p>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">20 min</span>
                      <Button variant="link" className="text-primary-600">
                        Watch Tutorial
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      <Footer />
    </div>
  );
}