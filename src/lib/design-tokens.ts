// Design Tokens for Rival Outranker
// This file provides a comprehensive design system with semantic tokens

export const designTokens = {
  // Color System with Semantic Meanings
  colors: {
    // Brand Colors
    brand: {
      primary: 'hsl(203, 89%, 53%)', // #0ea5e9
      secondary: 'hsl(200, 100%, 50%)', // #0099ff
      accent: 'hsl(280, 100%, 70%)', // #b366ff
    },

    // Semantic Colors
    semantic: {
      success: {
        light: 'hsl(142, 69%, 58%)', // Good SEO scores
        DEFAULT: 'hsl(142, 71%, 45%)', // #10b981
        dark: 'hsl(142, 76%, 36%)',
        subtle: 'hsl(143, 85%, 96%)',
      },
      warning: {
        light: 'hsl(43, 96%, 56%)', // Needs improvement
        DEFAULT: 'hsl(38, 92%, 50%)', // #f59e0b
        dark: 'hsl(32, 95%, 44%)',
        subtle: 'hsl(48, 100%, 96%)',
      },
      error: {
        light: 'hsl(0, 84%, 60%)', // Critical issues
        DEFAULT: 'hsl(0, 84%, 55%)', // #ef4444
        dark: 'hsl(0, 93%, 41%)',
        subtle: 'hsl(0, 93%, 97%)',
      },
      info: {
        light: 'hsl(203, 89%, 60%)',
        DEFAULT: 'hsl(203, 89%, 53%)', // #0ea5e9
        dark: 'hsl(201, 96%, 32%)',
        subtle: 'hsl(204, 100%, 97%)',
      },
    },

    // Neutral Colors
    neutral: {
      0: 'hsl(0, 0%, 100%)', // Pure white
      50: 'hsl(210, 40%, 98%)', // #f9fafb
      100: 'hsl(210, 40%, 96%)', // #f3f4f6
      200: 'hsl(214, 32%, 91%)', // #e5e7eb
      300: 'hsl(213, 27%, 84%)', // #d1d5db
      400: 'hsl(218, 11%, 65%)', // #9ca3af
      500: 'hsl(220, 9%, 46%)', // #6b7280
      600: 'hsl(215, 14%, 34%)', // #4b5563
      700: 'hsl(217, 19%, 27%)', // #374151
      800: 'hsl(215, 28%, 17%)', // #1f2937
      900: 'hsl(221, 39%, 11%)', // #111827
      950: 'hsl(222, 47%, 7%)', // #0a0b0f
    },

    // Interactive States
    interactive: {
      hover: 'hsl(203, 89%, 60%)',
      active: 'hsl(203, 89%, 45%)',
      focus: 'hsl(203, 89%, 53%)',
      disabled: 'hsl(214, 32%, 91%)',
    },
  },

  // Typography Scale
  typography: {
    fontFamily: {
      sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      mono: ['JetBrains Mono', 'Monaco', 'Consolas', 'monospace'],
    },
    fontSize: {
      xs: ['0.75rem', { lineHeight: '1rem', letterSpacing: '0.025em' }], // 12px
      sm: ['0.875rem', { lineHeight: '1.25rem', letterSpacing: '0.025em' }], // 14px
      base: ['1rem', { lineHeight: '1.5rem', letterSpacing: '0' }], // 16px
      lg: ['1.125rem', { lineHeight: '1.75rem', letterSpacing: '-0.025em' }], // 18px
      xl: ['1.25rem', { lineHeight: '1.75rem', letterSpacing: '-0.025em' }], // 20px
      '2xl': ['1.5rem', { lineHeight: '2rem', letterSpacing: '-0.025em' }], // 24px
      '3xl': ['1.875rem', { lineHeight: '2.25rem', letterSpacing: '-0.025em' }], // 30px
      '4xl': ['2.25rem', { lineHeight: '2.5rem', letterSpacing: '-0.025em' }], // 36px
      '5xl': ['3rem', { lineHeight: '1.16667', letterSpacing: '-0.025em' }], // 48px
      '6xl': ['3.75rem', { lineHeight: '1.16667', letterSpacing: '-0.025em' }], // 60px
    },
    fontWeight: {
      light: '300',
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800',
    },
  },

  // Spacing System
  spacing: {
    0: '0px',
    px: '1px',
    0.5: '0.125rem', // 2px
    1: '0.25rem', // 4px
    1.5: '0.375rem', // 6px
    2: '0.5rem', // 8px
    2.5: '0.625rem', // 10px
    3: '0.75rem', // 12px
    3.5: '0.875rem', // 14px
    4: '1rem', // 16px
    5: '1.25rem', // 20px
    6: '1.5rem', // 24px
    7: '1.75rem', // 28px
    8: '2rem', // 32px
    9: '2.25rem', // 36px
    10: '2.5rem', // 40px
    11: '2.75rem', // 44px
    12: '3rem', // 48px
    14: '3.5rem', // 56px
    16: '4rem', // 64px
    20: '5rem', // 80px
    24: '6rem', // 96px
    28: '7rem', // 112px
    32: '8rem', // 128px
    36: '9rem', // 144px
    40: '10rem', // 160px
    44: '11rem', // 176px
    48: '12rem', // 192px
    52: '13rem', // 208px
    56: '14rem', // 224px
    60: '15rem', // 240px
    64: '16rem', // 256px
    72: '18rem', // 288px
    80: '20rem', // 320px
    96: '24rem', // 384px
  },

  // Border Radius
  borderRadius: {
    none: '0px',
    sm: '0.125rem', // 2px
    DEFAULT: '0.25rem', // 4px
    md: '0.375rem', // 6px
    lg: '0.5rem', // 8px
    xl: '0.75rem', // 12px
    '2xl': '1rem', // 16px
    '3xl': '1.5rem', // 24px
    full: '9999px',
  },

  // Shadow System
  shadows: {
    xs: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    sm: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    DEFAULT: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    md: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    lg: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    xl: '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  },

  // Transition/Animation
  animation: {
    duration: {
      fast: '150ms',
      normal: '250ms',
      slow: '350ms',
      slower: '500ms',
    },
    easing: {
      ease: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
      easeIn: 'cubic-bezier(0.42, 0, 1, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.58, 1)',
      easeInOut: 'cubic-bezier(0.42, 0, 0.58, 1)',
      spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    },
  },

  // Breakpoints
  breakpoints: {
    xs: '375px',
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },

  // Z-Index Scale
  zIndex: {
    auto: 'auto',
    0: '0',
    10: '10',
    20: '20',
    30: '30',
    40: '40',
    50: '50',
    dropdown: '1000',
    sticky: '1020',
    fixed: '1030',
    modalBackdrop: '1040',
    offcanvas: '1050',
    modal: '1060',
    popover: '1070',
    tooltip: '1080',
    toast: '1090',
    commandPalette: '1100',
  },
} as const;

// Accessibility Configuration
export const a11y = {
  // Focus ring configuration
  focusRing: {
    width: '2px',
    style: 'solid',
    color: 'hsl(203, 89%, 53%)',
    offset: '2px',
  },

  // Minimum touch target size (WCAG 2.1 Level AAA)
  minTouchTarget: {
    width: '44px',
    height: '44px',
  },

  // Color contrast ratios (WCAG 2.1 Level AA)
  contrast: {
    normalText: 4.5, // AA
    largeText: 3, // AA
    graphicsAndUI: 3, // AA
  },

  // Animation preferences
  reducedMotion: {
    // Respect user's preference for reduced motion
    duration: '0.01ms',
    easing: 'linear',
  },

  // Screen reader only text
  srOnly: {
    position: 'absolute',
    width: '1px',
    height: '1px',
    padding: '0',
    margin: '-1px',
    overflow: 'hidden',
    clip: 'rect(0, 0, 0, 0)',
    whiteSpace: 'nowrap',
    border: '0',
  },
} as const;

// Component Variants
export const componentVariants = {
  button: {
    size: {
      xs: { padding: '0.25rem 0.5rem', fontSize: '0.75rem' },
      sm: { padding: '0.375rem 0.75rem', fontSize: '0.875rem' },
      md: { padding: '0.5rem 1rem', fontSize: '1rem' },
      lg: { padding: '0.75rem 1.5rem', fontSize: '1.125rem' },
      xl: { padding: '1rem 2rem', fontSize: '1.25rem' },
    },
    intent: {
      primary: { backgroundColor: designTokens.colors.brand.primary },
      secondary: { backgroundColor: designTokens.colors.neutral[200] },
      success: { backgroundColor: designTokens.colors.semantic.success.DEFAULT },
      warning: { backgroundColor: designTokens.colors.semantic.warning.DEFAULT },
      error: { backgroundColor: designTokens.colors.semantic.error.DEFAULT },
      ghost: { backgroundColor: 'transparent' },
    },
  },
  
  card: {
    elevation: {
      none: { boxShadow: 'none' },
      sm: { boxShadow: designTokens.shadows.sm },
      md: { boxShadow: designTokens.shadows.DEFAULT },
      lg: { boxShadow: designTokens.shadows.lg },
      xl: { boxShadow: designTokens.shadows.xl },
    },
    padding: {
      none: { padding: '0' },
      sm: { padding: designTokens.spacing[3] },
      md: { padding: designTokens.spacing[4] },
      lg: { padding: designTokens.spacing[6] },
      xl: { padding: designTokens.spacing[8] },
    },
  },
} as const;

// Export utility function for accessing design tokens
export function getToken(path: string): any {
  return path.split('.').reduce((obj, key) => obj?.[key as keyof typeof obj], designTokens as any);
}

// Export CSS custom properties generator
export function generateCSSCustomProperties() {
  const flatten = (obj: any, prefix = '--'): Record<string, string> => {
    let result: Record<string, string> = {};
    
    for (const [key, value] of Object.entries(obj)) {
      const newKey = `${prefix}${key}`;
      
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        result = { ...result, ...flatten(value, `${newKey}-`) };
      } else {
        result[newKey] = String(value);
      }
    }
    
    return result;
  };

  return flatten(designTokens);
} 