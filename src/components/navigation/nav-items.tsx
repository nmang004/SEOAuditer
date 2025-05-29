import { LayoutDashboard, Search, Settings, BarChart, FileText, Users, Zap, Sparkles, AlertTriangle } from "lucide-react";

// Define the NavItem type
export interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
}

// Export the nav items array
export const navItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    label: "Keyword Research",
    href: "/dashboard/keywords",
    icon: Search,
  },
  {
    label: "Content Analysis",
    href: "/dashboard/content",
    icon: FileText,
  },
  {
    label: "Rankings",
    href: "/dashboard/rankings",
    icon: BarChart,
  },
  {
    label: "Competitors",
    href: "/dashboard/competitors",
    icon: Users,
  },
  {
    label: "Automations",
    href: "/dashboard/automations",
    icon: Zap,
  },
  {
    label: "Interactive Demo",
    href: "/interactive-demo",
    icon: Sparkles,
  },
  {
    label: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
];

export const analysisNavItems: NavItem[] = [
  {
    label: 'Score Overview',
    href: '/analysis#score',
    icon: BarChart,
  },
  {
    label: 'Issues',
    href: '/analysis#issues',
    icon: AlertTriangle,
  },
  {
    label: 'Technical',
    href: '/analysis#technical',
    icon: Zap,
  },
  {
    label: 'Content',
    href: '/analysis#content',
    icon: FileText,
  },
  {
    label: 'Recommendations',
    href: '/analysis#recommendations',
    icon: Sparkles,
  },
  {
    label: 'Trends',
    href: '/analysis#trends',
    icon: BarChart,
  },
];

export const isActive = (pathname: string, href: string, exact: boolean = false) => {
  if (exact) {
    return pathname === href;
  }
  return pathname.startsWith(href);
};
