"use client";

import { useState, useEffect, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { navItems } from '@/components/navigation/nav-items';
import { Breadcrumb } from '@/components/navigation/breadcrumb';
import { Search } from '@/components/navigation/search';
import { User, LogOut, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface DashboardLayoutProps {
  children: React.ReactNode;
  showBreadcrumb?: boolean;
  className?: string;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  showBreadcrumb = true,
  className,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const pathname = usePathname();
  const router = useRouter();

  // Check for mobile viewport and set initial sidebar state
  useEffect(() => {
    const checkIfMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      // On desktop, sidebar should be open by default
      if (!mobile) {
        setSidebarOpen(true);
      }
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  // Load user data
  useEffect(() => {
    const userData = localStorage.getItem('userData');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        setUserName(user.name || '');
        setUserEmail(user.email || '');
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }
  }, []);

  // Logout handler
  const handleLogout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    router.push('/auth/login');
  }, [router]);

  // Toggle sidebar
  const toggleSidebar = useCallback(() => {
    setSidebarOpen(prev => !prev);
  }, []);

  // Close sidebar when route changes on mobile
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [pathname, isMobile]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Close sidebar on Escape key
      if (e.key === 'Escape' && sidebarOpen) {
        setSidebarOpen(false);
      }
      // Toggle sidebar on Ctrl+\ or Cmd+\
      if ((e.ctrlKey || e.metaKey) && e.key === '\\') {
        e.preventDefault();
        setSidebarOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sidebarOpen]);

  return (
    <div className={cn("flex h-screen bg-background overflow-hidden", className)}>
      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-30 w-64 transform",
        "transition-transform duration-300 ease-in-out",
        "md:relative md:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-full overflow-y-auto bg-card border-r">
          <div className="flex h-full flex-col">
            <div className="p-4">
              <h2 className="text-xl font-bold">Rival Outranker</h2>
            </div>
            
            {/* Main Navigation */}
            <nav className="flex-1 space-y-1 px-2 py-4">
              {navItems.map((item) => {
                const isActive = pathname === item.href || 
                  (item.exact ? pathname === item.href : pathname.startsWith(item.href));
                
                return (
                  <a
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center px-4 py-3 rounded-md text-sm font-medium',
                      'transition-colors duration-200',
                      isActive 
                        ? 'bg-accent text-accent-foreground' 
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    )}
                  >
                    <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                    {item.label}
                  </a>
                );
              })}
            </nav>

            {/* Bottom Section - Profile and Logout */}
            <div className="border-t p-2 space-y-1">
              <button
                onClick={() => router.push('/profile')}
                className={cn(
                  'w-full flex items-center px-4 py-3 rounded-md text-sm font-medium',
                  'transition-colors duration-200',
                  'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <User className="mr-3 h-5 w-5 flex-shrink-0" />
                <div className="flex-1 text-left">
                  <div className="font-medium">{userName || 'Profile'}</div>
                  {userEmail && (
                    <div className="text-xs text-muted-foreground truncate">
                      {userEmail}
                    </div>
                  )}
                </div>
              </button>
              
              <button
                onClick={handleLogout}
                className={cn(
                  'w-full flex items-center px-4 py-3 rounded-md text-sm font-medium',
                  'transition-colors duration-200',
                  'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <LogOut className="mr-3 h-5 w-5 flex-shrink-0" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={toggleSidebar}
          aria-hidden="true"
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-card border-b">
          <div className="flex items-center justify-between p-4 gap-4">
            {/* Mobile menu toggle button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={toggleSidebar}
              aria-label="Toggle sidebar"
            >
              <Menu className="h-5 w-5" />
            </Button>
            
            {/* Breadcrumb navigation */}
            {showBreadcrumb && (
              <div className="flex-1 min-w-0">
                <Breadcrumb />
              </div>
            )}
            {/* Quick search modal/trigger */}
            <div className="flex items-center gap-2">
              <Search />
              {/* Add user menu, notifications, etc. here if needed */}
            </div>
          </div>
        </header>

        {/* Main content area */}
        <main
          className="flex-1 overflow-y-auto p-4 md:p-6 focus:outline-none"
          tabIndex={-1}
          id="main-content"
        >
          <div className="space-y-6">
            {children}
          </div>
        </main>
      </div>

      {/* Skip to main content link for keyboard users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:bg-background focus:px-4 focus:py-2 focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:rounded-md"
      >
        Skip to main content
      </a>
    </div>
  );
};

export default DashboardLayout;
