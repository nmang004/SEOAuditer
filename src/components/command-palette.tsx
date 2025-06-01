'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { Command as CommandPrimitive } from 'cmdk';
import { Search, Command as CommandIcon, X, Clock, Star } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  FocusManager, 
  keyboard, 
  screenReader, 
  aria, 
  ariaLabels,
  useKeyboardNavigation 
} from '@/lib/accessibility-utils';
import { designTokens } from '@/lib/design-tokens';

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  group?: string;
  shortcut?: string;
  keywords?: string[];
  priority?: number;
  onSelect?: () => void;
}

interface CommandProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  commands: CommandItem[];
  placeholder?: string;
  emptyMessage?: string;
  maxResults?: number;
  showRecentCommands?: boolean;
}

// Fuzzy search implementation
function fuzzySearch(query: string, text: string): number {
  if (!query) return 1;
  
  const queryLower = query.toLowerCase();
  const textLower = text.toLowerCase();
  
  // Exact match gets highest score
  if (textLower.includes(queryLower)) {
    return 1000 - textLower.indexOf(queryLower);
  }
  
  // Fuzzy matching
  let score = 0;
  let queryIndex = 0;
  
  for (let i = 0; i < textLower.length && queryIndex < queryLower.length; i++) {
    if (textLower[i] === queryLower[queryIndex]) {
      score++;
      queryIndex++;
    }
  }
  
  // Return score only if all query characters were found
  return queryIndex === queryLower.length ? score : 0;
}

