import { useState, useRef, useEffect } from "react";
import { Search as SearchIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

type SearchResult = {
  id: string;
  title: string;
  type: 'page' | 'keyword' | 'issue';
  url: string;
};

export function Search() {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Mock search function - replace with actual API call
  const search = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      // Mock results with proper typing
      const mockResults = [
        {
          id: '1',
          title: 'Dashboard',
          type: 'page' as const,
          url: '/dashboard',
        },
        {
          id: '2',
          title: 'Keyword Analysis',
          type: 'keyword' as const,
          url: '/dashboard/keywords',
        },
        {
          id: '3',
          title: 'Content Issues',
          type: 'issue' as const,
          url: '/dashboard/issues',
        },
      ].filter(item => 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.type.toLowerCase().includes(searchQuery.toLowerCase())
      ) as SearchResult[];
      
      setResults(mockResults);
      setIsLoading(false);
    }, 300);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      // Navigate to search results page or handle search
      router.push(`/dashboard/search?q=${encodeURIComponent(query)}`);
      setIsOpen(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    } else if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      setIsOpen(true);
    }
  };

  // Close search when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus input when search opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  return (
    <div className="relative" ref={searchRef}>
      <div
        className={cn(
          "hidden md:flex items-center h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
          "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
          "w-full max-w-md"
        )}
        onClick={() => setIsOpen(true)}
      >
        <SearchIcon className="h-4 w-4 text-muted-foreground mr-2" />
        <span className="text-muted-foreground">Search... (⌘K)</span>
        <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
          <span className="text-xs">⌘</span>K
        </kbd>
      </div>

      {/* Mobile search button */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={() => setIsOpen(true)}
        aria-label="Search"
      >
        <SearchIcon className="h-5 w-5" />
      </Button>

      {/* Search overlay */}
      <div
        className={cn(
          "fixed inset-0 z-50 bg-background/80 backdrop-blur-sm transition-opacity",
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
          'flex items-start justify-center p-4 pt-20 md:pt-24'
        )}
      >
        <div
          className={cn(
            "w-full max-w-xl bg-background rounded-lg shadow-xl border transition-all duration-200",
            isOpen ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0',
            'relative max-h-[80vh] flex flex-col"'
          )}
        >
          <form onSubmit={handleSearch} className="relative">
            <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={inputRef}
              type="search"
              placeholder="Search pages, keywords, issues..."
              className="w-full h-14 pl-10 pr-12 text-base border-0 rounded-b-none focus-visible:ring-0 focus-visible:ring-offset-0"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                search(e.target.value);
              }}
              onKeyDown={handleKeyDown}
            />
            {query && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                onClick={() => setQuery("")}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Clear search</span>
              </Button>
            )}
          </form>

          {isOpen && (query || results.length > 0) && (
            <div className="border-t overflow-y-auto flex-1">
              {isLoading ? (
                <div className="p-4 text-center text-muted-foreground">
                  Searching...
                </div>
              ) : results.length > 0 ? (
                <ul className="py-2">
                  {results.map((result) => (
                    <li key={result.id}>
                      <a
                        href={result.url}
                        className="flex items-center px-4 py-3 hover:bg-accent/50 transition-colors"
                        onClick={() => setIsOpen(false)}
                      >
                        <div className="flex-1">
                          <div className="font-medium">{result.title}</div>
                          <div className="text-xs text-muted-foreground capitalize">
                            {result.type}
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {result.url}
                        </div>
                      </a>
                    </li>
                  ))}
                </ul>
              ) : query ? (
                <div className="p-4 text-center text-muted-foreground">
                  No results found for "{query}"
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
