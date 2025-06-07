import type { NavItem } from "@/types/navigation";

/**
 * Navigation items for the sidebar
 */
export const navigationItems: NavItem[] = [
  {
    id: "dashboard",
    title: "Dashboard",
    href: "/dashboard",
    icon: "layout-dashboard",
    description: "View your dashboard with key metrics and insights"
  },
  {
    id: "projects",
    title: "Projects",
    href: "/dashboard/projects",
    icon: "folder",
    description: "Manage your SEO projects",
    children: [
      {
        id: "projects-list",
        title: "All Projects",
        href: "/dashboard/projects",
        icon: "folder",
        description: "View all projects"
      },
      {
        id: "projects-new",
        title: "New Project",
        href: "/dashboard/projects/new",
        icon: "plus",
        description: "Create a new project"
      }
    ]
  },
  {
    id: "analyses",
    title: "Analyses",
    href: "/analyses",
    icon: "bar-chart",
    description: "View and manage your SEO analyses",
    children: [
      {
        id: "analyses-all",
        title: "All Analyses",
        href: "/analyses",
        icon: "bar-chart",
        description: "View all analyses"
      },
      {
        id: "analyses-new",
        title: "New Analysis",
        href: "/analyses/new",
        icon: "plus",
        description: "Start a new analysis"
      }
    ]
  },
  {
    id: "issues",
    title: "Issues",
    href: "/issues",
    icon: "alert-triangle",
    description: "Track and manage SEO issues",
    children: [
      {
        id: "issues-all",
        title: "All Issues",
        href: "/issues",
        icon: "alert-triangle",
        description: "View all issues"
      },
      {
        id: "issues-critical",
        title: "Critical Issues",
        href: "/issues/critical",
        icon: "alert-circle",
        description: "View critical issues"
      },
      {
        id: "issues-resolved",
        title: "Resolved Issues",
        href: "/issues/resolved",
        icon: "check-circle",
        description: "View resolved issues"
      }
    ]
  },
  {
    id: "search",
    title: "Search",
    href: "/search",
    icon: "search",
    description: "Search across projects and analyses"
  },
  {
    id: "settings",
    title: "Settings",
    href: "/dashboard/settings",
    icon: "settings",
    description: "Configure your account and preferences",
    children: [
      {
        id: "settings-profile",
        title: "Profile",
        href: "/dashboard/settings/profile",
        icon: "user",
        description: "Manage your profile"
      },
      {
        id: "settings-billing",
        title: "Billing",
        href: "/dashboard/settings/billing",
        icon: "credit-card",
        description: "Manage billing and subscription"
      }
    ]
  }
];

/**
 * Analysis navigation tabs
 */
export const analysisNavTabs = [
  { id: 'overview', label: 'Overview', icon: 'eye' },
  { id: 'technical', label: 'Technical SEO', icon: 'settings' },
  { id: 'content', label: 'Content', icon: 'file-text' },
  { id: 'onpage', label: 'On-Page SEO', icon: 'layout' },
  { id: 'performance', label: 'Performance', icon: 'zap' },
  { id: 'issues', label: 'Issues', icon: 'alert-triangle' },
  { id: 'recommendations', label: 'Recommendations', icon: 'lightbulb' },
  { id: 'history', label: 'History', icon: 'clock' },
  { id: 'export', label: 'Export', icon: 'download' }
];

/**
 * URL generation helpers
 */
export const urlHelpers = {
  // Generate analysis URL with optional tab and project context
  analysis: (analysisId: string, tab?: string, projectId?: string): string => {
    const basePath = projectId 
      ? `/projects/${projectId}/analyses/${analysisId}`
      : `/analyses/${analysisId}`;
    
    return tab ? `${basePath}/${tab}` : `${basePath}/overview`;
  },

  // Generate issue URL with context
  issue: (issueId: string, context?: { projectId?: string; analysisId?: string }): string => {
    if (context?.analysisId) {
      return context.projectId
        ? `/projects/${context.projectId}/analyses/${context.analysisId}/issues/${issueId}`
        : `/analyses/${context.analysisId}/issues/${issueId}`;
    } else if (context?.projectId) {
      return `/projects/${context.projectId}/issues/${issueId}`;
    } else {
      return `/issues/${issueId}`;
    }
  },

  // Generate project URL
  project: (projectId: string, section?: string): string => {
    const basePath = `/projects/${projectId}`;
    return section ? `${basePath}/${section}` : basePath;
  }
};

/**
 * SEO score categories
 */
export const scoreCategories = [
  {
    name: "Technical SEO",
    weight: 0.3,
  },
  {
    name: "Content Quality",
    weight: 0.25,
  },
  {
    name: "On-Page SEO",
    weight: 0.2,
  },
  {
    name: "Off-Page SEO",
    weight: 0.15,
  },
  {
    name: "User Experience",
    weight: 0.1,
  },
];

/**
 * SEO issue severity levels
 */
export const issueSeverity = {
  CRITICAL: "critical",
  HIGH: "high",
  MEDIUM: "medium",
  LOW: "low",
};

/**
 * Breakpoints for responsive design
 */
export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
};
