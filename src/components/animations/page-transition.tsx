'use client';

import { ReactNode } from 'react';
import { m, Variants, useReducedMotion } from 'framer-motion';
import { usePathname } from 'next/navigation';

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

export function PageTransition({ children, className }: PageTransitionProps) {
  const pathname = usePathname();
  const reducedMotion = useReducedMotion();
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const variants: Variants = reducedMotion
    ? { initial: { opacity: 1 }, animate: { opacity: 1 }, exit: { opacity: 1 } }
    : {
        initial: { opacity: 0, y: isMobile ? 10 : 20 },
        animate: { opacity: 1, y: 0, transition: { duration: isMobile ? 0.18 : 0.4, ease: [0.4, 0, 0.2, 1] } },
        exit: { opacity: 0, y: isMobile ? -10 : -20, transition: { duration: isMobile ? 0.12 : 0.2, ease: [0.4, 0, 0.2, 1] } },
      };
  return (
    <m.div
      key={pathname}
      initial="initial"
      animate="animate"
      exit="exit"
      variants={variants}
      className={className}
      style={{ willChange: 'transform, opacity' }}
    >
      {children}
    </m.div>
  );
}

export function PageTransitionWrapper({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
