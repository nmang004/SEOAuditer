'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { motionPreferences, screenReader } from '@/lib/accessibility-utils';

export type TransitionVariant = 
  | 'fade'
  | 'slide-up'
  | 'slide-down'
  | 'slide-left'
  | 'slide-right'
  | 'scale'
  | 'rotate-scale'
  | 'blur'
  | 'elastic';

export interface PageTransitionProps {
  children: React.ReactNode;
  variant?: TransitionVariant;
  duration?: number;
  delay?: number;
  className?: string;
  exitBeforeEnter?: boolean;
  preserveScroll?: boolean;
  announcePageChange?: boolean;
  customVariants?: Variants;
}

const defaultDuration = 0.3;
const defaultDelay = 0;

// Animation variants
const transitionVariants: Record<TransitionVariant, Variants> = {
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  'slide-up': {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  },
  'slide-down': {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 },
  },
  'slide-left': {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  },
  'slide-right': {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
  },
  scale: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 1.05 },
  },
  'rotate-scale': {
    initial: { opacity: 0, scale: 0.8, rotate: -10 },
    animate: { opacity: 1, scale: 1, rotate: 0 },
    exit: { opacity: 0, scale: 0.8, rotate: 10 },
  },
  blur: {
    initial: { opacity: 0, filter: 'blur(10px)' },
    animate: { opacity: 1, filter: 'blur(0px)' },
    exit: { opacity: 0, filter: 'blur(10px)' },
  },
  elastic: {
    initial: { opacity: 0, scale: 0.8 },
    animate: { 
      opacity: 1, 
      scale: 1,
      transition: {
        type: 'spring',
        stiffness: 400,
        damping: 20,
      },
    },
    exit: { opacity: 0, scale: 0.8 },
  },
};

