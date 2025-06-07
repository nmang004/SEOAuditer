import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { X, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { NavItem } from "@/components/navigation/nav-items";
import { navItems } from "@/components/navigation/nav-items";
import { analysisNavItems } from "@/components/navigation/nav-items";

type MobileNavigationProps = {
  className?: string;
  navItems?: NavItem[];
};

export function MobileNavigation({ className, navItems: customNavItems }: MobileNavigationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const items = customNavItems || navItems;

  // Close menu when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Close menu when pressing escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className={className}>
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? 'Close menu' : 'Open menu'}
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      <div
        className={cn(
          'fixed inset-0 z-50 bg-background/80 backdrop-blur-sm transition-opacity',
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
          'md:hidden'
        )}
        onClick={() => setIsOpen(false)}
      >
        <div
          className={cn(
            'fixed left-0 top-0 h-full w-4/5 max-w-sm bg-background border-r shadow-lg transition-transform duration-300 ease-in-out',
            isOpen ? 'translate-x-0' : '-translate-x-full',
            'flex flex-col'
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">Menu</h2>
          </div>
          
          <ScrollArea className="flex-1">
            <nav className="space-y-1 p-4">
              {items.map((item: NavItem) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                
                return (
                  <a
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-accent text-accent-foreground'
                        : 'text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground'
                    )}
                  >
                    <Icon className="mr-3 h-5 w-5" />
                    {item.label}
                  </a>
                );
              })}
            </nav>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
