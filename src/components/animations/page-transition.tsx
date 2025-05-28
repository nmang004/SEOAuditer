'use client';

import { ReactNode } from 'react';
import { m, Variants } from 'framer-motion';
import { usePathname } from 'next/navigation';

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

const pageTransitionVariants: Variants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.4, 0, 0.2, 1],
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.2,
      ease: [0.4, 0, 0.2, 1],
    },
  },
};

export function PageTransition({ children, className }: PageTransitionProps) {
  const pathname = usePathname();

  return (
    <m.div
      key={pathname}
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageTransitionVariants}
      className={className}
    >
      {children}
    </m.div>
  );
}

export function PageTransitionWrapper({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
