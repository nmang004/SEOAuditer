'use client';

import React, { forwardRef } from 'react';
import { motion, MotionProps } from 'framer-motion';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motionVariants, useMotionPreferences } from '@/lib/motion-preferences';
import { aria, ariaLabels } from '@/lib/accessibility-utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground shadow hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90',
        outline: 'border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
        success: 'bg-green-600 text-white shadow hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800',
        warning: 'bg-yellow-600 text-white shadow hover:bg-yellow-700 dark:bg-yellow-700 dark:hover:bg-yellow-800',
        info: 'bg-blue-600 text-white shadow hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800',
        gradient: 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg hover:from-blue-700 hover:to-purple-700',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-10 rounded-md px-8',
        xl: 'h-12 rounded-lg px-10 text-base',
        icon: 'h-9 w-9',
        'icon-sm': 'h-8 w-8',
        'icon-lg': 'h-10 w-10',
        'icon-xl': 'h-12 w-12',
      },
      fullWidth: {
        true: 'w-full',
        false: '',
      },
      elevation: {
        none: 'shadow-none',
        sm: 'shadow-sm',
        md: 'shadow-md',
        lg: 'shadow-lg',
        xl: 'shadow-xl',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      fullWidth: false,
      elevation: 'sm',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  loadingText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  animation?: 'none' | 'scale' | 'bounce' | 'pulse';
  motionProps?: Omit<MotionProps, 'children'>;
  tooltip?: string;
}

const EnhancedButton = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      fullWidth,
      elevation,
      asChild = false,
      loading = false,
      loadingText,
      leftIcon,
      rightIcon,
      animation = 'scale',
      motionProps,
      tooltip,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const Comp: any = asChild ? Slot : motion.button;
    const { prefersReducedMotion } = useMotionPreferences();
    
    const isDisabled = disabled || loading;
    const buttonId = props.id || aria.generateId('button');

    // Animation variants based on type
    const getAnimationProps = () => {
      if (animation === 'none' || prefersReducedMotion) {
        return {};
      }

      const baseProps = {
        whileHover: motionVariants.button.whileHover(prefersReducedMotion),
        whileTap: motionVariants.button.whileTap(prefersReducedMotion),
      };

      switch (animation) {
        case 'bounce':
          return {
            ...baseProps,
            whileTap: { scale: 0.95, y: 2 },
            transition: { type: 'spring', stiffness: 400, damping: 17 },
          };
        case 'pulse':
          return {
            ...baseProps,
            animate: {
              scale: [1, 1.05, 1],
              transition: {
                duration: 2,
                repeat: Infinity,
                repeatType: 'reverse' as const,
              },
            },
          };
        default:
          return baseProps;
      }
    };

    const animationProps = getAnimationProps();
    const mergedMotionProps = { ...animationProps, ...motionProps };

    // Filter out conflicting event handlers and style for HTML elements
    const { onAnimationStart, onAnimationEnd, onDrag, onDragStart, onDragEnd, style, ...cleanProps } = props;
    
    // When using Slot, don't apply any motion props
    if (asChild) {
      return (
        <Comp
          className={cn(buttonVariants({ variant, size, fullWidth, elevation, className }))}
          ref={ref}
          disabled={isDisabled}
          aria-disabled={isDisabled}
          aria-describedby={tooltip ? `${buttonId}-tooltip` : undefined}
          id={buttonId}
          {...cleanProps}
          style={typeof style === 'object' && !Array.isArray(style) && style ? style : undefined}
        >
          {loading && (
            <Loader2 
              className="h-4 w-4 animate-spin" 
              aria-hidden="true"
            />
          )}
          {leftIcon && !loading && (
            <span className="h-4 w-4" aria-hidden="true">{leftIcon}</span>
          )}
          {children}
          {rightIcon && !loading && (
            <span className="h-4 w-4" aria-hidden="true">{rightIcon}</span>
          )}
          {tooltip && (
            <span className="sr-only" id={`${buttonId}-tooltip`}>
              {tooltip}
            </span>
          )}
        </Comp>
      );
    }
    
    // The mergedMotionProps are already safe since they come from our animation system
    
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, fullWidth, elevation, className }))}
        ref={ref}
        disabled={isDisabled}
        aria-disabled={isDisabled}
        aria-describedby={tooltip ? `${buttonId}-tooltip` : undefined}
        id={buttonId}
        {...mergedMotionProps}
        {...cleanProps}
        style={style}
      >
        {loading && (
          <Loader2 
            className="h-4 w-4 animate-spin" 
            aria-hidden="true"
          />
        )}
        
        {!loading && leftIcon && (
          <span className="inline-flex shrink-0" aria-hidden="true">
            {leftIcon}
          </span>
        )}
        
        <span className={cn(loading && loadingText && 'sr-only')}>
          {children}
        </span>
        
        {loading && loadingText && (
          <span>{loadingText}</span>
        )}
        
        {!loading && rightIcon && (
          <span className="inline-flex shrink-0" aria-hidden="true">
            {rightIcon}
          </span>
        )}

        {tooltip && (
          <span
            id={`${buttonId}-tooltip`}
            className="sr-only"
            role="tooltip"
          >
            {tooltip}
          </span>
        )}
      </Comp>
    );
  }
);

