'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { Command as CommandPrimitive } from 'cmdk';
import { Search, Command as CommandIcon, X } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface CommandProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  commands: {
    id: string;
    label: string;
    icon?: React.ReactNode;
    group?: string;
    shortcut?: string;
    onSelect?: () => void;
  }[];
}

export function CommandPalette({ open: controlledOpen, onOpenChange, commands }: CommandProps) {
  const [open, setOpen] = useState(controlledOpen ?? false);
  const [search, setSearch] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Group commands by category
  const groupedCommands = commands.reduce<Record<string, typeof commands>>((acc, cmd) => {
    const group = cmd.group || 'Actions';
    if (!acc[group]) {
      acc[group] = [];
    }
    acc[group].push(cmd);
    return acc;
  }, {});

  // Handle keyboard shortcut (Cmd+K)
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  // Filter commands based on search
  const filteredCommands = Object.entries(groupedCommands).reduce<Record<string, typeof commands>>(
    (acc, [group, cmds]) => {
      const filtered = cmds.filter((cmd) =>
        cmd.label.toLowerCase().includes(search.toLowerCase()) ||
        (cmd.group?.toLowerCase().includes(search.toLowerCase()) ?? false)
      );
      if (filtered.length > 0) {
        acc[group] = filtered;
      }
      return acc;
    },
    {}
  );

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    onOpenChange?.(isOpen);
    if (!isOpen) {
      setSearch('');
    } else {
      // Focus input when dialog opens
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="p-0 overflow-hidden">
        <CommandPrimitive
          className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5"
        >
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <CommandPrimitive.Input
              ref={inputRef}
              value={search}
              onValueChange={setSearch}
              className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Type a command or search..."
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 p-0"
              onClick={() => setSearch('')}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CommandPrimitive.List className="max-h-[300px] overflow-y-auto overflow-x-hidden">
            {Object.entries(filteredCommands).map(([group, cmds]) => (
              <CommandPrimitive.Group key={group} heading={group}>
                {cmds.map((cmd) => (
                  <CommandPrimitive.Item
                    key={cmd.id}
                    onSelect={() => {
                      cmd.onSelect?.();
                      handleOpenChange(false);
                    }}
                    className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                  >
                    {cmd.icon || <CommandIcon className="mr-2 h-4 w-4" />}
                    <span>{cmd.label}</span>
                    {cmd.shortcut && (
                      <span className="ml-auto text-xs text-muted-foreground">
                        {cmd.shortcut}
                      </span>
                    )}
                  </CommandPrimitive.Item>
                ))}
              </CommandPrimitive.Group>
            ))}
            {Object.keys(filteredCommands).length === 0 && (
              <div className="py-6 text-center text-sm text-muted-foreground">
                No commands found.
              </div>
            )}
          </CommandPrimitive.List>
        </CommandPrimitive>
      </DialogContent>
    </Dialog>
  );
}

// Hook to use command palette
interface UseCommandPaletteOptions {
  commands: CommandProps['commands'];
}

export function useCommandPalette({ commands }: UseCommandPaletteOptions) {
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
  };
}
