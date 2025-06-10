import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/context/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ChevronDown, Menu, User } from 'lucide-react';
import logoPath from '@assets/AIAgentStudio.ai Logo (2)_1749578153991.png';

interface CanvasHeaderProps {
  onLoginClick: () => void;
  onSignupClick: () => void;
}

export default function CanvasHeader({ onLoginClick, onSignupClick }: CanvasHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const isAuthenticated = !!user;

  return (
    <header className="w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center">
            <img src={logoPath} alt="AIAgentStudio.AI" className="h-8 w-auto" />
          </Link>
        </div>

        {/* Navigation - Desktop */}
        <nav className="hidden space-x-6 md:flex">
          <Link href="/templates" className={`text-sm font-medium ${location === '/templates' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
            Templates
          </Link>
          <Link href="/features" className={`text-sm font-medium ${location === '/features' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
            Features
          </Link>
          <Link href="/pricing" className={`text-sm font-medium ${location === '/pricing' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
            Pricing
          </Link>
          <Link href="/documentation" className={`text-sm font-medium ${location === '/documentation' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
            Documentation
          </Link>
        </nav>

        {/* Right side: Auth buttons or user menu */}
        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <>
              <Link href="/dashboard" className="md:flex hidden">
                <Button variant="outline" size="sm">
                  My Agents
                </Button>
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="rounded-full w-8 h-8 p-0">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.avatar_url || ''} alt={user?.username || 'User'} />
                      <AvatarFallback>
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      {user?.username && (
                        <p className="font-medium">{user.username}</p>
                      )}
                      {user?.email && (
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      )}
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard">Dashboard</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/profile">Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings">Settings</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => {
                    logout();
                  }}>
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={onLoginClick}>
                Log in
              </Button>
              <Button 
                className="hidden md:inline-flex bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700" 
                size="sm" 
                onClick={onSignupClick}
              >
                Sign up free
              </Button>
            </>
          )}

          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden border-t">
          <div className="container py-4 space-y-4">
            <Link href="/templates" className="block py-2 text-sm font-medium">
              Templates
            </Link>
            <Link href="/features" className="block py-2 text-sm font-medium">
              Features
            </Link>
            <Link href="/pricing" className="block py-2 text-sm font-medium">
              Pricing
            </Link>
            <Link href="/documentation" className="block py-2 text-sm font-medium">
              Documentation
            </Link>
            {isAuthenticated && (
              <Link href="/dashboard" className="block py-2 text-sm font-medium">
                My Agents
              </Link>
            )}
            {!isAuthenticated && (
              <Button 
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 mt-2" 
                onClick={onSignupClick}
              >
                Sign up free
              </Button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}