'use client';

import { ReactNode } from 'react';
import { AnimatePresence, m } from 'framer-motion';
import { fadeIn } from '@/lib/animations';

interface AnimatePresenceWrapperProps {
  children: ReactNode;
  mode?: 'wait' | 'sync' | 'popLayout';
  initial?: boolean;
  onExitComplete?: () => void;
}

export function AnimatePresenceWrapper({
  children,
  mode = 'wait',
  initial = true,
  onExitComplete,
}: AnimatePresenceWrapperProps) {
  return (
    <AnimatePresence
      mode={mode}
      initial={initial}
      onExitComplete={onExitComplete}
    >
      {children}
    </AnimatePresence>
  );
}

interface AnimateFadeInProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
}

export function AnimateFadeIn({
  children,
  delay = 0,
  duration = 0.5,
  className = '',
}: AnimateFadeInProps) {
  return (
    <m.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            delay,
            duration,
            ease: 'easeInOut',
          },
        },
      }}
      className={className}
    >
      {children}
    </m.div>
  );
}

interface AnimateStaggerProps {
  children: ReactNode;
  staggerChildren?: number;
  delayChildren?: number;
  className?: string;
}

export function AnimateStagger({
  children,
  staggerChildren = 0.1,
  delayChildren = 0,
  className = '',
}: AnimateStaggerProps) {
  return (
    <m.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren,
            delayChildren,
          },
        },
      }}
      className={className}
    >
      {children}
    </m.div>
  );
}

interface AnimateStaggerItemProps {
  children: ReactNode;
  delay?: number;
  className?: string;
}

export function AnimateStaggerItem({
  children,
  delay = 0,
  className = '',
}: AnimateStaggerItemProps) {
  return (
    <m.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: {
          opacity: 1,
          y: 0,
          transition: {
            duration: 0.5,
            ease: 'easeOut',
            delay,
          },
        },
      }}
      className={className}
    >
      {children}
    </m.div>
  );
}