export function CommandPalette({ 
  open: controlledOpen, 
  onOpenChange, 
  commands,
  placeholder = "Type a command or search...",
  emptyMessage = "No commands found.",
  maxResults = 10,
  showRecentCommands = true
}: CommandProps) {
  const [open, setOpen] = useState(controlledOpen ?? false);
  const [search, setSearch] = useState('');
  const [recentCommands, setRecentCommands] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const commandPaletteId = aria.generateId('command-palette');

  // Setup keyboard navigation with focus trapping
  useKeyboardNavigation(dialogRef, {
    trapFocus: true,
    autoFocus: true,
    onEscape: () => handleOpenChange(false),
  });

  // Enhanced fuzzy search with scoring
  const searchCommands = useCallback((query: string, commandList: CommandItem[]) => {
    if (!query.trim()) {
      return commandList.slice(0, maxResults);
    }

    const results = commandList
      .map(cmd => {
        // Search in label, description, and keywords
        const labelScore = fuzzySearch(query, cmd.label);
        const descriptionScore = cmd.description ? fuzzySearch(query, cmd.description) * 0.8 : 0;
        const keywordScore = cmd.keywords 
          ? Math.max(...cmd.keywords.map(k => fuzzySearch(query, k))) * 0.6 
          : 0;
        
        const totalScore = Math.max(labelScore, descriptionScore, keywordScore);
        
        return {
          ...cmd,
          score: totalScore + (cmd.priority || 0)
        };
      })
      .filter(cmd => cmd.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, maxResults);

    return results;
  }, [maxResults]);

  // Group commands by category with recent commands
  const groupedCommands = useCallback(() => {
    const searchResults = searchCommands(search, commands);
    const grouped: Record<string, CommandItem[]> = {};

    // Add recent commands if no search query
    if (!search.trim() && showRecentCommands && recentCommands.length > 0) {
      const recent = commands.filter(cmd => recentCommands.includes(cmd.id));
      if (recent.length > 0) {
        grouped['Recent'] = recent;
      }
    }

    // Group search results
    searchResults.forEach(cmd => {
      const group = cmd.group || 'Commands';
      if (!grouped[group]) {
        grouped[group] = [];
      }
      grouped[group].push(cmd);
    });

    return grouped;
  }, [search, commands, recentCommands, showRecentCommands, searchCommands]);

  // Handle keyboard shortcut (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(prev => !prev);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Load recent commands from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('command-palette-recent');
      if (stored) {
        try {
          setRecentCommands(JSON.parse(stored));
        } catch (e) {
          console.warn('Failed to parse recent commands:', e);
        }
      }
    }
  }, []);

  const handleCommandSelect = (command: CommandItem) => {
    // Add to recent commands
    const newRecent = [command.id, ...recentCommands.filter(id => id !== command.id)].slice(0, 5);
    setRecentCommands(newRecent);
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('command-palette-recent', JSON.stringify(newRecent));
    }

    // Announce selection to screen reader
    screenReader.announce(`Selected ${command.label}`, 'assertive');

    // Execute command
    command.onSelect?.();
    handleOpenChange(false);
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    onOpenChange?.(isOpen);
    
    if (!isOpen) {
      setSearch('');
      setLoading(false);
    } else {
      // Announce opening to screen reader
      screenReader.announce('Command palette opened. Type to search or use arrow keys to navigate.', 'assertive');
      
      // Focus input after dialog animation
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setLoading(true);
    
    // Debounce search to prevent excessive rendering
    setTimeout(() => {
      setLoading(false);
    }, 150);
  };

  const clearSearch = () => {
    setSearch('');
    inputRef.current?.focus();
    screenReader.announce('Search cleared', 'polite');
  };

  const grouped = groupedCommands();
  const hasResults = Object.keys(grouped).length > 0;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent 
        ref={dialogRef}
        className="p-0 overflow-hidden max-w-2xl"
        aria-labelledby={`${commandPaletteId}-title`}
        aria-describedby={`${commandPaletteId}-description`}
        style={{ zIndex: designTokens.zIndex.commandPalette }}
      >
        {/* Screen reader only title and description */}
        <div className="sr-only">
          <h2 id={`${commandPaletteId}-title`}>Command Palette</h2>
          <p id={`${commandPaletteId}-description`}>
            Search and execute commands. Use arrow keys to navigate, Enter to select, and Escape to close.
          </p>
        </div>

        <CommandPrimitive
          className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5"
          shouldFilter={false} // We handle filtering ourselves
        >
          {/* Search Input */}
          <div className="flex items-center border-b px-3 relative">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" aria-hidden="true" />
            <CommandPrimitive.Input
              ref={inputRef}
              value={search}
              onValueChange={handleSearchChange}
              className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              placeholder={placeholder}
              aria-label="Search commands"
              aria-expanded={hasResults}
              aria-controls={`${commandPaletteId}-results`}
              autoComplete="off"
              spellCheck="false"
            />
            
            {/* Loading indicator */}
            {loading && (
              <div className="mr-2" aria-hidden="true">
                <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
              </div>
            )}
            
            {/* Clear button */}
            {search && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 p-0"
                onClick={clearSearch}
                aria-label={ariaLabels.actions.close}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
            
            {/* Keyboard shortcut hint */}
            {!search && (
              <Badge variant="secondary" className="text-xs ml-2">
                {navigator?.platform?.includes('Mac') ? '⌘K' : 'Ctrl+K'}
              </Badge>
            )}
          </div>

          {/* Results */}
          <CommandPrimitive.List 
            className="max-h-[400px] overflow-y-auto overflow-x-hidden"
            id={`${commandPaletteId}-results`}
          >
            {hasResults ? (
              Object.entries(grouped).map(([group, cmds]) => (
                <CommandPrimitive.Group 
                  key={group} 
                  heading={group}
                  role="group"
                  aria-labelledby={`${commandPaletteId}-group-${group}`}
                >
                  <div 
                    id={`${commandPaletteId}-group-${group}`}
                    className="sr-only"
                  >
                    {group} commands
                  </div>
                  
                  {cmds.map((cmd) => (
                    <CommandPrimitive.Item
                      key={cmd.id}
                      onSelect={() => handleCommandSelect(cmd)}
                      className="relative flex cursor-pointer select-none items-center rounded-sm px-3 py-2 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 hover:bg-accent/50 transition-colors"
                      role="option"
                      aria-describedby={cmd.description ? `${commandPaletteId}-desc-${cmd.id}` : undefined}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {/* Icon */}
                        <div className="flex-shrink-0">
                          {cmd.icon || <CommandIcon className="h-4 w-4" />}
                        </div>
                        
                        {/* Content */}
                        <div className="flex flex-col flex-1 min-w-0">
                          <span className="font-medium truncate">{cmd.label}</span>
                          {cmd.description && (
                            <span 
                              id={`${commandPaletteId}-desc-${cmd.id}`}
                              className="text-xs text-muted-foreground truncate"
                            >
                              {cmd.description}
                            </span>
                          )}
                        </div>
                        
                        {/* Indicators and shortcuts */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {/* Recent indicator */}
                          {recentCommands.includes(cmd.id) && (
                            <Clock className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
                          )}
                          
                          {/* Priority indicator */}
                          {(cmd.priority || 0) > 10 && (
                            <Star className="h-3 w-3 text-yellow-500" aria-hidden="true" />
                          )}
                          
                          {/* Keyboard shortcut */}
                          {cmd.shortcut && (
                            <Badge variant="outline" className="text-xs font-mono">
                              {cmd.shortcut}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CommandPrimitive.Item>
                  ))}
                </CommandPrimitive.Group>
              ))
            ) : (
              <div className="py-8 text-center text-sm text-muted-foreground">
                <CommandIcon className="mx-auto h-8 w-8 mb-3 opacity-50" aria-hidden="true" />
                <p role="status" aria-live="polite">
                  {search ? emptyMessage : 'Start typing to search commands...'}
                </p>
              </div>
            )}
          </CommandPrimitive.List>
        </CommandPrimitive>
      </DialogContent>
    </Dialog>
  );
}

// Enhanced hook with better command management
export function useCommandPalette({ commands }: { commands: CommandItem[] }) {
  const [isOpen, setIsOpen] = useState(false);

  const CommandPaletteComponent = useCallback(
    () => (
      <CommandPalette
        open={isOpen}
        onOpenChange={setIsOpen}
        commands={commands}
      />
    ),
    [isOpen, commands]
  );

  return {
    CommandPalette: CommandPaletteComponent,
    openCommandPalette: () => setIsOpen(true),
    closeCommandPalette: () => setIsOpen(false),
    isOpen,
  };
}
