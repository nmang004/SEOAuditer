import * as React from 'react';
import { m, AnimatePresence, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface ContextMenuProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger: React.ReactNode;
  children: React.ReactNode;
  position?: { x: number; y: number };
  className?: string;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  open: controlledOpen,
  onOpenChange,
  trigger,
  children,
  position,
  className,
}) => {
  const [open, setOpen] = React.useState(false);
  const [menuPos, setMenuPos] = React.useState<{ x: number; y: number } | null>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const isControlled = controlledOpen !== undefined;
  const reducedMotion = useReducedMotion();
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const anim = reducedMotion ? {} : {
    initial: { opacity: 0, scale: 0.98, y: isMobile ? 16 : 8 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.98, y: isMobile ? 16 : 8 },
    transition: { duration: isMobile ? 0.12 : 0.16 }
  };

  // Open on right-click or touch-and-hold
  const handleContextMenu = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const x = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const y = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    setMenuPos({ x, y });
    setOpen(true);
    onOpenChange?.(true);
  };

  // Keyboard navigation
  React.useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        onOpenChange?.(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onOpenChange]);

  // Smart position logic
  React.useEffect(() => {
    if (!open || !menuRef.current || !menuPos) return;
    const menu = menuRef.current;
    const { innerWidth, innerHeight } = window;
    let { x, y } = menuPos;
    const rect = menu.getBoundingClientRect();
    if (x + rect.width > innerWidth) x = innerWidth - rect.width - 8;
    if (y + rect.height > innerHeight) y = innerHeight - rect.height - 8;
    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;
  }, [open, menuPos]);

  // Touch-and-hold support
  const touchTimeout = React.useRef<NodeJS.Timeout | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => {
    touchTimeout.current = setTimeout(() => handleContextMenu(e), 500);
  };
  const handleTouchEnd = () => {
    if (touchTimeout.current) clearTimeout(touchTimeout.current);
  };

  // Controlled/uncontrolled open
  React.useEffect(() => {
    if (isControlled) setOpen(!!controlledOpen);
  }, [controlledOpen, isControlled]);

  return (
    <>
      <span
        onContextMenu={handleContextMenu}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        tabIndex={0}
        aria-haspopup="menu"
        aria-expanded={open}
        className="outline-none"
      >
        {trigger}
      </span>
      <AnimatePresence>
        {open && (
          <m.div
            ref={menuRef}
            className={cn('fixed z-50 min-w-[180px] rounded-md bg-popover shadow-lg border p-1', className)}
            style={{ willChange: 'transform, opacity', left: menuPos?.x, top: menuPos?.y }}
            tabIndex={-1}
            role="menu"
            aria-label="Context Menu"
            onBlur={() => setOpen(false)}
            {...anim}
          >
            {children}
          </m.div>
        )}
      </AnimatePresence>
    </>
  );
};

export interface ContextMenuItemProps {
  icon?: React.ReactNode;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}
export const ContextMenuItem: React.FC<ContextMenuItemProps> = ({ icon, children, onClick, className }) => (
  <div
    className={cn('flex items-center gap-2 px-3 py-2 rounded cursor-pointer hover:bg-accent focus:bg-accent outline-none', className)}
    tabIndex={0}
    role="menuitem"
    onClick={onClick}
    onKeyDown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') onClick?.();
    }}
  >
    {icon && <span>{icon}</span>}
    <span>{children}</span>
  </div>
);

export const ContextMenuSeparator: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('my-1 h-px bg-muted', className)} role="separator" />
);

export const ContextMenuContent: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={cn('flex flex-col', className)}>{children}</div>
);

export const ContextMenuTrigger = ContextMenu; 