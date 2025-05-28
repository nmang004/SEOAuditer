import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import * as React from "react";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LayoutDashboard, 
  Folder, 
  BarChart, 
  Users, 
  Key, 
  Settings, 
  ChevronDown,
  ChevronRight,
  X,
  LogOut,
  User,
  type LucideIcon
} from "lucide-react";

// Project imports
import { cn } from "@/lib/utils";
import { navigationItems } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { NavItem, SidebarNavItem } from "@/types/navigation";

type LucideIconType = React.ComponentType<{ size?: number | string; className?: string }>;

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItemProps {
  item: SidebarNavItem;
  isActive: boolean;
}

const NavItem = ({ item, isActive }: NavItemProps) => {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const itemRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const hasChildren = item.children && item.children.length > 0;
  
  const handleToggle = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault();
    if (hasChildren) {
      setIsExpanded(!isExpanded);
    } else {
      router.push(item.href);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleToggle(e);
    } else if (e.key === 'ArrowRight' && !isExpanded) {
      e.preventDefault();
      setIsExpanded(true);
    } else if (e.key === 'ArrowLeft' && isExpanded) {
      e.preventDefault();
      setIsExpanded(false);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      if (isExpanded) {
        setIsExpanded(false);
      } else if (itemRef.current?.parentElement?.previousElementSibling) {
        (itemRef.current.parentElement.previousElementSibling as HTMLElement).focus();
      }
    }
  };

  const getIcon = (iconName: string): React.ReactNode => {
    const iconMap: Record<string, LucideIconType> = {
      "layout-dashboard": LayoutDashboard,
      "folder": Folder,
      "bar-chart": BarChart,
      "users": Users,
      "key": Key,
      "settings": Settings,
    };

    const IconComponent = iconMap[iconName] || LayoutDashboard;
    return IconComponent ? <IconComponent size={18} /> : null;
  };

  return (
    <div className="mb-1" ref={itemRef}>
      <div
        role="button"
        tabIndex={0}
        className={cn(
          "flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          isActive
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
          hasChildren && "cursor-pointer"
        )}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        aria-expanded={hasChildren ? isExpanded : undefined}
        aria-haspopup={hasChildren ? "menu" : undefined}
        aria-current={isActive ? "page" : undefined}
      >
        <div className="flex flex-1 items-center">
          <span className="mr-2" aria-hidden="true">
            {getIcon(item.icon)}
          </span>
          <span>{item.title}</span>
        </div>
        {hasChildren && (
          <span className="ml-auto" aria-hidden="true">
            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </span>
        )}
      </div>

      <AnimatePresence initial={false}>
        {isExpanded && hasChildren && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden pl-6"
          >
            {item.children?.map((child, index) => (
              <Link
                key={index}
                href={child.href}
                className={cn(
                  "flex items-center rounded-md px-3 py-2 text-sm",
                  child.href === item.href
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                {child.title}
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const sidebarRef = useRef<HTMLElement>(null);
  const currentPath = `/${pathname?.split('/')[1] || ''}`;

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isOpen && sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Close sidebar on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Trap focus inside sidebar when open
  useEffect(() => {
    if (!isOpen) return;

    const focusableElements = sidebarRef.current?.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (!focusableElements || focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener('keydown', handleTabKey);
    firstElement.focus();

    return () => document.removeEventListener('keydown', handleTabKey);
  }, [isOpen]);

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
            onClick={onClose}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        ref={sidebarRef}
        initial={{ x: '-100%' }}
        animate={{ x: isOpen ? 0 : '-100%' }}
        exit={{ x: '-100%' }}
        transition={{ type: 'tween', ease: 'easeInOut' }}
        className={cn(
          'fixed left-0 top-0 z-50 flex h-full w-64 flex-col border-r bg-background',
          'md:relative md:left-auto md:top-auto md:z-auto md:block md:h-screen md:translate-x-0',
          isOpen ? 'block' : 'hidden'
        )}
        role="navigation"
        aria-label="Main navigation"
      >
        {/* Sidebar header */}
        <div className="flex h-16 items-center justify-between border-b px-4">
          <Link 
            href="/dashboard" 
            className="flex items-center space-x-2 rounded-md p-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <span className="text-xl font-bold">Rival Outranker</span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="md:hidden"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          {navigationItems.map((item, index) => {
            // Skip hidden items
            if (item.hidden) return null;
            
            const isActive = item.href === '/' 
              ? currentPath === item.href 
              : currentPath.startsWith(item.href);
              
            return (
              <NavItem
                key={item.id || index}
                item={item}
                isActive={isActive}
              />
            );
          })}
        </nav>

        {/* User profile */}
        <div className="border-t p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Avatar>
                <AvatarImage src="/images/avatar-placeholder.jpg" alt="User avatar" />
                <AvatarFallback className="bg-primary/10 text-primary">
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="max-w-[140px]">
                <p className="truncate text-sm font-medium">John Doe</p>
                <p className="truncate text-xs text-muted-foreground">admin@example.com</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <LogOut className="h-4 w-4" />
              <span className="sr-only">Sign out</span>
            </Button>
          </div>
        </div>
      </motion.aside>
    </>
  );
}

function getIcon(iconName: string) {
  switch (iconName) {
    case "layout-dashboard":
      return <LayoutDashboard size={18} />;
    case "folder":
      return <Folder size={18} />;
    case "bar-chart":
      return <BarChart size={18} />;
    case "users":
      return <Users size={18} />;
    case "key":
      return <Key size={18} />;
    case "settings":
      return <Settings size={18} />;
    default:
      return <LayoutDashboard size={18} />;
  }
}
