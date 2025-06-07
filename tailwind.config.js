/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    screens: {
      'xs': '475px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
      // Mobile-first breakpoints
      'mobile': '320px',
      'mobile-lg': '414px',
      'tablet': '768px',
      'tablet-lg': '1024px',
      'desktop': '1280px',
      // Touch device queries
      'touch': { 'raw': '(pointer: coarse)' },
      'no-touch': { 'raw': '(pointer: fine)' },
      // Orientation queries
      'portrait': { 'raw': '(orientation: portrait)' },
      'landscape': { 'raw': '(orientation: landscape)' },
    },
    extend: {
      colors: {
        // Primary Brand Colors - Rival Digital
        primary: {
          50: "#f0f9ff",
          100: "#e0f2fe",
          200: "#bae6fd",
          300: "#7dd3fc",
          400: "#38bdf8",
          500: "#0ea5e9",
          600: "#0284c7",
          700: "#0369a1",
          800: "#075985",
          900: "#0c4a6e",
        },
        // Success (Good SEO)
        success: {
          50: "#ecfdf5",
          100: "#d1fae5",
          200: "#a7f3d0",
          300: "#6ee7b7",
          400: "#34d399",
          500: "#10b981",
          600: "#059669",
          700: "#047857",
          800: "#065f46",
          900: "#064e3b",
        },
        // Warning (Needs Improvement)
        warning: {
          50: "#fffbeb",
          100: "#fef3c7",
          200: "#fde68a",
          300: "#fcd34d",
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
          700: "#b45309",
          800: "#92400e",
          900: "#78350f",
        },
        // Danger (Critical Issues)
        danger: {
          50: "#fef2f2",
          100: "#fee2e2",
          200: "#fecaca",
          300: "#fca5a5",
          400: "#f87171",
          500: "#ef4444",
          600: "#dc2626",
          700: "#c53030",
          800: "#991b1b",
          900: "#7f1d1d",
        },
        // Neutral Grays
        gray: {
          50: "#f9fafb",
          100: "#f3f4f6",
          200: "#e5e7eb",
          300: "#d1d5db",
          400: "#9ca3af",
          500: "#6b7280",
          600: "#4b5563",
          700: "#374151",
          800: "#1f2937",
          900: "#111827",
        },
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        background: "var(--background)",
        foreground: "var(--foreground)",
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["var(--font-inter)"],
        mono: ["var(--font-jetbrains-mono)"],
      },
      fontSize: {
        xs: ["12px", { lineHeight: "16px" }],
        sm: ["14px", { lineHeight: "20px" }],
        base: ["16px", { lineHeight: "24px" }],
        lg: ["18px", { lineHeight: "28px" }],
        xl: ["20px", { lineHeight: "28px" }],
        "2xl": ["24px", { lineHeight: "32px" }],
        "3xl": ["30px", { lineHeight: "36px" }],
        "4xl": ["36px", { lineHeight: "40px" }],
        "5xl": ["48px", { lineHeight: "1" }],
      },
      spacing: {
        // Touch-friendly spacing
        'touch': '44px', // Minimum touch target size
        'touch-sm': '36px',
        'touch-lg': '56px',
        // Mobile-specific spacing
        'mobile-safe': 'env(safe-area-inset-bottom)',
        'status-bar': 'env(safe-area-inset-top)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
        // Common mobile spacing patterns
        '15': '3.75rem',
        '18': '4.5rem',
        '22': '5.5rem',
        '26': '6.5rem',
        '30': '7.5rem',
      },
      minHeight: {
        'touch': '44px',
        'screen-safe': 'calc(100vh - env(safe-area-inset-top) - env(safe-area-inset-bottom))',
      },
      minWidth: {
        'touch': '44px',
      },
      maxWidth: {
        'mobile': '320px',
        'mobile-lg': '414px',
        'tablet': '768px',
      },
      height: {
        'screen-safe': 'calc(100vh - env(safe-area-inset-top) - env(safe-area-inset-bottom))',
        'screen-no-nav': 'calc(100vh - 4rem)', // Assuming 64px nav height
      },
      width: {
        'touch': '44px',
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
        "fade-in": {
          from: { opacity: 0 },
          to: { opacity: 1 },
        },
        "fade-out": {
          from: { opacity: 1 },
          to: { opacity: 0 },
        },
        "slide-in-right": {
          from: { transform: "translateX(100%)" },
          to: { transform: "translateX(0)" },
        },
        "slide-out-right": {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(100%)" },
        },
        "slide-up": {
          from: { transform: "translateY(100%)" },
          to: { transform: "translateY(0)" },
        },
        "slide-down": {
          from: { transform: "translateY(0)" },
          to: { transform: "translateY(100%)" },
        },
        "bounce-in": {
          "0%": {
            transform: "scale(0.3)",
            opacity: "0",
          },
          "50%": {
            transform: "scale(1.1)",
            opacity: "0.8",
          },
          "100%": {
            transform: "scale(1)",
            opacity: "1",
          },
        },
        "pull-refresh": {
          "0%": { transform: "translateY(0px) rotate(0deg)" },
          "50%": { transform: "translateY(10px) rotate(180deg)" },
          "100%": { transform: "translateY(0px) rotate(360deg)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.2s ease-out",
        "fade-out": "fade-out 0.2s ease-out",
        "slide-in-right": "slide-in-right 0.3s ease-out",
        "slide-out-right": "slide-out-right 0.3s ease-out",
        "slide-up": "slide-up 0.3s ease-out",
        "slide-down": "slide-down 0.3s ease-out",
        "bounce-in": "bounce-in 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)",
        "pull-refresh": "pull-refresh 1s ease-in-out infinite",
      },
      backdropBlur: {
        xs: '2px',
      },
      transitionProperty: {
        'height': 'height',
        'spacing': 'margin, padding',
      },
      aspectRatio: {
        'mobile': '9 / 16',
        'tablet': '3 / 4',
        'desktop': '16 / 9',
      },
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100',
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    // Custom plugin for mobile utilities
    function({ addUtilities, theme }) {
      const newUtilities = {
        // Touch-friendly utilities
        '.touch-target': {
          minHeight: theme('spacing.touch'),
          minWidth: theme('spacing.touch'),
        },
        '.touch-target-sm': {
          minHeight: theme('spacing.touch-sm'),
          minWidth: theme('spacing.touch-sm'),
        },
        '.touch-target-lg': {
          minHeight: theme('spacing.touch-lg'),
          minWidth: theme('spacing.touch-lg'),
        },
        // Mobile-safe area utilities
        '.safe-top': {
          paddingTop: 'env(safe-area-inset-top)',
        },
        '.safe-bottom': {
          paddingBottom: 'env(safe-area-inset-bottom)',
        },
        '.safe-left': {
          paddingLeft: 'env(safe-area-inset-left)',
        },
        '.safe-right': {
          paddingRight: 'env(safe-area-inset-right)',
        },
        '.safe-x': {
          paddingLeft: 'env(safe-area-inset-left)',
          paddingRight: 'env(safe-area-inset-right)',
        },
        '.safe-y': {
          paddingTop: 'env(safe-area-inset-top)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        },
        '.safe-all': {
          padding: 'env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)',
        },
        // Touch behavior utilities
        '.touch-manipulation': {
          touchAction: 'manipulation',
        },
        '.touch-pan-x': {
          touchAction: 'pan-x',
        },
        '.touch-pan-y': {
          touchAction: 'pan-y',
        },
        '.touch-none': {
          touchAction: 'none',
        },
        // Scroll behavior utilities
        '.overscroll-contain': {
          overscrollBehavior: 'contain',
        },
        '.overscroll-none': {
          overscrollBehavior: 'none',
        },
        '.overscroll-auto': {
          overscrollBehavior: 'auto',
        },
        // Mobile scrolling
        '.scroll-smooth-mobile': {
          '-webkit-overflow-scrolling': 'touch',
          scrollBehavior: 'smooth',
        },
        // Text selection utilities
        '.select-none-touch': {
          '-webkit-user-select': 'none',
          '-webkit-touch-callout': 'none',
        },
        // Tap highlight utilities
        '.tap-highlight-none': {
          '-webkit-tap-highlight-color': 'transparent',
        },
        // Font smoothing for mobile
        '.font-smooth-mobile': {
          '-webkit-font-smoothing': 'antialiased',
          '-moz-osx-font-smoothing': 'grayscale',
        },
      };

      addUtilities(newUtilities, ['responsive']);
    },
  ],
}
