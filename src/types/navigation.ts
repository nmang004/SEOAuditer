/**
 * Base navigation item with common properties
 */
export interface BaseNavItem {
  /** The title of the navigation item */
  title: string;
  /** The URL the item points to */
  href: string;
  /** Whether the item is disabled */
  disabled?: boolean;
  /** Whether the link is external */
  external?: boolean;
  /** Unique identifier for the item */
  id?: string;
  /** Optional description for the navigation item */
  description?: string;
}

/**
 * Navigation item with an icon
 */
export interface NavItem extends BaseNavItem {
  /** The name of the icon to display (matches Lucide icon names) */
  icon: string;
  /** Child navigation items */
  children?: NavItem[];
  /** Whether the item should be hidden from the navigation */
  hidden?: boolean;
  /** Optional badge to display with the item */
  badge?: string;
  /** Optional callback when the item is clicked */
  onClick?: () => void;
}

/**
 * Main navigation item (top navigation)
 */
export interface MainNavItem extends BaseNavItem {
  /** Child navigation items for dropdown menus */
  items?: MainNavItem[];
  /** Optional badge to display with the item */
  badge?: string;
}

/**
 * Sidebar navigation item
 */
export interface SidebarNavItem extends NavItem {
  /** Child navigation items for nested navigation */
  items?: SidebarNavItem[];
  /** Whether the item is expanded by default */
  expanded?: boolean;
  /** Optional badge to display with the item */
  badge?: string;
}
