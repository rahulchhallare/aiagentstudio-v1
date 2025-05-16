import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, Cpu, Network, Code, Sparkles, Zap, Lock, Globe } from "lucide-react";

export default function Features() {
  const features = [
    {
      title: "Visual Agent Builder",
      description: "Create AI agents through an intuitive drag-and-drop interface with no coding required.",
      icon: <Network className="h-12 w-12 text-primary-600" />,
    },
    {
      title: "Multiple AI Models",
      description: "Choose from a variety of AI models to power your agents, from GPT-3.5 to the latest GPT-4o.",
      icon: <Bot className="h-12 w-12 text-blue-600" />,
    },
    {
      title: "Customizable Templates",
      description: "Start with pre-built templates for common use cases and customize them to fit your needs.",
      icon: <Cpu className="h-12 w-12 text-purple-600" />,
    },
    {
      title: "API Integration",
      description: "Connect your agents to external APIs and services to expand their capabilities.",
      icon: <Code className="h-12 w-12 text-green-600" />,
    },
    {
      title: "Advanced Prompt Engineering",
      description: "Fine-tune your agent's responses with powerful prompt engineering tools.",
      icon: <Sparkles className="h-12 w-12 text-amber-600" />,
    },
    {
      title: "Webhook Support",
      description: "Set up webhooks to trigger actions in other systems when your agents process requests.",
      icon: <Zap className="h-12 w-12 text-red-600" />,
    },
    {
      title: "Secure Authentication",
      description: "Protect your agents with robust authentication and role-based access control.",
      icon: <Lock className="h-12 w-12 text-gray-600" />,
    },
    {
      title: "Global Deployment",
      description: "Deploy your agents on our global network for low-latency responses worldwide.",
      icon: <Globe className="h-12 w-12 text-teal-600" />,
    },
  ];

  return (
    <div className="container max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Platform Features</h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          AIagentStudio.ai provides everything you need to build, deploy, and manage powerful AI agents.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
        {features.map((feature, index) => (
          <Card key={index} className="border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="mb-4">{feature.icon}</div>
              <CardTitle className="text-xl">{feature.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-600 text-base">
                {feature.description}
              </CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="bg-primary-50 rounded-2xl p-8 md:p-12 mb-16">
        <div className="md:flex items-center">
          <div className="md:w-2/3 mb-8 md:mb-0 md:pr-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to build your first AI agent?</h2>
            <p className="text-lg text-gray-600 mb-6">
              Get started today and join thousands of businesses leveraging the power of AI to automate tasks,
              enhance customer experiences, and drive innovation.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button size="lg" className="bg-primary-600 hover:bg-primary-700">
                Sign Up Free
              </Button>
              <Button size="lg" variant="outline">
                View Pricing
              </Button>
            </div>
          </div>
          <div className="md:w-1/3 bg-white p-6 rounded-xl shadow-md">
            <h3 className="text-xl font-semibold mb-4">Featured Use Cases</h3>
            <ul className="space-y-3">
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                <span>Customer support automation</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                <span>Content creation and summaries</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                <span>Data extraction and analysis</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                <span>Personalized recommendations</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="text-center mb-16">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">How It Works</h2>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-12">
          Building AI agents with AIagentStudio.ai is simple, fast, and doesn't require coding skills.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="bg-primary-100 text-primary-700 w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">1</div>
            <h3 className="text-xl font-semibold mb-2">Design Your Agent</h3>
            <p className="text-gray-600">
              Use our visual editor to design your agent's workflow by connecting input, AI, and output blocks.
            </p>
          </div>
          <div className="text-center">
            <div className="bg-primary-100 text-primary-700 w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">2</div>
            <h3 className="text-xl font-semibold mb-2">Configure & Test</h3>
            <p className="text-gray-600">
              Configure each block with your desired settings and test your agent in real-time.
            </p>
          </div>
          <div className="text-center">
            <div className="bg-primary-100 text-primary-700 w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">3</div>
            <h3 className="text-xl font-semibold mb-2">Deploy & Share</h3>
            <p className="text-gray-600">
              Deploy your agent with one click and share it via API, embed code, or direct link.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Check(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}