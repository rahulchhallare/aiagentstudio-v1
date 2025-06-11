import { useState } from "react";
import { Link } from "wouter";
import { Calendar, Clock, User, ArrowRight, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LoginModal from "@/components/LoginModal";
import SignupModal from "@/components/SignupModal";

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  publishedAt: string;
  readTime: number;
  category: string;
  featured: boolean;
  imageUrl?: string;
}

const blogPosts: BlogPost[] = [
  {
    id: "1",
    title: "Getting Started with AI Agent Studio: A Complete Guide",
    excerpt: "Learn how to build your first AI agent in minutes using our drag-and-drop interface. No coding experience required.",
    content: "Full blog content here...",
    author: "Sarah Chen",
    publishedAt: "2024-06-10",
    readTime: 8,
    category: "Tutorial",
    featured: true,
    imageUrl: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=400&fit=crop"
  },
  {
    id: "2", 
    title: "5 AI Agent Templates That Will Transform Your Business",
    excerpt: "Discover the most popular AI agent templates and how they can automate your workflows and boost productivity.",
    content: "Full blog content here...",
    author: "Marcus Rodriguez",
    publishedAt: "2024-06-08",
    readTime: 6,
    category: "Business",
    featured: true,
    imageUrl: "https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&h=400&fit=crop"
  },
  {
    id: "3",
    title: "Understanding GPT Models: Which One to Choose for Your Agent",
    excerpt: "A comprehensive comparison of different GPT models and their use cases in AI agent development.",
    content: "Full blog content here...",
    author: "Dr. Emily Watson",
    publishedAt: "2024-06-05",
    readTime: 12,
    category: "Technical",
    featured: false,
    imageUrl: "https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=800&h=400&fit=crop"
  },
  {
    id: "4",
    title: "Customer Support Automation: Real Success Stories",
    excerpt: "See how companies are using AI agents to reduce response times and improve customer satisfaction.",
    content: "Full blog content here...",
    author: "James Park",
    publishedAt: "2024-06-03",
    readTime: 7,
    category: "Case Study",
    featured: false,
    imageUrl: "https://images.unsplash.com/photo-1556157382-97eda2d62296?w=800&h=400&fit=crop"
  },
  {
    id: "5",
    title: "The Future of No-Code AI: Trends and Predictions",
    excerpt: "Explore upcoming trends in no-code AI development and what they mean for businesses of all sizes.",
    content: "Full blog content here...",
    author: "Alex Thompson",
    publishedAt: "2024-06-01",
    readTime: 10,
    category: "Industry",
    featured: false,
    imageUrl: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&h=400&fit=crop"
  }
];

const categories = ["All", "Tutorial", "Business", "Technical", "Case Study", "Industry"];

export default function Blog() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const filteredPosts = blogPosts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         post.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || post.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const featuredPosts = filteredPosts.filter(post => post.featured);
  const regularPosts = filteredPosts.filter(post => !post.featured);

  return (
    <div className="flex flex-col min-h-screen">
      <Header 
        onLoginClick={() => setIsLoginModalOpen(true)}
        onSignupClick={() => setIsSignupModalOpen(true)}
      />

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-primary-50 to-white py-16">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-4xl mx-auto">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                AI Agent Studio <span className="text-brand-blue">Blog</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Insights, tutorials, and success stories from the world of no-code AI development
              </p>
              
              {/* Search and Filter */}
              <div className="flex flex-col md:flex-row gap-4 max-w-2xl mx-auto">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    type="text"
                    placeholder="Search articles..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex flex-wrap gap-2 justify-center">
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
            </div>
          </div>
        </section>

        {/* Featured Posts */}
        {featuredPosts.length > 0 && (
          <section className="py-16 bg-white">
            <div className="container mx-auto px-4">
              <div className="flex items-center mb-12">
                <h2 className="text-3xl font-bold text-gray-900">Featured Articles</h2>
                <Badge className="ml-4 bg-brand-blue text-white">New</Badge>
              </div>
              
              <div className="grid md:grid-cols-2 gap-8">
                {featuredPosts.map((post) => (
                  <article key={post.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-200">
                    {post.imageUrl && (
                      <div className="aspect-video bg-gray-100">
                        <img 
                          src={post.imageUrl} 
                          alt={post.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="p-8">
                      <div className="flex items-center gap-4 mb-4">
                        <Badge variant="secondary" className="bg-brand-blue/10 text-brand-blue">
                          {post.category}
                        </Badge>
                        <div className="flex items-center text-gray-500 text-sm">
                          <Calendar className="h-4 w-4 mr-1" />
                          {new Date(post.publishedAt).toLocaleDateString()}
                        </div>
                        <div className="flex items-center text-gray-500 text-sm">
                          <Clock className="h-4 w-4 mr-1" />
                          {post.readTime} min read
                        </div>
                      </div>
                      
                      <h3 className="text-2xl font-bold text-gray-900 mb-3 hover:text-brand-blue transition-colors">
                        <Link href={`/blog/${post.id}`}>
                          {post.title}
                        </Link>
                      </h3>
                      
                      <p className="text-gray-600 mb-4 line-clamp-3">
                        {post.excerpt}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <User className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-600">{post.author}</span>
                        </div>
                        <Link href={`/blog/${post.id}`}>
                          <Button variant="ghost" size="sm" className="text-brand-blue hover:text-primary-700">
                            Read More <ArrowRight className="ml-1 h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Regular Posts */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-gray-900 mb-12">Latest Articles</h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {regularPosts.map((post) => (
                <article key={post.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-200">
                  {post.imageUrl && (
                    <div className="aspect-video bg-gray-100">
                      <img 
                        src={post.imageUrl} 
                        alt={post.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <Badge variant="secondary" className="bg-brand-blue/10 text-brand-blue text-xs">
                        {post.category}
                      </Badge>
                      <div className="flex items-center text-gray-500 text-xs">
                        <Clock className="h-3 w-3 mr-1" />
                        {post.readTime} min
                      </div>
                    </div>
                    
                    <h3 className="text-xl font-bold text-gray-900 mb-2 hover:text-brand-blue transition-colors">
                      <Link href={`/blog/${post.id}`}>
                        {post.title}
                      </Link>
                    </h3>
                    
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {post.excerpt}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <User className="h-3 w-3 text-gray-400 mr-1" />
                        <span className="text-xs text-gray-600">{post.author}</span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(post.publishedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {filteredPosts.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">No articles found matching your criteria.</p>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("All");
                  }}
                  className="mt-4"
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        </section>

        {/* Newsletter CTA */}
        <section className="py-16 bg-gradient-to-r from-brand-blue to-brand-green text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">Stay Updated</h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Get the latest AI insights and tutorials delivered to your inbox
            </p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <Input 
                type="email" 
                placeholder="Enter your email"
                className="bg-white/10 border-white/20 text-white placeholder-white/70"
              />
              <Button className="bg-white text-brand-blue hover:bg-white/90">
                Subscribe
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />

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
    </div>
  );
}