// Page transition wrapper component
export function PageTransition({
  children,
  variant = 'fade',
  duration = defaultDuration,
  delay = defaultDelay,
  className,
  exitBeforeEnter = true,
  preserveScroll = false,
  announcePageChange = true,
  customVariants,
}: PageTransitionProps) {
  const pathname = usePathname();
  const [isAnimating, setIsAnimating] = useState(false);
  const reducedMotion = motionPreferences.prefersReducedMotion();

  // Use custom variants if provided, otherwise use preset
  const variants = customVariants || transitionVariants[variant];

  // Adjust timing for reduced motion
  const animationDuration = reducedMotion ? 0.01 : duration;
  const animationDelay = reducedMotion ? 0 : delay;

  // Handle page announcements for screen readers
  useEffect(() => {
    if (announcePageChange && !isAnimating) {
      // Extract page title or use pathname
      const pageTitle = document.title || pathname;
      screenReader.announce(`Navigated to ${pageTitle}`, 'polite');
    }
  }, [pathname, announcePageChange, isAnimating]);

  // Scroll to top on page change (unless preserveScroll is true)
  useEffect(() => {
    if (!preserveScroll && !reducedMotion) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (!preserveScroll) {
      window.scrollTo(0, 0);
    }
  }, [pathname, preserveScroll, reducedMotion]);

  return (
    <AnimatePresence 
      mode={exitBeforeEnter ? 'wait' : 'sync'}
      onExitComplete={() => setIsAnimating(false)}
    >
      <motion.div
        key={pathname}
        className={className}
        variants={variants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{
          duration: animationDuration,
          delay: animationDelay,
          ease: 'easeOut',
        }}
        onAnimationStart={() => setIsAnimating(true)}
        onAnimationComplete={() => setIsAnimating(false)}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

// Layout transition for preserving layout during navigation
export function LayoutTransition({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      layout
      className={className}
      transition={{
        duration: motionPreferences.prefersReducedMotion() ? 0 : 0.2,
        ease: 'easeOut',
      }}
    >
      {children}
    </motion.div>
  );
}

// Staggered children animation
export interface StaggeredTransitionProps {
  children: React.ReactNode[];
  staggerDelay?: number;
  variant?: TransitionVariant;
  className?: string;
}

export function StaggeredTransition({
  children,
  staggerDelay = 0.1,
  variant = 'slide-up',
  className,
}: StaggeredTransitionProps) {
  const reducedMotion = motionPreferences.prefersReducedMotion();
  const containerVariants: Variants = {
    animate: {
      transition: {
        staggerChildren: reducedMotion ? 0 : staggerDelay,
      },
    },
  };

  const itemVariants = transitionVariants[variant];

  return (
    <motion.div
      className={className}
      variants={containerVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      {React.Children.map(children, (child, index) => (
        <motion.div key={index} variants={itemVariants}>
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}

// Route transition with loading state
export interface RouteTransitionProps {
  children: React.ReactNode;
  isLoading?: boolean;
  loadingComponent?: React.ReactNode;
  variant?: TransitionVariant;
  className?: string;
}

export function RouteTransition({
  children,
  isLoading = false,
  loadingComponent,
  variant = 'fade',
  className,
}: RouteTransitionProps) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait">
      {isLoading ? (
        <motion.div
          key="loading"
          className={cn('flex items-center justify-center min-h-[200px]', className)}
          variants={transitionVariants.fade}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: motionPreferences.prefersReducedMotion() ? 0 : 0.2 }}
        >
          {loadingComponent || (
            <div className="text-center">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Loading...</p>
            </div>
          )}
        </motion.div>
      ) : (
        <motion.div
          key={pathname}
          className={className}
          variants={transitionVariants[variant]}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{
            duration: motionPreferences.prefersReducedMotion() ? 0 : 0.3,
            ease: 'easeOut',
          }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Modal transition
export interface ModalTransitionProps {
  isOpen: boolean;
  children: React.ReactNode;
  variant?: 'scale' | 'slide-up' | 'fade';
  className?: string;
  overlayClassName?: string;
}

export function ModalTransition({
  isOpen,
  children,
  variant = 'scale',
  className,
  overlayClassName,
}: ModalTransitionProps) {
  const overlayVariants: Variants = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  };

  const modalVariants = transitionVariants[variant];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={cn('fixed inset-0 z-50', overlayClassName)}
          variants={overlayVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: motionPreferences.prefersReducedMotion() ? 0 : 0.2 }}
        >
          <motion.div
            className={className}
            variants={modalVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{
              duration: motionPreferences.prefersReducedMotion() ? 0 : 0.3,
              ease: 'easeOut',
            }}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Notification transition
export interface NotificationTransitionProps {
  notifications: Array<{
    id: string;
    content: React.ReactNode;
  }>;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
  className?: string;
}

export function NotificationTransition({
  notifications,
  position = 'top-right',
  className,
}: NotificationTransitionProps) {
  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
    'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2',
  };

  const containerVariants: Variants = {
    animate: {
      transition: {
        staggerChildren: motionPreferences.prefersReducedMotion() ? 0 : 0.1,
      },
    },
  };

  const notificationVariants: Variants = {
    initial: { 
      opacity: 0, 
      x: position.includes('right') ? 100 : position.includes('left') ? -100 : 0,
      y: position.includes('top') ? -50 : position.includes('bottom') ? 50 : 0,
      scale: 0.9,
    },
    animate: { 
      opacity: 1, 
      x: 0, 
      y: 0, 
      scale: 1,
      transition: {
        type: 'spring',
        stiffness: 400,
        damping: 25,
      },
    },
    exit: { 
      opacity: 0, 
      x: position.includes('right') ? 100 : position.includes('left') ? -100 : 0,
      scale: 0.8,
      transition: {
        duration: motionPreferences.prefersReducedMotion() ? 0 : 0.2,
      },
    },
  };

  return (
    <motion.div
      className={cn(
        'fixed z-50 flex flex-col space-y-2 pointer-events-none',
        positionClasses[position],
        className
      )}
      variants={containerVariants}
      initial="initial"
      animate="animate"
    >
      <AnimatePresence>
        {notifications.map((notification) => (
          <motion.div
            key={notification.id}
            className="pointer-events-auto"
            variants={notificationVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            layout
          >
            {notification.content}
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
}

// Hook for managing page transitions
export function usePageTransition() {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setIsTransitioning(true);
    const timer = setTimeout(() => {
      setIsTransitioning(false);
    }, motionPreferences.prefersReducedMotion() ? 10 : 300);

    return () => clearTimeout(timer);
  }, [pathname]);

  return {
    isTransitioning,
    pathname,
  };
}

// Breadcrumb transition
export function BreadcrumbTransition({
  items,
  separator = '/',
  className,
}: {
  items: Array<{ label: string; href?: string }>;
  separator?: string;
  className?: string;
}) {
  const containerVariants: Variants = {
    animate: {
      transition: {
        staggerChildren: motionPreferences.prefersReducedMotion() ? 0 : 0.05,
      },
    },
  };

  const itemVariants: Variants = {
    initial: { opacity: 0, x: -10 },
    animate: { opacity: 1, x: 0 },
  };

  return (
    <motion.nav
      className={cn('flex items-center space-x-2 text-sm', className)}
      variants={containerVariants}
      initial="initial"
      animate="animate"
      aria-label="Breadcrumb"
    >
      {items.map((item, index) => (
        <React.Fragment key={index}>
          <motion.div variants={itemVariants}>
            {item.href ? (
              <a
                href={item.href}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              >
                {item.label}
              </a>
            ) : (
              <span className="text-gray-900 dark:text-gray-100 font-medium">
                {item.label}
              </span>
            )}
          </motion.div>
          
          {index < items.length - 1 && (
            <motion.span
              className="text-gray-400 dark:text-gray-500"
              variants={itemVariants}
              aria-hidden="true"
            >
              {separator}
            </motion.span>
          )}
        </React.Fragment>
      ))}
    </motion.nav>
  );
}
