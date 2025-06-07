
import React from 'react';
import { Link } from 'wouter';
import { 
  Bot, 
  Sparkles, 
  Mail, 
  Linkedin, 
  Youtube,
  ArrowRight,
  Heart
} from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    product: [
      { name: 'Templates', href: '/templates' },
      { name: 'Pricing', href: '/pricing' },
      { name: 'Features', href: '/#features' },
      { name: 'Documentation', href: '/docs' },
      { name: 'API Reference', href: '/api' }
    ],
    company: [
      { name: 'About Us', href: '/about' },
      { name: 'Careers', href: '/careers' },
      { name: 'Blog', href: '/blog' },
      { name: 'Press Kit', href: '/press' },
      { name: 'Contact', href: '/contact' }
    ],
    support: [
      { name: 'Help Center', href: '/help' },
      { name: 'Community', href: '/community' },
      { name: 'Status', href: '/status' },
      { name: 'Security', href: '/security' },
      { name: 'Bug Reports', href: '/bugs' }
    ],
    legal: [
      { name: 'Privacy Policy', href: '/privacy' },
      { name: 'Terms of Service', href: '/terms' },
      { name: 'Cookie Policy', href: '/cookies' },
      { name: 'GDPR', href: '/gdpr' },
      { name: 'Compliance', href: '/compliance' }
    ]
  };

  // Custom X (Twitter) icon component
  const XIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  );

  const socialLinks = [
    { name: 'X (Twitter)', icon: <XIcon className="h-5 w-5" />, href: 'https://x.com/aiagentstudio' },
    { name: 'LinkedIn', icon: <Linkedin className="h-5 w-5" />, href: 'https://linkedin.com/company/aiagentstudio' },
    { name: 'YouTube', icon: <Youtube className="h-5 w-5" />, href: 'https://youtube.com/@aiagentstudio' }
  ];

  return (
    <footer className="bg-gray-50 border-t border-gray-200">
      {/* Newsletter Section */}
      <div className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Stay Updated</h3>
            <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
              Get the latest updates on new features, templates, and AI agent best practices delivered to your inbox.
            </p>
            <div className="flex flex-col sm:flex-row max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 rounded-l-lg sm:rounded-r-none rounded-r-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-r-lg sm:rounded-l-none rounded-l-lg font-medium transition-colors flex items-center justify-center">
                Subscribe
                <ArrowRight className="ml-2 h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Logo and Company Info */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mb-12">
          <div className="lg:col-span-2">
            <div className="flex items-center mb-4">
              <Bot className="h-8 w-8 text-blue-600 mr-2" />
              <span className="text-xl font-bold text-gray-900">AI Agent Studio</span>
            </div>
            <p className="text-gray-600 mb-6 max-w-md">
              Build, deploy, and manage powerful AI agents with our intuitive visual builder. 
              No coding required - just drag, drop, and deploy.
            </p>
            <div className="flex items-center text-gray-600">
              <Mail className="h-5 w-5 mr-2" />
              <span>support@aiagentstudio.ai</span>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-6">Product</h4>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.name}>
                  <Link 
                    to={link.href} 
                    className="text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-6">Company</h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link 
                    to={link.href} 
                    className="text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-6">Support</h4>
            <ul className="space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  <Link 
                    to={link.href} 
                    className="text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Legal Links - Moved to horizontal layout */}
        <div className="border-t border-gray-200 pt-8 mb-8">
          <h4 className="text-lg font-semibold text-gray-900 mb-4 text-center">Legal</h4>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            {footerLinks.legal.map((link, index) => (
              <React.Fragment key={link.name}>
                <Link 
                  to={link.href} 
                  className="text-gray-600 hover:text-gray-900 transition-colors text-sm"
                >
                  {link.name}
                </Link>
                {index < footerLinks.legal.length - 1 && (
                  <span className="text-gray-400 hidden sm:inline">•</span>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Additional Info */}
        <div className="border-t border-gray-200 pt-8 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <h5 className="font-semibold mb-2 text-purple-600">🚀 Enterprise Ready</h5>
              <p className="text-gray-600 text-sm">
                SOC 2 compliant with enterprise-grade security and 99.9% uptime SLA.
              </p>
            </div>
            <div>
              <h5 className="font-semibold mb-2 text-blue-600">🌍 Global Scale</h5>
              <p className="text-gray-600 text-sm">
                Deployed across 15+ regions worldwide with edge computing capabilities.
              </p>
            </div>
            <div>
              <h5 className="font-semibold mb-2 text-green-600">🤖 AI Powered</h5>
              <p className="text-gray-600 text-sm">
                Powered by the latest AI models including GPT-4, Claude, and Gemini.
              </p>
            </div>
          </div>
        </div>

        {/* Social Media & Bottom Section */}
        <div className="border-t border-gray-200 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            {/* Social Links */}
            <div className="flex items-center space-x-6 mb-4 md:mb-0">
              <span className="text-gray-600 text-sm">Follow us:</span>
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-gray-900 transition-colors transform hover:scale-110"
                  aria-label={social.name}
                >
                  {social.icon}
                </a>
              ))}
            </div>

            {/* Copyright */}
            <div className="flex items-center space-x-2 text-gray-600 text-sm">
              <span>© {currentYear} AI Agent Studio. Made with</span>
              <Heart className="h-4 w-4 text-red-500" />
              <span>in San Francisco</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
