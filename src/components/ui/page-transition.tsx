'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useMotionPreferences, motionVariants } from '@/lib/motion-preferences';
import { ReactNode } from 'react';

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
  variant?: 'fade' | 'slide' | 'scale';
}

export function PageTransition({ 
  children, 
  className = '',
  variant = 'fade'
}: PageTransitionProps) {
  const { prefersReducedMotion } = useMotionPreferences();

  const variants = {
    fade: motionVariants.pageTransition,
    slide: {
      initial: (isReduced: boolean) => ({
        opacity: isReduced ? 1 : 0,
        x: isReduced ? 0 : 20,
      }),
      animate: {
        opacity: 1,
        x: 0,
        transition: {
          duration: prefersReducedMotion ? 0.01 : 0.4,
          ease: 'easeOut',
        },
      },
      exit: (isReduced: boolean) => ({
        opacity: isReduced ? 1 : 0,
        x: isReduced ? 0 : -20,
        transition: {
          duration: prefersReducedMotion ? 0.01 : 0.3,
          ease: 'easeOut',
        },
      }),
    },
    scale: {
      initial: (isReduced: boolean) => ({
        opacity: isReduced ? 1 : 0,
        scale: isReduced ? 1 : 0.9,
      }),
      animate: {
        opacity: 1,
        scale: 1,
        transition: {
          duration: prefersReducedMotion ? 0.01 : 0.4,
          ease: 'easeOut',
        },
      },
      exit: (isReduced: boolean) => ({
        opacity: isReduced ? 1 : 0,
        scale: isReduced ? 1 : 1.1,
        transition: {
          duration: prefersReducedMotion ? 0.01 : 0.3,
          ease: 'easeOut',
        },
      }),
    },
  };

  return (
    <motion.div
      variants={variants[variant]}
      initial="initial"
      animate="animate"
      exit="exit"
      custom={prefersReducedMotion}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface PageTransitionWrapperProps {
  children: ReactNode;
  pageKey: string;
  className?: string;
  variant?: 'fade' | 'slide' | 'scale';
}

export function PageTransitionWrapper({
  children,
  pageKey,
  className = '',
  variant = 'fade'
}: PageTransitionWrapperProps) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <PageTransition key={pageKey} className={className} variant={variant}>
        {children}
      </PageTransition>
    </AnimatePresence>
  );
} 