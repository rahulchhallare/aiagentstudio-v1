import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Input } from '@/components/ui/input';
import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function SearchBar() {
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sample search results - in a real app, these would be fetched from an API
  const searchResults = [
    {
      type: 'agent',
      title: 'Customer Support Agent',
      description: 'AI agent for handling common customer inquiries',
      path: '/builder/1',
    },
    {
      type: 'template',
      title: 'FAQ Responder',
      description: 'Template for creating FAQ response agents',
      path: '/templates',
    },
    {
      type: 'documentation',
      title: 'Prompt Engineering Guide',
      description: 'Learn how to create effective prompts for GPT models',
      path: '/documentation',
    },
  ].filter(
    item => 
      searchQuery.length > 0 && 
      (item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
       item.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  useEffect(() => {
    // Add click outside listener to close search
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Focus input when search is opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Handle search input changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Handle clicking on a search result
  const handleResultClick = (path: string) => {
    setIsOpen(false);
    setSearchQuery('');
    navigate(path);
  };

  return (
    <div className="relative" ref={searchRef}>
      <Button
        variant="outline"
        size="icon"
        className="w-10 h-10 rounded-full"
        onClick={() => setIsOpen(true)}
      >
        <Search className="h-4 w-4" />
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-12 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-3 border-b border-gray-200">
            <div className="flex items-center">
              <Search className="h-4 w-4 text-gray-500 mr-2" />
              <Input
                ref={inputRef}
                placeholder="Search..."
                className="border-none shadow-none focus-visible:ring-0 flex-1"
                value={searchQuery}
                onChange={handleSearchChange}
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {searchResults.length > 0 ? (
              <div className="py-2">
                {searchResults.map((result, index) => (
                  <div
                    key={index}
                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                    onClick={() => handleResultClick(result.path)}
                  >
                    <div className="flex items-center">
                      <span className="bg-primary-100 text-primary-800 text-xs px-2 py-0.5 rounded-full">
                        {result.type}
                      </span>
                      <span className="ml-2 text-sm font-medium">{result.title}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{result.description}</p>
                  </div>
                ))}
              </div>
            ) : searchQuery.length > 0 ? (
              <div className="py-4 px-3 text-center">
                <p className="text-sm text-gray-500">No results found for "{searchQuery}"</p>
              </div>
            ) : (
              <div className="py-4 px-3 text-center">
                <p className="text-sm text-gray-500">Type to search agents, templates, and documentation</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}