EnhancedButton.displayName = 'EnhancedButton';

// Button Group Component
export interface ButtonGroupProps {
  children: React.ReactNode;
  orientation?: 'horizontal' | 'vertical';
  spacing?: 'none' | 'sm' | 'md' | 'lg';
  className?: string;
  connected?: boolean;
}

export function ButtonGroup({
  children,
  orientation = 'horizontal',
  spacing = 'sm',
  className,
  connected = false,
}: ButtonGroupProps) {
  const spacingClasses = {
    none: '',
    sm: orientation === 'horizontal' ? 'space-x-2' : 'space-y-2',
    md: orientation === 'horizontal' ? 'space-x-4' : 'space-y-4',
    lg: orientation === 'horizontal' ? 'space-x-6' : 'space-y-6',
  };

  const connectedClasses = connected
    ? orientation === 'horizontal'
      ? '[&>*:not(:first-child)]:rounded-l-none [&>*:not(:last-child)]:rounded-r-none [&>*:not(:first-child)]:border-l-0'
      : '[&>*:not(:first-child)]:rounded-t-none [&>*:not(:last-child)]:rounded-b-none [&>*:not(:first-child)]:border-t-0'
    : '';

  return (
    <div
      className={cn(
        'inline-flex',
        orientation === 'horizontal' ? 'flex-row items-center' : 'flex-col items-stretch',
        !connected && spacingClasses[spacing],
        connectedClasses,
        className
      )}
      role="group"
      aria-orientation={orientation}
    >
      {children}
    </div>
  );
}

// Icon Button Component
export interface IconButtonProps extends Omit<ButtonProps, 'leftIcon' | 'rightIcon' | 'children'> {
  icon: React.ReactNode;
  'aria-label': string;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, size = 'icon', ...props }, ref) => {
    return (
      <EnhancedButton ref={ref} size={size} {...props}>
        {icon}
      </EnhancedButton>
    );
  }
);

IconButton.displayName = 'IconButton';

// Split Button Component
export interface SplitButtonProps extends Omit<ButtonProps, 'rightIcon'> {
  onDropdownClick?: () => void;
  dropdownIcon?: React.ReactNode;
  dropdownProps?: Partial<ButtonProps>;
}

export const SplitButton = forwardRef<HTMLButtonElement, SplitButtonProps>(
  ({ onDropdownClick, dropdownIcon, dropdownProps, className, ...props }, ref) => {
    return (
      <ButtonGroup connected className={className}>
        <EnhancedButton ref={ref} {...props} />
        <EnhancedButton
          variant={props.variant}
          size={props.size}
          onClick={onDropdownClick}
          aria-label="More options"
          {...dropdownProps}
        >
          {dropdownIcon || '▼'}
        </EnhancedButton>
      </ButtonGroup>
    );
  }
);

SplitButton.displayName = 'SplitButton';

// Floating Action Button Component
export interface FABProps extends Omit<ButtonProps, 'size'> {
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  size?: 'sm' | 'md' | 'lg';
  extended?: boolean;
}

export function FloatingActionButton({
  position = 'bottom-right',
  size = 'md',
  extended = false,
  className,
  children,
  ...props
}: FABProps) {
  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'top-right': 'top-6 right-6',
    'top-left': 'top-6 left-6',
  };

  const sizeClasses = {
    sm: extended ? 'h-12 px-4' : 'h-12 w-12',
    md: extended ? 'h-14 px-6' : 'h-14 w-14',
    lg: extended ? 'h-16 px-8' : 'h-16 w-16',
  };

  return (
    <motion.div
      className={cn(
        'fixed z-50',
        positionClasses[position]
      )}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <EnhancedButton
        className={cn(
          'rounded-full shadow-lg',
          sizeClasses[size],
          className
        )}
        variant="default"
        elevation="lg"
        {...props}
      >
        {children}
      </EnhancedButton>
    </motion.div>
  );
}

export { EnhancedButton as Button, buttonVariants }; 