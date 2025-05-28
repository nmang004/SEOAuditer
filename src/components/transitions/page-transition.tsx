'use client';

import { ReactNode, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { AnimatePresence, m } from 'framer-motion';
import { fadeIn, pageTransitions } from '@/lib/animations';

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

export function PageTransition({ children, className = '' }: PageTransitionProps) {
  const pathname = usePathname();

  // Reset scroll position on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <AnimatePresence mode="wait" initial={false}>
      <m.div
        key={pathname}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={pageTransitions}
        className={className}
      >
        {children}
      </m.div>
    </AnimatePresence>
  );
}
