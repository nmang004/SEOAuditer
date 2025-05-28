import { LayoutDashboard, Search, Settings, BarChart, FileText, Users, Zap } from "lucide-react";

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
    label: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
];

export const isActive = (pathname: string, href: string, exact: boolean = false) => {
  if (exact) {
    return pathname === href;
  }
  return pathname.startsWith(href);
};
