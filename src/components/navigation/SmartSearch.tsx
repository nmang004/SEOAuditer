import * as React from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { staggerContainer, staggerItem } from '@/components/animations/animation-variants';
import { cn } from '@/lib/utils';

export interface SearchSuggestion {
  id: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
}

export interface SmartSearchProps {
  placeholder: string;
  suggestions: SearchSuggestion[];
  onSearch: (query: string) => void;
  onSelect: (suggestion: SearchSuggestion) => void;
  showRecents?: boolean;
  showTrending?: boolean;
}

export const SmartSearch: React.FC<SmartSearchProps> = ({
  placeholder,
  suggestions,
  onSearch,
  onSelect,
  showRecents = false,
  showTrending = false,
}) => {
  const [query, setQuery] = React.useState('');
  const [open, setOpen] = React.useState(false);
  const [highlighted, setHighlighted] = React.useState<number>(-1);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);
  const debounceTimeout = React.useRef<NodeJS.Timeout | null>(null);

  // Debounced search
  React.useEffect(() => {
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    debounceTimeout.current = setTimeout(() => {
      onSearch(query);
    }, 200);
    return () => debounceTimeout.current && clearTimeout(debounceTimeout.current);
  }, [query, onSearch]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open) return;
    if (e.key === 'ArrowDown') {
      setHighlighted((h) => Math.min(h + 1, suggestions.length - 1));
      e.preventDefault();
    } else if (e.key === 'ArrowUp') {
      setHighlighted((h) => Math.max(h - 1, 0));
      e.preventDefault();
    } else if (e.key === 'Enter' && highlighted >= 0) {
      onSelect(suggestions[highlighted]);
      setOpen(false);
      setQuery('');
      setHighlighted(-1);
      e.preventDefault();
    } else if (e.key === 'Escape') {
      setOpen(false);
      setHighlighted(-1);
    }
  };

  // Open dropdown on focus
  const handleFocus = () => setOpen(true);
  // Close dropdown on blur
  const handleBlur = (e: React.FocusEvent) => {
    if (!listRef.current?.contains(e.relatedTarget as Node)) {
      setOpen(false);
      setHighlighted(-1);
    }
  };

  return (
    <div className="relative w-full max-w-md">
      <input
        ref={inputRef}
        type="text"
        className="w-full rounded-md border px-4 py-2 focus:ring-2 focus:ring-primary outline-none"
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        aria-autocomplete="list"
        aria-controls="smart-search-list"
        aria-activedescendant={highlighted >= 0 ? `smart-search-item-${highlighted}` : undefined}
      />
      <AnimatePresence>
        {open && suggestions.length > 0 && (
          <m.div
            ref={listRef}
            className="absolute z-10 mt-2 w-full rounded-md bg-white shadow-lg border overflow-hidden"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.18 }}
            id="smart-search-list"
            role="listbox"
            variants={staggerContainer}
          >
            {suggestions.map((s, i) => (
              <m.div
                key={s.id}
                id={`smart-search-item-${i}`}
                role="option"
                aria-selected={highlighted === i}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 cursor-pointer transition',
                  highlighted === i ? 'bg-primary/10 text-primary' : ''
                )}
                onMouseDown={() => {
                  onSelect(s);
                  setOpen(false);
                  setQuery('');
                  setHighlighted(-1);
                }}
                variants={staggerItem}
                tabIndex={-1}
              >
                {s.icon && <span>{s.icon}</span>}
                <span className="font-medium">{s.label}</span>
                {s.description && <span className="ml-2 text-xs text-muted-foreground">{s.description}</span>}
              </m.div>
            ))}
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}; 