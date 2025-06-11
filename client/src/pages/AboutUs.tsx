import { Users, Target, Lightbulb, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Footer from "@/components/Footer";

export default function AboutUs() {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-primary-50 to-white py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              About <span className="text-brand-blue">AIAgentStudio.AI</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              We're democratizing AI by making it accessible to everyone. Our no-code platform empowers individuals and businesses to create powerful AI agents without technical expertise.
            </p>
          </div>
        </section>

        {/* Mission Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Mission</h2>
                <p className="text-lg text-gray-600 mb-6">
                  To break down the barriers between human creativity and artificial intelligence. We believe that everyone should have the power to create, deploy, and benefit from AI technology, regardless of their technical background.
                </p>
                <p className="text-lg text-gray-600">
                  Through our intuitive drag-and-drop interface, we're making AI development as simple as building with blocks, enabling a new generation of AI creators and innovators.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <Card>
                  <CardContent className="p-6 text-center">
                    <Users className="h-12 w-12 text-brand-blue mx-auto mb-4" />
                    <h3 className="font-semibold text-gray-900 mb-2">10,000+</h3>
                    <p className="text-gray-600">Active Users</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6 text-center">
                    <Target className="h-12 w-12 text-brand-green mx-auto mb-4" />
                    <h3 className="font-semibold text-gray-900 mb-2">50,000+</h3>
                    <p className="text-gray-600">AI Agents Created</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6 text-center">
                    <Lightbulb className="h-12 w-12 text-brand-blue mx-auto mb-4" />
                    <h3 className="font-semibold text-gray-900 mb-2">100+</h3>
                    <p className="text-gray-600">Templates Available</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6 text-center">
                    <Globe className="h-12 w-12 text-brand-green mx-auto mb-4" />
                    <h3 className="font-semibold text-gray-900 mb-2">50+</h3>
                    <p className="text-gray-600">Countries Served</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Values</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                These principles guide everything we do and shape how we build products for our community.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="bg-brand-blue/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                  <Users className="h-8 w-8 text-brand-blue" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Accessibility First</h3>
                <p className="text-gray-600">
                  We believe AI should be accessible to everyone, not just technical experts. Our platform is designed for creators of all backgrounds.
                </p>
              </div>
              <div className="text-center">
                <div className="bg-brand-green/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                  <Target className="h-8 w-8 text-brand-green" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Innovation</h3>
                <p className="text-gray-600">
                  We continuously push the boundaries of what's possible in no-code AI development, staying at the forefront of technology.
                </p>
              </div>
              <div className="text-center">
                <div className="bg-brand-blue/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                  <Lightbulb className="h-8 w-8 text-brand-blue" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Empowerment</h3>
                <p className="text-gray-600">
                  We empower individuals and businesses to transform their ideas into reality through the power of artificial intelligence.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Story Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Our Story</h2>
              <div className="prose prose-lg mx-auto text-gray-600">
                <p>
                  AIAgentStudio.AI was born from a simple observation: artificial intelligence was becoming incredibly powerful, but remained locked away behind complex code and technical barriers. Our founders, a team of AI researchers and product designers, envisioned a world where anyone could harness the power of AI to solve problems and create value.
                </p>
                <p>
                  In 2023, we set out to build the most intuitive AI development platform ever created. We started with a vision of drag-and-drop simplicity, but soon realized that true democratization of AI required more than just an easy interface—it required a fundamental rethinking of how AI systems are designed and deployed.
                </p>
                <p>
                  Today, AIAgentStudio.AI serves thousands of users worldwide, from small business owners automating customer service to content creators building personalized AI assistants. We're proud to be part of the no-code revolution that's putting powerful technology in the hands of everyone.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-gradient-to-r from-brand-blue to-brand-green text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Build Your AI Agent?</h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              Join thousands of creators who are already building the future with AI
            </p>
            <Button className="bg-white text-brand-blue hover:bg-white/90 text-lg px-8 py-3">
              Get Started Free
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}