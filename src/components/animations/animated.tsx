"use client";

import { forwardRef, ReactNode, useState, useEffect } from 'react';
import { m, MotionProps, useReducedMotion, Variants  } from 'framer-motion';
import { cn } from '@/lib/utils';
import { fadeIn, slideUp, scaleIn } from '@/lib/animations/animations';

// Define AnimatedProps interface
export interface AnimatedProps extends Omit<MotionProps, 'ref'> {
  children: ReactNode;
  type?: 'fade' | 'slide' | 'scale' | 'none';
  delay?: number;
  duration?: number;
  className?: string;
  disabled?: boolean;
  viewport?: {
    once?: boolean;
    margin?: string;
    amount?: 'some' | 'all' | number;
  };
}

export const Animated = forwardRef<HTMLDivElement, AnimatedProps>(
  ({
    children,
    type = 'fade',
    delay = 0,
    duration,
    className,
    disabled = false,
    viewport = { once: true, margin: '0px' },
    ...props
  }, ref) => {
    const reducedMotion = useReducedMotion();
    const [isInView, setIsInView] = useState(disabled || reducedMotion);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
      setIsMobile(window.innerWidth < 768);
    }, []);

    // Animation variant selection
    let variants: Variants;
    switch (type) {
      case 'slide':
        variants = slideUp;
        break;
      case 'scale':
        variants = scaleIn;
        break;
      case 'none':
        variants = { hidden: {}, visible: {} };
        break;
      case 'fade':
      default:
        variants = fadeIn;
        break;
    }

    if (disabled || reducedMotion) {
      return (
        <m.div
          ref={ref}
          className={cn(className)}
          style={{ willChange: 'auto' }}
          {...props}
        >
          {children}
        </m.div>
      );
    }

    return (
      <m.div
        ref={ref}
        initial="hidden"
        animate={isInView ? 'visible' : 'hidden'}
        variants={variants}
        className={cn(className)}
        style={{ willChange: 'transform, opacity' }}
        viewport={{
          ...viewport,
          margin: viewport?.margin,
          amount: viewport?.amount,
        }}
        onViewportEnter={() => setIsInView(true)}
        onViewportLeave={() => !viewport?.once && setIsInView(false)}
        transition={{ duration: isMobile ? 0.18 : 0.3 }}
        {...props}
      >
        {children}
      </m.div>
    );
  }
);

Animated.displayName = 'Animated'; 