import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import WaitlistForm from "@/components/WaitlistForm";
import SubscriptionForm from "@/components/SubscriptionForm";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import AuthGuard from "@/components/AuthGuard";

// Icons
import {
  Grip,
  BrainIcon,
  RocketIcon,
  Folder,
  BarChartIcon,
  UsersIcon,
} from "lucide-react";

export default function LandingPage() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  // Redirect to dashboard if user is already logged in
  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  return (
    <AuthGuard requireAuth={false}>
      <div className="flex flex-col min-h-screen">
        <div className="flex-grow">
          {/* Hero Section */}
          <section className="bg-gradient-to-b from-primary-50 to-white py-12 md:py-20">
            <div className="container mx-auto px-4">
              <div className="flex flex-col md:flex-row items-center">
                <div className="md:w-1/2 md:pr-12 mb-10 md:mb-0">
                  <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-6">
                    Build AI Agents{" "}
                    <span className="text-primary-600">Without Code</span>
                  </h1>
                  <p className="text-xl text-gray-600 mb-8">
                    Create, deploy, and manage custom AI agents with a simple
                    drag-and-drop interface. No technical expertise required.
                  </p>
                  <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                    <Button
                      onClick={() =>
                        document.getElementById("signup-button")?.click()
                      }
                      className="h-auto px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white"
                      size="lg"
                    >
                      Start Building for Free
                    </Button>
                    <Button
                      variant="outline"
                      className="h-auto px-6 py-3 border border-gray-300 hover:border-gray-400 text-gray-700 flex items-center justify-center space-x-2"
                      size="lg"
                      onClick={() => setIsVideoModalOpen(true)}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="12" cy="12" r="10"></circle>
                        <polygon points="10 8 16 12 10 16 10 8"></polygon>
                      </svg>
                      <span>Watch Demo</span>
                    </Button>
                  </div>
                </div>
                <div className="md:w-1/2">
                  <img
                    src="https://images.unsplash.com/photo-1581089781785-603411fa81e5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"
                    alt="AI agent visualization showing connected nodes with flowing data"
                    className="rounded-lg shadow-xl w-full"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Social Proof Section */}
          <section className="py-10 bg-white">
            <div className="container mx-auto px-4">
              <p className="text-center text-gray-500 mb-8">
                Trusted by innovative teams at
              </p>
              <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16">
                <div className="text-gray-400 font-medium text-lg">
                  ACME Inc.
                </div>
                <div className="text-gray-400 font-medium text-lg">
                  TechCorp
                </div>
                <div className="text-gray-400 font-medium text-lg">
                  InnovateAI
                </div>
                <div className="text-gray-400 font-medium text-lg">
                  FutureSystems
                </div>
                <div className="text-gray-400 font-medium text-lg">
                  NextWave
                </div>
              </div>
            </div>
          </section>

          {/* Features Section */}
          <section id="features" className="py-16 bg-gray-50">
            <div className="container mx-auto px-4">
              <div className="text-center mb-16">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  Powerful Features
                </h2>
                <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                  Everything you need to create, test, and deploy intelligent AI
                  agents that solve real business problems.
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {/* Feature 1 */}
                <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100 hover:shadow-md transition duration-200">
                  <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-lg flex items-center justify-center mb-4">
                    <Grip className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Visual Builder
                  </h3>
                  <p className="text-gray-600">
                    Drag and drop components to design your agent workflow
                    without writing any code.
                  </p>
                </div>

                {/* Feature 2 */}
                <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100 hover:shadow-md transition duration-200">
                  <div className="w-12 h-12 bg-green-100 text-green-600 rounded-lg flex items-center justify-center mb-4">
                    <BrainIcon className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    GPT Integration
                  </h3>
                  <p className="text-gray-600">
                    Seamlessly integrate with OpenAI's GPT models to power your
                    agent with advanced AI capabilities.
                  </p>
                </div>

                {/* Feature 3 */}
                <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100 hover:shadow-md transition duration-200">
                  <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center mb-4">
                    <RocketIcon className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    One-Click Deploy
                  </h3>
                  <p className="text-gray-600">
                    Deploy your agents to production with a single click and
                    make them available to your users.
                  </p>
                </div>

                {/* Feature 4 */}
                <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100 hover:shadow-md transition duration-200">
                  <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center mb-4">
                    <Folder className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Templates Library
                  </h3>
                  <p className="text-gray-600">
                    Start from pre-built templates for common use cases and
                    customize them to your needs.
                  </p>
                </div>

                {/* Feature 5 */}
                <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100 hover:shadow-md transition duration-200">
                  <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-lg flex items-center justify-center mb-4">
                    <BarChartIcon className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Performance Analytics
                  </h3>
                  <p className="text-gray-600">
                    Track how your agents are performing with comprehensive
                    analytics and metrics.
                  </p>
                </div>

                {/* Feature 6 */}
                <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100 hover:shadow-md transition duration-200">
                  <div className="w-12 h-12 bg-teal-100 text-teal-600 rounded-lg flex items-center justify-center mb-4">
                    <UsersIcon className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Collaborative Workspace
                  </h3>
                  <p className="text-gray-600">
                    Work together with your team to build, test, and refine
                    agent workflows.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* How It Works Section */}
          <section className="py-16 bg-white">
            <div className="container mx-auto px-4">
              <div className="text-center mb-16">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  How It Works
                </h2>
                <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                  Building an AI agent is as simple as connecting a few blocks
                  together.
                </p>
              </div>

              <div className="flex flex-col md:flex-row items-center justify-between">
                <div className="md:w-2/5 mb-10 md:mb-0">
                  <div className="space-y-8">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 bg-primary-100 rounded-full w-10 h-10 flex items-center justify-center text-primary-600 font-bold mr-4">
                        1
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                          Design your flow
                        </h3>
                        <p className="text-gray-600">
                          Drag input, processing, and output blocks onto the
                          canvas and connect them in a logical flow.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="flex-shrink-0 bg-primary-100 rounded-full w-10 h-10 flex items-center justify-center text-primary-600 font-bold mr-4">
                        2
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                          Configure AI behavior
                        </h3>
                        <p className="text-gray-600">
                          Set up GPT blocks with the right prompts and
                          parameters to achieve your desired outcomes.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="flex-shrink-0 bg-primary-100 rounded-full w-10 h-10 flex items-center justify-center text-primary-600 font-bold mr-4">
                        3
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                          Test and refine
                        </h3>
                        <p className="text-gray-600">
                          Use the built-in testing tools to validate your
                          agent's performance and make adjustments.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="flex-shrink-0 bg-primary-100 rounded-full w-10 h-10 flex items-center justify-center text-primary-600 font-bold mr-4">
                        4
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                          Deploy and monitor
                        </h3>
                        <p className="text-gray-600">
                          Deploy your agent with one click and monitor its
                          performance in real-time with analytics.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="md:w-1/2">
                  <img
                    src="https://images.unsplash.com/photo-1643116774075-acc00caa9a7b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"
                    alt="Person using the drag-and-drop interface to build an AI agent"
                    className="rounded-lg shadow-lg w-full"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Pricing Section */}
          <section id="pricing" className="py-16 bg-gray-50">
            <div className="container mx-auto px-4">
              <div className="text-center mb-16">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  Simple, Transparent Pricing
                </h2>
                <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                  Choose the plan that's right for you, from individual creators
                  to enterprise teams.
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                {/* Free Plan */}
                <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-200 flex flex-col">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Free</h3>
                  <div className="text-4xl font-bold text-gray-900 mb-6">
                    $0
                    <span className="text-lg text-gray-500 font-normal">
                      /month
                    </span>
                  </div>

                  <ul className="space-y-3 mb-8">
                    <li className="flex items-start">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-green-500 mt-1 mr-2"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>2 AI agents</span>
                    </li>
                    <li className="flex items-start">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-green-500 mt-1 mr-2"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>Basic templates</span>
                    </li>
                    <li className="flex items-start">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-green-500 mt-1 mr-2"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>100 GPT API calls/month</span>
                    </li>
                    <li className="flex items-start">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-green-500 mt-1 mr-2"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>Community support</span>
                    </li>
                  </ul>

                  <Button
                    variant="outline"
                    className="mt-auto"
                    onClick={() =>
                      document.getElementById("signup-button")?.click()
                    }
                  >
                    Get Started
                  </Button>
                </div>

                {/* Pro Plan */}
                <div className="bg-white rounded-xl shadow-lg p-8 border border-primary-200 flex flex-col relative scale-105 z-10">
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-primary-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Pro</h3>
                  <div className="text-4xl font-bold text-gray-900 mb-6">
                    $29
                    <span className="text-lg text-gray-500 font-normal">
                      /month
                    </span>
                  </div>

                  <ul className="space-y-3 mb-8">
                    <li className="flex items-start">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-green-500 mt-1 mr-2"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>Unlimited AI agents</span>
                    </li>
                    <li className="flex items-start">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-green-500 mt-1 mr-2"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>All templates</span>
                    </li>
                    <li className="flex items-start">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-green-500 mt-1 mr-2"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>5,000 GPT API calls/month</span>
                    </li>
                    <li className="flex items-start">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-green-500 mt-1 mr-2"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>Priority support</span>
                    </li>
                    <li className="flex items-start">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-green-500 mt-1 mr-2"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>Advanced analytics</span>
                    </li>
                  </ul>

                  <Button
                    className="mt-auto"
                    onClick={() =>
                      document.getElementById("signup-button")?.click()
                    }
                  >
                    Get Started
                  </Button>
                </div>

                {/* Enterprise Plan */}
                <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-200 flex flex-col">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Enterprise
                  </h3>
                  <div className="text-4xl font-bold text-gray-900 mb-6">
                    $99
                    <span className="text-lg text-gray-500 font-normal">
                      /month
                    </span>
                  </div>

                  <ul className="space-y-3 mb-8">
                    <li className="flex items-start">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-green-500 mt-1 mr-2"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>Everything in Pro</span>
                    </li>
                    <li className="flex items-start">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-green-500 mt-1 mr-2"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>Unlimited API calls</span>
                    </li>
                    <li className="flex items-start">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-green-500 mt-1 mr-2"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>Custom integrations</span>
                    </li>
                    <li className="flex items-start">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-green-500 mt-1 mr-2"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>Dedicated support</span>
                    </li>
                    <li className="flex items-start">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-green-500 mt-1 mr-2"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>SSO & advanced security</span>
                    </li>
                  </ul>

                  <Button
                    variant="outline"
                    className="mt-auto"
                    onClick={() =>
                      document.getElementById("signup-button")?.click()
                    }
                  >
                    Contact Sales
                  </Button>
                </div>
              </div>
            </div>
          </section>

          {/* Testimonials Section */}
          <section className="py-16 bg-white">
            <div className="container mx-auto px-4">
              <div className="text-center mb-16">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  What Our Users Say
                </h2>
                <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                  Hear from businesses that have transformed their operations
                  with AI agent workflows.
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                {/* Testimonial 1 */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <div className="flex items-center mb-4">
                    <div className="flex text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <svg
                          key={i}
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                  </div>
                  <p className="text-gray-600 mb-4">
                    "We were able to automate our customer support triage
                    process using an AI agent built in just 2 hours. What used
                    to take a team of 3 people is now handled automatically with
                    better accuracy."
                  </p>
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-gray-200 mr-3"></div>
                    <div>
                      <h4 className="font-medium text-gray-900">
                        Sarah Johnson
                      </h4>
                      <p className="text-gray-500 text-sm">CTO, SupportHero</p>
                    </div>
                  </div>
                </div>

                {/* Testimonial 2 */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <div className="flex items-center mb-4">
                    <div className="flex text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <svg
                          key={i}
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                  </div>
                  <p className="text-gray-600 mb-4">
                    "The visual builder made it incredibly easy for our
                    marketing team to create content generation agents without
                    needing to involve our engineering team. Game changer for
                    our workflow."
                  </p>
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-gray-200 mr-3"></div>
                    <div>
                      <h4 className="font-medium text-gray-900">
                        Michael Rodriguez
                      </h4>
                      <p className="text-gray-500 text-sm">
                        Marketing Director, BrandGrowth
                      </p>
                    </div>
                  </div>
                </div>

                {/* Testimonial 3 */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <div className="flex items-center mb-4">
                    <div className="flex text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <svg
                          key={i}
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                  </div>
                  <p className="text-gray-600 mb-4">
                    "We've integrated custom AI agents into our logistics
                    operation to optimize routing and scheduling. The ROI has
                    been incredible - we've reduced delivery times by 23% in
                    just two months."
                  </p>
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-gray-200 mr-3"></div>
                    <div>
                      <h4 className="font-medium text-gray-900">David Chen</h4>
                      <p className="text-gray-500 text-sm">
                        Operations Lead, LogisticsPro
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* CTA / Newsletter Section */}
          <section className="py-16 bg-gradient-to-br from-purple-600 via-purple-700 to-blue-600 text-white relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23%23%239C92AC%22%20fill-opacity%3D%220.1%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%224%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>

            <div className="container mx-auto px-4 relative z-10">
              <div className="max-w-4xl mx-auto text-center">
                {/* Badge */}
                <div className="inline-flex items-center bg-white/20 backdrop-blur-sm rounded-full px-6 py-2 mb-8">
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-white font-medium">
                    Join 10,000+ AI Enthusiasts
                  </span>
                </div>

                <h2 className="text-4xl md:text-5xl font-bold mb-6">
                  Join the AI Revolution
                </h2>
                <p className="text-xl md:text-2xl text-purple-100 mb-12 max-w-3xl mx-auto leading-relaxed">
                  Get exclusive access to new templates, features, and AI
                  insights delivered to your inbox.
                </p>

                {/* Enhanced Subscription Form */}
                <SubscriptionForm />

                <p className="text-purple-200 mt-6 text-sm">
                  ✨ Free forever • 🚀 No spam • 📧 Unsubscribe anytime
                </p>

                {/* Social Proof */}
                <div className="mt-12 flex flex-wrap justify-center items-center gap-8 opacity-80">
                  <div className="text-center">
                    <div className="text-2xl font-bold">10,000+</div>
                    <div className="text-sm text-purple-200">Active Users</div>
                  </div>
                  <div className="hidden sm:block w-px h-8 bg-purple-300"></div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">50,000+</div>
                    <div className="text-sm text-purple-200">
                      Agents Created
                    </div>
                  </div>
                  <div className="hidden sm:block w-px h-8 bg-purple-300"></div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">99.9%</div>
                    <div className="text-sm text-purple-200">Uptime</div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <Footer />

        {/* Video Modal */}
        <Dialog open={isVideoModalOpen} onOpenChange={setIsVideoModalOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Watch Demo</DialogTitle>
            </DialogHeader>
            <iframe
              width="100%"
              height="315"
              src="https://www.youtube.com/embed/dQw4w9WgXcQ" // Replace with your Google Drive embed link
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            ></iframe>
          </DialogContent>
        </Dialog>
      </div>
    </AuthGuard>
  );
}
