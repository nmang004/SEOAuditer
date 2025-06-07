'use client';

import * as React from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';
import { useMobile } from '@/hooks/use-mobile';
import { hapticFeedback } from '@/lib/pwa';

interface MobileSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  title?: string;
  description?: string;
  height?: 'auto' | 'half' | 'full';
  snapPoints?: number[];
  showHandle?: boolean;
  showCloseButton?: boolean;
  closeOnBackdropClick?: boolean;
  className?: string;
}

export function MobileSheet({
  open,
  onOpenChange,
  children,
  title,
  description,
  height = 'auto',
  snapPoints = [0.5, 0.8],
  showHandle = true,
  showCloseButton = true,
  closeOnBackdropClick = true,
  className,
}: MobileSheetProps) {
  const { isMobile } = useMobile();
  const [currentSnapPoint, setCurrentSnapPoint] = React.useState(snapPoints[0]);
  const [dragStart, setDragStart] = React.useState(0);

  const getInitialY = () => {
    switch (height) {
      case 'half':
        return window.innerHeight * 0.5;
      case 'full':
        return 0;
      default:
        return window.innerHeight * (1 - currentSnapPoint);
    }
  };

  const handleDragStart = () => {
    setDragStart(Date.now());
    hapticFeedback('light');
  };

  const handleDragEnd = (event: any, info: PanInfo) => {
    const dragDuration = Date.now() - dragStart;
    const velocity = info.velocity.y;
    const offset = info.offset.y;
    
    // Fast swipe down to close
    if (velocity > 500 || (dragDuration < 300 && offset > 100)) {
      hapticFeedback('medium');
      onOpenChange(false);
      return;
    }

    // Snap to closest snap point
    if (snapPoints.length > 1) {
      const windowHeight = window.innerHeight;
      const currentPosition = (windowHeight - offset) / windowHeight;
      
      let closestSnapPoint = snapPoints[0];
      let closestDistance = Math.abs(currentPosition - snapPoints[0]);
      
      snapPoints.forEach(point => {
        const distance = Math.abs(currentPosition - point);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestSnapPoint = point;
        }
      });
      
      setCurrentSnapPoint(closestSnapPoint);
      hapticFeedback('light');
    }
  };

  const handleClose = () => {
    hapticFeedback('medium');
    onOpenChange(false);
  };

  const sheetHeight = React.useMemo(() => {
    switch (height) {
      case 'full':
        return '100vh';
      case 'half':
        return '50vh';
      default:
        return `${currentSnapPoint * 100}vh`;
    }
  }, [height, currentSnapPoint]);

  if (!isMobile) {
    // Fallback to regular modal for desktop
    return (
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
              onClick={closeOnBackdropClick ? handleClose : undefined}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={cn(
                'fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2',
                'bg-background border rounded-lg shadow-lg',
                className
              )}
            >
              {(title || showCloseButton) && (
                <div className="flex items-center justify-between p-4 border-b">
                  <div>
                    {title && <h2 className="text-lg font-semibold">{title}</h2>}
                    {description && <p className="text-sm text-muted-foreground">{description}</p>}
                  </div>
                  {showCloseButton && (
                    <Button variant="ghost" size="icon" onClick={handleClose}>
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              )}
              <div className="p-4">
                {children}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm"
            onClick={closeOnBackdropClick ? handleClose : undefined}
          />
          
          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: getInitialY() }}
            exit={{ y: '100%' }}
            drag="y"
            dragConstraints={{ top: 0, bottom: window.innerHeight }}
            dragElastic={0.2}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            className={cn(
              'fixed bottom-0 left-0 right-0 z-50',
              'bg-background border-t rounded-t-xl shadow-lg',
              'touch-none select-none',
              className
            )}
            style={{ height: sheetHeight }}
            transition={{
              type: 'spring',
              damping: 30,
              stiffness: 300,
            }}
          >
            {/* Drag Handle */}
            {showHandle && (
              <div className="flex justify-center py-3">
                <div className="w-10 h-1 bg-muted-foreground/30 rounded-full" />
              </div>
            )}
            
            {/* Header */}
            {(title || showCloseButton) && (
              <div className="flex items-center justify-between px-4 pb-2">
                <div>
                  {title && <h2 className="text-lg font-semibold">{title}</h2>}
                  {description && <p className="text-sm text-muted-foreground">{description}</p>}
                </div>
                {showCloseButton && (
                  <Button variant="ghost" size="icon" onClick={handleClose}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}
            
            {/* Content */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-4">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Context for managing multiple sheets
interface MobileSheetContextType {
  openSheet: (id: string, config: Omit<MobileSheetProps, 'open' | 'onOpenChange'>) => void;
  closeSheet: (id: string) => void;
  closeAllSheets: () => void;
}

const MobileSheetContext = React.createContext<MobileSheetContextType | null>(null);

interface MobileSheetProviderProps {
  children: React.ReactNode;
}

export function MobileSheetProvider({ children }: MobileSheetProviderProps) {
  const [sheets, setSheets] = React.useState<Map<string, MobileSheetProps>>(new Map());

  const openSheet = React.useCallback((id: string, config: Omit<MobileSheetProps, 'open' | 'onOpenChange'>) => {
    setSheets(prev => new Map(prev).set(id, {
      ...config,
      open: true,
      onOpenChange: (open) => {
        if (!open) {
          setSheets(prev => {
            const next = new Map(prev);
            next.delete(id);
            return next;
          });
        }
      },
    }));
  }, []);

  const closeSheet = React.useCallback((id: string) => {
    setSheets(prev => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const closeAllSheets = React.useCallback(() => {
    setSheets(new Map());
  }, []);

  const contextValue = React.useMemo(() => ({
    openSheet,
    closeSheet,
    closeAllSheets,
  }), [openSheet, closeSheet, closeAllSheets]);

  return (
    <MobileSheetContext.Provider value={contextValue}>
      {children}
      {Array.from(sheets.entries()).map(([id, props]) => (
        <MobileSheet key={id} {...props} />
      ))}
    </MobileSheetContext.Provider>
  );
}

export function useMobileSheet() {
  const context = React.useContext(MobileSheetContext);
  if (!context) {
    throw new Error('useMobileSheet must be used within a MobileSheetProvider');
  }
  return context;
} 