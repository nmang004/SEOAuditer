import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const themeConfig = {
  // Animation durations (in seconds)
  durations: {
    fast: 0.15,
    normal: 0.3,
    slow: 0.5,
  },
  
  // Easing functions
  easings: {
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    easeOut: 'cubic-bezier(0.0, 0, 0.2, 1)',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
  },
  
  // Z-index scale
  zIndex: {
    modal: 50,
    overlay: 40,
    dropdown: 30,
    header: 20,
    base: 1,
  },
  
  // Border radius
  radius: {
    sm: '0.125rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    '2xl': '1rem',
    '3xl': '1.5rem',
    full: '9999px',
  },
  
  // Shadows
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
    none: 'none',
  },
  
  // Transitions
  transitions: {
    default: 'all 0.2s ease-in-out',
    transform: 'transform 0.2s ease-in-out',
    opacity: 'opacity 0.2s ease-in-out',
    colors: 'color, background-color, border-color, text-decoration-color, fill, stroke 0.2s ease-in-out',
  },
} as const;

export type ThemeConfig = typeof themeConfig;

// Theme palettes
export const themes = {
  light: {
    background: '#ffffff',
    foreground: '#0f172a',
    primary: '#2563eb',
    secondary: '#64748b',
    accent: '#fbbf24',
    error: '#ef4444',
    success: '#22c55e',
    warning: '#f59e42',
    info: '#0ea5e9',
  },
  dark: {
    background: '#0f172a',
    foreground: '#f1f5f9',
    primary: '#60a5fa',
    secondary: '#94a3b8',
    accent: '#fbbf24',
    error: '#f87171',
    success: '#4ade80',
    warning: '#fbbf24',
    info: '#38bdf8',
  },
  highContrast: {
    background: '#000000',
    foreground: '#ffffff',
    primary: '#ffff00',
    secondary: '#00ffff',
    accent: '#ff00ff',
    error: '#ff0000',
    success: '#00ff00',
    warning: '#ff9900',
    info: '#00ffea',
  },
  colorblindFriendly: {
    background: '#f5f5f2',
    foreground: '#222222',
    primary: '#0072b2',
    secondary: '#009e73',
    accent: '#f0e442',
    error: '#d55e00',
    success: '#009e73',
    warning: '#e69f00',
    info: '#56b4e9',
  },
};
