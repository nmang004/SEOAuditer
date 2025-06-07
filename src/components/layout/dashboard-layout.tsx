"use client";

import { useState, useEffect, useCallback, Suspense } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { cn } from '@/lib/utils';
import { navItems } from '@/components/navigation/nav-items';
import { User, LogOut, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Dynamically import heavy components
const Breadcrumb = dynamic(() => import('@/components/navigation/breadcrumb').then(mod => ({ default: mod.Breadcrumb })), {
  loading: () => <div className="h-6 bg-muted animate-pulse rounded" />,
  ssr: false,
});

const Search = dynamic(() => import('@/components/navigation/search').then(mod => ({ default: mod.Search })), {
  loading: () => <div className="h-9 w-64 bg-muted animate-pulse rounded" />,
  ssr: false,
});

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
    <div className={cn("flex h-screen bg-gradient-to-b from-[#0F172A] via-[#1A202C] to-[#0F172A] overflow-hidden relative", className)}>
      {/* Decorative background blobs */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-full blur-3xl -z-10"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-purple-500/10 to-pink-500/10 rounded-full blur-3xl -z-10"></div>
      
      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-30 w-64 transform",
        "transition-transform duration-300 ease-in-out",
        "md:relative md:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-full overflow-y-auto bg-gray-800/50 backdrop-blur-sm border-r border-gray-700">
          <div className="flex h-full flex-col">
            <div className="p-4">
              <h2 className="text-xl font-bold text-white bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">SEO Director</h2>
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
                      'flex items-center px-4 py-3 rounded-xl text-sm font-medium',
                      'transition-all duration-200',
                      isActive 
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white' 
                        : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
                    )}
                  >
                    <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                    {item.label}
                  </a>
                );
              })}
            </nav>

            {/* Bottom Section - Profile and Logout */}
            <div className="border-t border-gray-700 p-2 space-y-1">
              <button
                onClick={() => router.push('/profile')}
                className={cn(
                  'w-full flex items-center px-4 py-3 rounded-xl text-sm font-medium',
                  'transition-all duration-200',
                  'text-gray-300 hover:bg-gray-700/50 hover:text-white'
                )}
              >
                <User className="mr-3 h-5 w-5 flex-shrink-0" />
                <div className="flex-1 text-left">
                  <div className="font-medium">{userName || 'Admin User'}</div>
                  {userEmail && (
                    <div className="text-xs text-gray-400 truncate">
                      {userEmail}
                    </div>
                  )}
                </div>
              </button>
              
              <button
                onClick={handleLogout}
                className={cn(
                  'w-full flex items-center px-4 py-3 rounded-xl text-sm font-medium',
                  'transition-all duration-200',
                  'text-gray-300 hover:bg-red-600/20 hover:text-red-400'
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
        <header className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700 relative z-10">
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
                <Suspense fallback={<div className="h-6 bg-muted animate-pulse rounded" />}>
                  <Breadcrumb />
                </Suspense>
              </div>
            )}
            {/* Quick search modal/trigger */}
            <div className="flex items-center gap-2">
              <Suspense fallback={<div className="h-9 w-64 bg-muted animate-pulse rounded" />}>
                <Search />
              </Suspense>
              {/* Add user menu, notifications, etc. here if needed */}
            </div>
          </div>
        </header>

        {/* Main content area */}
        <main
          className="flex-1 overflow-y-auto p-4 md:p-6 focus:outline-none relative z-10"
          tabIndex={-1}
          id="main-content"
        >
          <div className="space-y-6 relative">
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
