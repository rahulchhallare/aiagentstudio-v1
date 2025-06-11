import { MapPin, Clock, Users, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Footer from "@/components/Footer";

interface JobPosition {
  id: string;
  title: string;
  department: string;
  location: string;
  type: string;
  experience: string;
  description: string;
  requirements: string[];
}

const openPositions: JobPosition[] = [
  {
    id: "1",
    title: "Senior Frontend Engineer",
    department: "Engineering",
    location: "Remote",
    type: "Full-time",
    experience: "3-5 years",
    description: "Join our frontend team to build intuitive interfaces for our no-code AI platform. You'll work with React, TypeScript, and cutting-edge UI technologies.",
    requirements: [
      "5+ years of React and TypeScript experience",
      "Experience with modern frontend build tools",
      "Strong understanding of responsive design",
      "Experience with AI/ML interfaces preferred"
    ]
  },
  {
    id: "2",
    title: "AI/ML Engineer",
    department: "Engineering",
    location: "Remote",
    type: "Full-time",
    experience: "4-6 years",
    description: "Lead the development of our AI agent execution engine and help integrate new AI models into our platform.",
    requirements: [
      "Strong background in machine learning",
      "Experience with OpenAI API and LLMs",
      "Python and Node.js proficiency",
      "Experience building scalable AI systems"
    ]
  },
  {
    id: "3",
    title: "Product Designer",
    department: "Design",
    location: "Remote",
    type: "Full-time",
    experience: "3-5 years",
    description: "Shape the future of no-code AI development by designing intuitive user experiences for complex AI workflows.",
    requirements: [
      "3+ years of product design experience",
      "Experience with design systems",
      "Figma/Sketch proficiency",
      "Understanding of developer tools and workflows"
    ]
  },
  {
    id: "4",
    title: "DevOps Engineer",
    department: "Engineering",
    location: "Remote",
    type: "Full-time",
    experience: "4-6 years",
    description: "Build and maintain the infrastructure that powers millions of AI agent executions. Focus on scalability, reliability, and performance.",
    requirements: [
      "Experience with AWS/GCP cloud platforms",
      "Kubernetes and Docker expertise",
      "CI/CD pipeline development",
      "Monitoring and observability tools"
    ]
  }
];

const benefits = [
  {
    title: "Competitive Salary",
    description: "Industry-leading compensation with equity packages",
    icon: Zap
  },
  {
    title: "Remote First",
    description: "Work from anywhere with flexible hours",
    icon: MapPin
  },
  {
    title: "Health & Wellness",
    description: "Comprehensive health, dental, and vision coverage",
    icon: Users
  },
  {
    title: "Learning Budget",
    description: "$2,000 annual budget for courses and conferences",
    icon: Clock
  }
];

export default function Careers() {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-primary-50 to-white py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Join Our <span className="text-brand-blue">Mission</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Help us democratize AI and build the future of no-code development. We're looking for passionate individuals who want to make AI accessible to everyone.
            </p>
            <Button className="bg-brand-blue hover:bg-primary-700 text-white">
              View Open Positions
            </Button>
          </div>
        </section>

        {/* Why Work Here Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Why AIAgentStudio.AI?</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                We're not just building a product—we're creating a movement that will transform how people interact with artificial intelligence.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {benefits.map((benefit) => (
                <div key={benefit.title} className="text-center">
                  <div className="bg-brand-blue/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                    <benefit.icon className="h-8 w-8 text-brand-blue" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">{benefit.title}</h3>
                  <p className="text-gray-600">{benefit.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Open Positions Section */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Open Positions</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Join our growing team and help shape the future of AI development
              </p>
            </div>
            <div className="grid gap-6 max-w-4xl mx-auto">
              {openPositions.map((position) => (
                <Card key={position.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl text-gray-900 mb-2">{position.title}</CardTitle>
                        <div className="flex flex-wrap gap-2 mb-2">
                          <Badge variant="secondary">{position.department}</Badge>
                          <Badge variant="outline">{position.type}</Badge>
                          <Badge variant="outline">{position.location}</Badge>
                        </div>
                      </div>
                      <Button className="bg-brand-blue hover:bg-primary-700">
                        Apply Now
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4">{position.description}</p>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Requirements:</h4>
                      <ul className="text-gray-600 space-y-1">
                        {position.requirements.map((req, index) => (
                          <li key={index} className="flex items-start">
                            <span className="text-brand-blue mr-2">•</span>
                            {req}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Culture Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-8">Our Culture</h2>
              <div className="grid md:grid-cols-3 gap-8">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Innovation First</h3>
                  <p className="text-gray-600">
                    We encourage experimentation and creative problem-solving. Your ideas matter and can shape our product direction.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Work-Life Balance</h3>
                  <p className="text-gray-600">
                    We believe great work comes from well-rested, fulfilled people. Flexible hours and unlimited PTO.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Growth Mindset</h3>
                  <p className="text-gray-600">
                    Continuous learning is part of our DNA. We invest in your professional development and career growth.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-gradient-to-r from-brand-blue to-brand-green text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">Don't See Your Role?</h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              We're always looking for talented individuals. Send us your resume and let us know how you'd like to contribute.
            </p>
            <Button className="bg-white text-brand-blue hover:bg-white/90 text-lg px-8 py-3">
              Contact Us
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}