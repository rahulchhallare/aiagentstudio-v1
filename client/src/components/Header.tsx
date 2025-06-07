import { useState, useEffect, Fragment } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { AlertCircle, Bell, ChevronDown, HelpCircle, Menu, User, LogOut } from 'lucide-react';

interface HeaderProps {
  onLoginClick: () => void;
  onSignupClick: () => void;
}

export default function Header({ onLoginClick, onSignupClick }: HeaderProps) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Check if we're on the landing page
  const isLandingPage = false; // No longer needed since welcome page is removed

  // Listen for scroll events to add shadow to header when scrolled
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`bg-white sticky top-0 z-40 ${isScrolled ? 'shadow-sm' : ''}`}>
      <nav className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded bg-gradient-to-tr from-primary-600 to-purple-500 flex items-center justify-center">
              <Robot className="text-white" />
            </div>
            <span className="font-bold text-xl text-gray-900">AIagentStudio<span className="text-primary-500">.ai</span></span>
          </Link>
        </div>

        {/* Mobile menu button */}
        <div className="block sm:hidden">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMobileMenuOpen(true)}
            className="text-gray-600 hover:text-gray-900"
          >
            <Menu className="h-6 w-6" />
          </Button>
        </div>

        {/* Desktop navigation for landing page */}
        {isLandingPage && !user && (
          <div className="hidden sm:flex space-x-8">
            <Link href="/templates" className="text-gray-600 hover:text-primary-600 font-medium">Templates</Link>
            <Link href="#features" className="text-gray-600 hover:text-primary-600 font-medium">Features</Link>
            <Link href="#pricing" className="text-gray-600 hover:text-primary-600 font-medium">Pricing</Link>
            <Link href="#docs" className="text-gray-600 hover:text-primary-600 font-medium">Documentation</Link>
            <Button
              variant="ghost"
              onClick={() => {
                const subscriptionSection = document.querySelector('.py-16.bg-gradient-to-br.from-purple-600');
                subscriptionSection?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="text-gray-600 hover:text-primary-600 font-medium px-0"
            >
              Subscribe
            </Button>
            <div className="flex space-x-4">
              <Button
                variant="ghost"
                onClick={onLoginClick}
                className="px-4 py-2 text-primary-600 font-medium"
                id="login-button"
              >
                Log in
              </Button>
              <Button
                onClick={onSignupClick}
                className="px-4 py-2 bg-primary-600 text-white font-medium hover:bg-primary-700"
                id="signup-button"
              >
                Sign up
              </Button>
            </div>
          </div>
        )}

        {/* User menu when authenticated */}
        {user && (
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-500 hover:text-gray-900"
            >
              <Bell className="h-5 w-5" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="text-gray-500 hover:text-gray-900"
            >
              <HelpCircle className="h-5 w-5" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary-100 text-primary-700">
                      {user.username.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden md:inline text-sm font-medium">{user.username}</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" /> Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  logout();
                }}>
                  <LogOut className="mr-2 h-4 w-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </nav>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col">
          <div className="flex justify-between items-center p-4 border-b">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded bg-gradient-to-tr from-primary-600 to-purple-500 flex items-center justify-center">
                <Robot className="text-white" />
              </div>
              <span className="font-bold text-xl text-gray-900">AIagentStudio<span className="text-primary-500">.ai</span></span>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-gray-600 hover:text-gray-900"
            >
              <X className="h-6 w-6" />
            </Button>
          </div>

          <div className="flex flex-col space-y-4 p-6">
            {isLandingPage && !user ? (
              <Fragment>
                <Link href="/templates" onClick={() => setIsMobileMenuOpen(false)} className="text-gray-900 hover:text-primary-600 text-lg font-medium py-2">
                  Templates
                </Link>
                <Link href="#features" onClick={() => setIsMobileMenuOpen(false)} className="text-gray-900 hover:text-primary-600 text-lg font-medium py-2">
                  Features
                </Link>
                <Link href="#pricing" onClick={() => setIsMobileMenuOpen(false)} className="text-gray-900 hover:text-primary-600 text-lg font-medium py-2">
                  Pricing
                </Link>
                <Link href="#docs" onClick={() => setIsMobileMenuOpen(false)} className="text-gray-900 hover:text-primary-600 text-lg font-medium py-2">
                  Documentation
                </Link>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    const subscriptionSection = document.querySelector('.py-16.bg-gradient-to-br.from-purple-600');
                    subscriptionSection?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="text-gray-900 hover:text-primary-600 text-lg font-medium py-2 justify-start px-0"
                >
                  Subscribe
                </Button>
                <div className="pt-4 border-t border-gray-200">
                  <Button
                    variant="outline"
                    className="w-full mb-3"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onLoginClick();
                    }}
                  >
                    Log in
                  </Button>
                  <Button
                    className="w-full"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onSignupClick();
                    }}
                  >
                    Sign up
                  </Button>
                </div>
              </Fragment>
            ) : (
              <Fragment>
                <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="text-gray-900 hover:text-primary-600 text-lg font-medium py-2">
                  Dashboard
                </Link>
                <Link href="/builder" onClick={() => setIsMobileMenuOpen(false)} className="text-gray-900 hover:text-primary-600 text-lg font-medium py-2">
                  Create Agent
                </Link>
                <div className="pt-4 border-t border-gray-200">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      logout();
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    Sign out
                  </Button>
                </div>
              </Fragment>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

function Robot(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect width="16" height="16" x="4" y="4" rx="2" />
      <circle cx="9" cy="9" r="1" />
      <circle cx="15" cy="9" r="1" />
      <path d="M8 14h8" />
      <path d="m9 18 3-3 3 3" />
    </svg>
  );
}

function X(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}