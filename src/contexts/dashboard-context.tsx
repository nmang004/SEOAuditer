import React, { createContext, useContext, useState, ReactNode } from 'react';

interface DashboardContextType {
  // Projects state
  hasProjects: boolean;
  setHasProjects: (has: boolean) => void;
  
  // Analysis state
  hasAnalyses: boolean;
  setHasAnalyses: (has: boolean) => void;
  
  // Issues state
  hasIssues: boolean;
  setHasIssues: (has: boolean) => void;
  
  // Search state
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  hasSearchResults: boolean;
  setHasSearchResults: (has: boolean) => void;
  
  // Loading states
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

interface DashboardProviderProps {
  children: ReactNode;
  initialValues?: Partial<Omit<DashboardContextType, 'setHasProjects' | 'setHasAnalyses' | 'setHasIssues' | 'setSearchQuery' | 'setHasSearchResults' | 'setIsLoading'>>;
}

export function DashboardProvider({ children, initialValues = {} }: DashboardProviderProps) {
  const [hasProjects, setHasProjects] = useState(initialValues.hasProjects ?? false);
  const [hasAnalyses, setHasAnalyses] = useState(initialValues.hasAnalyses ?? false);
  const [hasIssues, setHasIssues] = useState(initialValues.hasIssues ?? false);
  const [searchQuery, setSearchQuery] = useState(initialValues.searchQuery ?? '');
  const [hasSearchResults, setHasSearchResults] = useState(initialValues.hasSearchResults ?? true);
  const [isLoading, setIsLoading] = useState(initialValues.isLoading ?? false);

  const value = {
    hasProjects,
    setHasProjects,
    hasAnalyses,
    setHasAnalyses,
    hasIssues,
    setHasIssues,
    searchQuery,
    setSearchQuery,
    hasSearchResults,
    setHasSearchResults,
    isLoading,
    setIsLoading,
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
}
