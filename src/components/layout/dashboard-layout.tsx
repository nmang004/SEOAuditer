import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Header } from "./header";
import { Sidebar } from "./sidebar";
import { pageTransition } from "@/lib/animations";
import { useRouter } from "next/router";
import { DashboardProvider } from "@/contexts/dashboard-context";
import { ProjectEmptyState, AnalysisEmptyState, NoIssuesState, SearchEmptyState } from "@/components/empty-states";

interface DashboardLayoutProps {
  children: React.ReactNode;
  showBreadcrumb?: boolean;
}

// Main dashboard content with empty state handling
function DashboardContent({ 
  children, 
  showBreadcrumb = true 
}: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const mainContentRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Toggle sidebar
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Close sidebar when route changes
  useEffect(() => {
    const handleRouteChange = () => {
      setSidebarOpen(false);
      // Focus on main content on route change for better keyboard navigation
      if (mainContentRef.current) {
        mainContentRef.current.focus();
      }
    };

    router.events.on('routeChangeComplete', handleRouteChange);
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router.events]);

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
        toggleSidebar();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sidebarOpen]);
  
  // Set focus to main content when the component mounts
  useEffect(() => {
    if (mainContentRef.current) {
      mainContentRef.current.focus();
    }
  }, []);

  // Get dashboard state
  const isDashboardHome = router.pathname === '/dashboard';
  const isProjectsPage = router.pathname === '/dashboard/projects';
  const isAnalysesPage = router.pathname === '/dashboard/analyses';
  const isIssuesPage = router.pathname === '/dashboard/issues';
  const isSearchPage = router.pathname === '/dashboard/search';

  // Mock data - in a real app, this would come from your data fetching
  const hasProjects = false; // Set based on your data
  const hasAnalyses = false; // Set based on your data
  const hasIssues = false; // Set based on your data
  const hasSearchResults = false; // Set based on search results
  const searchQuery = ''; // Set based on search input

  // Determine if we should show an empty state
  const showEmptyState = 
    (isProjectsPage && !hasProjects) ||
    (isAnalysesPage && !hasAnalyses) ||
    (isIssuesPage && !hasIssues) ||
    (isSearchPage && !hasSearchResults);

  // Handle actions
  const handleCreateProject = () => {
    // Implement project creation logic
    console.log('Create project clicked');
  };

  const handleRunAnalysis = () => {
    // Implement analysis run logic
    console.log('Run analysis clicked');
  };

  const handleClearSearch = () => {
    // Implement search clear logic
    console.log('Clear search clicked');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <Header 
          onToggleSidebar={toggleSidebar} 
          showBreadcrumb={showBreadcrumb} 
        />

        {/* Page content */}
        <motion.main
          ref={mainContentRef}
          id="main-content"
          className="flex-1 overflow-y-auto focus:outline-none"
          tabIndex={-1}
          initial="initial"
          animate="animate"
          variants={pageTransition}
        >
          <div className="min-h-full">
            {showEmptyState ? (
              <div className="h-full flex items-center justify-center py-12 px-4">
                {isProjectsPage && !hasProjects && (
                  <ProjectEmptyState 
                    onCreateProject={handleCreateProject} 
                    className="w-full max-w-md"
                  />
                )}
                
                {isAnalysesPage && !hasAnalyses && (
                  <AnalysisEmptyState 
                    onRunAnalysis={handleRunAnalysis} 
                    className="w-full max-w-md"
                  />
                )}
                
                {isIssuesPage && !hasIssues && (
                  <NoIssuesState className="w-full max-w-md" />
                )}
                
                {isSearchPage && !hasSearchResults && (
                  <SearchEmptyState 
                    searchQuery={searchQuery}
                    onClearSearch={handleClearSearch}
                    className="w-full max-w-md"
                  />
                )}
              </div>
            ) : (
              <div className="container py-6 md:py-8">
                {children}
              </div>
            )}
          </div>
        </motion.main>
      </div>
      
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-20"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}
      
      {/* Skip to main content link for keyboard users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:bg-background focus:px-4 focus:py-2 focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:rounded-md"
      >
        Skip to main content
      </a>
    </div>
  );
}
