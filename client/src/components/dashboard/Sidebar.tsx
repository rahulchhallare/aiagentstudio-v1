import { Link, useLocation } from 'wouter';
import { useCallback, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Bot,
  PlusCircle,
  FileText,
  Settings,
  CreditCard,
  HelpCircle,
  X,
  ChevronUp,
  UserCircle,
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import SearchBar from './SearchBar';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const [location, navigate] = useLocation();
  const { user } = useAuth();
  
  // Redirect immediately if user is not authenticated
  useEffect(() => {
    if (!user) {
      navigate('/welcome');
    }
  }, [user, navigate]);
  
  const handleProfileClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    navigate('/profile');
  }, [navigate]);

  // Don't render sidebar if user is not authenticated
  if (!user) {
    return null;
  }
  
  // Navigation items
  const navItems = [
    {
      title: 'Dashboard',
      href: '/dashboard',
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
    {
      title: 'Section: My Agents',
      type: 'section',
    },
    {
      title: 'All Agents',
      href: '/agents',
      icon: <Bot className="h-5 w-5" />,
    },
    {
      title: 'Create New Agent',
      href: '/builder',
      icon: <PlusCircle className="h-5 w-5" />,
    },
    {
      title: 'Templates',
      href: '/templates',
      icon: <FileText className="h-5 w-5" />,
    },
    {
      title: 'Section: Account',
      type: 'section',
    },
    {
      title: 'Settings',
      href: '/settings',
      icon: <Settings className="h-5 w-5" />,
    },
    {
      title: 'Billing',
      href: '/billing',
      icon: <CreditCard className="h-5 w-5" />,
    },
    {
      title: 'Help & Support',
      href: '/help',
      icon: <HelpCircle className="h-5 w-5" />,
    },
  ];

  return (
    <aside 
      className={cn(
        "w-64 bg-white shadow-md fixed inset-y-0 left-0 z-30 transform transition duration-300",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}
    >
      <div className="h-full flex flex-col">
        {/* Sidebar Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded bg-gradient-to-tr from-primary-600 to-purple-500 flex items-center justify-center">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-5 w-5 text-white" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <rect width="16" height="16" x="4" y="4" rx="2" />
                <circle cx="9" cy="9" r="1" />
                <circle cx="15" cy="9" r="1" />
                <path d="M8 14h8" />
                <path d="m9 18 3-3 3 3" />
              </svg>
            </div>
            <span className="font-bold text-gray-900">AIagentStudio<span className="text-primary-500">.ai</span></span>
          </Link>
          
          <div className="flex items-center space-x-2">
            <SearchBar />
            <button 
              className="lg:hidden text-gray-500 hover:text-gray-900"
              onClick={onClose}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        
        {/* Sidebar Navigation */}
        <nav className="flex-grow p-4 space-y-1 overflow-y-auto">
          {navItems.map((item, index) => (
            item.type === 'section' ? (
              <div key={index} className="pt-4 pb-2">
                <p className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {item.title.replace('Section: ', '')}
                </p>
              </div>
            ) : (
              <Link 
                key={index} 
                to={item.href || "/"} 
                className={cn(
                  "flex items-center px-4 py-3 rounded-lg transition-colors",
                  location === item.href
                    ? "text-gray-900 bg-gray-100"
                    : "text-gray-700 hover:bg-gray-100"
                )}
              >
                <span className="text-gray-500 mr-3">{item.icon}</span>
                <span>{item.title}</span>
              </Link>
            )
          ))}
        </nav>
        
        {/* User Profile Section */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleProfileClick}
            className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 w-full text-left"
          >
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-primary-100 text-primary-700">
                {user?.username?.substring(0, 2).toUpperCase() || 'AI'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.username || 'User'}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {user?.email || 'user@example.com'}
              </p>
            </div>
          </button>
        </div>
        
        {/* Sidebar Footer */}
        <div className="p-4 border-t border-gray-200">
          <div className="bg-primary-50 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm text-gray-800 font-medium">Free Plan</p>
              <Button variant="link" className="text-xs text-primary-600 hover:text-primary-700 p-0 h-auto">
                Upgrade Plan
                <ChevronUp className="h-3 w-3 ml-1" />
              </Button>
            </div>
            <div className="mb-2">
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>API Calls:</span>
                <span className="font-medium">43/100</span>
              </div>
              <Progress value={43} className="h-2" />
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
