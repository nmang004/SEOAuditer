import { useEffect, useRef } from 'react';

export type ShortcutHandler = (event: KeyboardEvent) => void;

interface Shortcut {
  keys: string;
  handler: ShortcutHandler;
}

export function useGlobalShortcuts(shortcuts: Shortcut[]) {
  const handlersRef = useRef<Shortcut[]>(shortcuts);

  useEffect(() => {
    handlersRef.current = shortcuts;
  }, [shortcuts]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      for (const { keys, handler } of handlersRef.current) {
        if (matchShortcut(event, keys)) {
          handler(event);
          break;
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
}

function matchShortcut(event: KeyboardEvent, keys: string) {
  const key = event.key.toLowerCase();
  const ctrl = event.ctrlKey;
  const meta = event.metaKey;
  const shift = event.shiftKey;
  const alt = event.altKey;
  const parts = keys.toLowerCase().split('+');
  return (
    (parts.includes('ctrl') === ctrl) &&
    (parts.includes('meta') === meta) &&
    (parts.includes('shift') === shift) &&
    (parts.includes('alt') === alt) &&
    parts.includes(key)
  );
} 