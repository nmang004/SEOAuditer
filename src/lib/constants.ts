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
    description: "Manage your SEO projects"
  },
  {
    id: "analyses",
    title: "Analyses",
    href: "/dashboard/analyses",
    icon: "bar-chart",
    description: "View and manage your SEO analyses"
  },
  {
    id: "competitors",
    title: "Competitors",
    href: "/dashboard/competitors",
    icon: "users",
    description: "Analyze and track your competitors"
  },
  {
    id: "keywords",
    title: "Keywords",
    href: "/dashboard/keywords",
    icon: "key",
    description: "Manage and track your keyword rankings"
  },
  {
    id: "settings",
    title: "Settings",
    href: "/dashboard/settings",
    icon: "settings",
    description: "Configure your account and preferences"
  },
];

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
