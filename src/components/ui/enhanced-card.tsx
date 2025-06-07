'use client';

import React, { forwardRef } from 'react';
import { motion, MotionProps } from 'framer-motion';
import { cva, type VariantProps } from 'class-variance-authority';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { motionVariants, useMotionPreferences } from '@/lib/motion-preferences';

const cardVariants = cva(
  'rounded-lg border bg-card text-card-foreground transition-all duration-200',
  {
    variants: {
      variant: {
        default: 'shadow-sm hover:shadow-md',
        elevated: 'shadow-md hover:shadow-lg',
        outlined: 'border-2 shadow-none hover:shadow-sm',
        filled: 'bg-muted border-0 shadow-none hover:shadow-sm',
        glass: 'bg-card/80 backdrop-blur-sm border-white/20 shadow-lg',
        gradient: 'bg-gradient-to-br from-card to-muted border-0 shadow-md',
      },
      size: {
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
        xl: 'p-10',
      },
      interactive: {
        true: 'cursor-pointer transform-gpu hover:scale-[1.02] hover:-translate-y-1',
        false: '',
      },
      padding: {
        none: 'p-0',
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
        xl: 'p-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
      interactive: false,
      padding: 'md',
    },
  }
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  asChild?: boolean;
  motionProps?: Omit<MotionProps, 'children'>;
  hoverable?: boolean;
  pressable?: boolean;
}

const EnhancedCard = forwardRef<HTMLDivElement, CardProps>(
  ({ 
    className, 
    variant, 
    size, 
    interactive, 
    padding,
    asChild = false,
    motionProps,
    hoverable = false,
    pressable = false,
    children,
    ...props 
  }, ref) => {
    const { prefersReducedMotion } = useMotionPreferences();

    const getAnimationProps = () => {
      if (prefersReducedMotion) return {};

      const baseProps: any = {};

      if (hoverable || interactive) {
        baseProps.whileHover = motionVariants.card.whileHover(prefersReducedMotion);
      }

      if (pressable) {
        baseProps.whileTap = { scale: 0.98 };
      }

      return baseProps;
    };

    const animationProps = getAnimationProps();
    const mergedMotionProps = { ...animationProps, ...motionProps };

    return (
      <motion.div
        className={cn(cardVariants({ variant, size, interactive, padding, className }))}
        ref={ref}
        {...mergedMotionProps}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

EnhancedCard.displayName = 'EnhancedCard';

// Card Header Component
const CardHeader = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1.5 p-6', className)}
    {...props}
  />
));
CardHeader.displayName = 'CardHeader';

// Card Title Component
const CardTitle = forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, children, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn('text-2xl font-semibold leading-none tracking-tight', className)}
    {...props}
  >
    {children}
  </h3>
));
CardTitle.displayName = 'CardTitle';

// Card Description Component
const CardDescription = forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
));
CardDescription.displayName = 'CardDescription';

// Card Content Component
const CardContent = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
));
CardContent.displayName = 'CardContent';

// Card Footer Component
const CardFooter = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center p-6 pt-0', className)}
    {...props}
  />
));
CardFooter.displayName = 'CardFooter';

// Specialized Card Components

// Stats Card Component
export interface StatsCardProps extends Omit<CardProps, 'children'> {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
    label?: string;
  };
  loading?: boolean;
}

export function StatsCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  loading = false,
  className,
  ...props
}: StatsCardProps) {
  return (
    <EnhancedCard 
      className={cn('relative overflow-hidden', className)}
      hoverable
      {...props}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {title}
        </CardTitle>
        {icon && (
          <div className="h-4 w-4 text-muted-foreground">
            {icon}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {loading ? (
            <div className="h-8 w-20 bg-muted animate-pulse rounded" />
          ) : (
            value
          )}
        </div>
        {(subtitle || trend) && (
          <div className="flex items-center space-x-2 text-xs text-muted-foreground mt-1">
            {trend && (
              <span className={cn(
                'inline-flex items-center',
                trend.isPositive ? 'text-green-600' : 'text-red-600'
              )}>
                {trend.isPositive ? '↗' : '↘'} {Math.abs(trend.value)}%
              </span>
            )}
            {subtitle && <span>{subtitle}</span>}
            {trend?.label && <span>{trend.label}</span>}
          </div>
        )}
      </CardContent>
    </EnhancedCard>
  );
}

// Feature Card Component
export interface FeatureCardProps extends Omit<CardProps, 'children'> {
  title: string;
  description: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  image?: string;
}

export function FeatureCard({
  title,
  description,
  icon,
  action,
  image,
  className,
  ...props
}: FeatureCardProps) {
  return (
    <EnhancedCard 
      className={cn('h-full', className)}
      hoverable
      interactive={!!action}
      onClick={action?.onClick}
      {...props}
    >
      {image && (
        <div className="aspect-video w-full overflow-hidden rounded-t-lg">
          <Image
            src={image}
            alt=""
            width={400}
            height={225}
            className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
          />
        </div>
      )}
      <CardHeader>
        <div className="flex items-center space-x-2">
          {icon && (
            <div className="flex-shrink-0">
              {icon}
            </div>
          )}
          <CardTitle className="text-lg">{title}</CardTitle>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      {action && (
        <CardFooter>
          <motion.button
            className="text-sm font-medium text-primary hover:underline"
            whileHover={{ x: 4 }}
            whileTap={{ scale: 0.95 }}
          >
            {action.label} →
          </motion.button>
        </CardFooter>
      )}
    </EnhancedCard>
  );
}

// Product Card Component
export interface ProductCardProps extends Omit<CardProps, 'children'> {
  title: string;
  description?: string;
  price?: string;
  image?: string;
  badge?: string;
  onAddToCart?: () => void;
  onViewDetails?: () => void;
}

export function ProductCard({
  title,
  description,
  price,
  image,
  badge,
  onAddToCart,
  onViewDetails,
  className,
  ...props
}: ProductCardProps) {
  return (
    <EnhancedCard 
      className={cn('h-full overflow-hidden', className)}
      hoverable
      {...props}
    >
      {image && (
        <div className="relative aspect-square w-full overflow-hidden">
          <Image
            src={image}
            alt={title}
            width={300}
            height={300}
            className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
          />
          {badge && (
            <div className="absolute top-2 left-2">
              <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                {badge}
              </span>
            </div>
          )}
        </div>
      )}
      <CardHeader>
        <CardTitle className="text-lg line-clamp-2">{title}</CardTitle>
        {description && (
          <CardDescription className="line-clamp-3">{description}</CardDescription>
        )}
      </CardHeader>
      <CardFooter className="flex-col space-y-2">
        {price && (
          <div className="w-full text-left">
            <span className="text-2xl font-bold">{price}</span>
          </div>
        )}
        <div className="flex w-full space-x-2">
          {onViewDetails && (
            <motion.button
              className="flex-1 px-4 py-2 border border-input bg-background hover:bg-accent rounded-md text-sm transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onViewDetails}
            >
              View Details
            </motion.button>
          )}
          {onAddToCart && (
            <motion.button
              className="flex-1 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md text-sm transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onAddToCart}
            >
              Add to Cart
            </motion.button>
          )}
        </div>
      </CardFooter>
    </EnhancedCard>
  );
}

export {
  EnhancedCard as Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
  cardVariants,
}; 