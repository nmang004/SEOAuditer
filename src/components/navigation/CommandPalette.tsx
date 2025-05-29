import * as React from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { staggerContainer, staggerItem } from '@/components/animations/animation-variants';
import { cn } from '@/lib/utils';

export interface Command {
  id: string;
  label: string;
  category?: string;
  icon?: React.ReactNode;
  shortcut?: string;
}

export interface KeyboardShortcut {
  keys: string;
  description: string;
}

export interface CommandPaletteProps {
  commands: Command[];
  shortcuts: KeyboardShortcut[];
  onExecute: (command: Command) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ commands, shortcuts, onExecute }) => {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [highlighted, setHighlighted] = React.useState<number>(-1);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Global shortcut (Cmd+K)
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        setOpen((o) => !o);
        setTimeout(() => inputRef.current?.focus(), 50);
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Filtered commands (simple fuzzy)
  const filtered = React.useMemo(() => {
    if (!query) return commands;
    return commands.filter((c) => c.label.toLowerCase().includes(query.toLowerCase()));
  }, [commands, query]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open) return;
    if (e.key === 'ArrowDown') {
      setHighlighted((h) => Math.min(h + 1, filtered.length - 1));
      e.preventDefault();
    } else if (e.key === 'ArrowUp') {
      setHighlighted((h) => Math.max(h - 1, 0));
      e.preventDefault();
    } else if (e.key === 'Enter' && highlighted >= 0) {
      onExecute(filtered[highlighted]);
      setOpen(false);
      setQuery('');
      setHighlighted(-1);
      e.preventDefault();
    } else if (e.key === 'Escape') {
      setOpen(false);
      setHighlighted(-1);
    }
  };

  // Group by category
  const grouped = React.useMemo(() => {
    const map: Record<string, Command[]> = {};
    filtered.forEach((cmd) => {
      const cat = cmd.category || 'General';
      if (!map[cat]) map[cat] = [];
      map[cat].push(cmd);
    });
    return map;
  }, [filtered]);

  return (
    <AnimatePresence>
      {open && (
        <m.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <m.div
            className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-auto p-4"
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            variants={staggerContainer}
            role="dialog"
            aria-modal="true"
            aria-label="Command Palette"
          >
            <input
              ref={inputRef}
              type="text"
              className="w-full rounded-md border px-4 py-2 mb-3 focus:ring-2 focus:ring-primary outline-none"
              placeholder="Type a command..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              aria-autocomplete="list"
              aria-controls="command-palette-list"
              aria-activedescendant={highlighted >= 0 ? `command-palette-item-${highlighted}` : undefined}
            />
            <div className="max-h-72 overflow-y-auto" id="command-palette-list" role="listbox">
              {Object.entries(grouped).map(([cat, cmds]) => (
                <div key={cat} className="mb-2">
                  <div className="text-xs font-semibold text-muted-foreground px-2 py-1">{cat}</div>
                  {cmds.map((cmd, i) => (
                    <m.div
                      key={cmd.id}
                      id={`command-palette-item-${i}`}
                      role="option"
                      aria-selected={highlighted === i}
                      className={cn(
                        'flex items-center gap-2 px-4 py-2 cursor-pointer rounded transition',
                        highlighted === i ? 'bg-primary/10 text-primary' : ''
                      )}
                      onMouseDown={() => {
                        onExecute(cmd);
                        setOpen(false);
                        setQuery('');
                        setHighlighted(-1);
                      }}
                      variants={staggerItem}
                      tabIndex={-1}
                    >
                      {cmd.icon && <span>{cmd.icon}</span>}
                      <span className="font-medium flex-1">{cmd.label}</span>
                      {cmd.shortcut && <span className="text-xs text-muted-foreground ml-2">{cmd.shortcut}</span>}
                    </m.div>
                  ))}
                </div>
              ))}
              {filtered.length === 0 && (
                <div className="text-center text-muted-foreground py-6">No commands found.</div>
              )}
            </div>
            <div className="mt-4 border-t pt-2 text-xs text-muted-foreground">
              <div className="mb-1 font-semibold">Shortcuts</div>
              <ul className="flex flex-wrap gap-2">
                {shortcuts.map((s, i) => (
                  <li key={i} className="bg-muted px-2 py-1 rounded">
                    <span className="font-mono text-xs">{s.keys}</span> - {s.description}
                  </li>
                ))}
              </ul>
            </div>
          </m.div>
        </m.div>
      )}
    </AnimatePresence>
  );
}; 