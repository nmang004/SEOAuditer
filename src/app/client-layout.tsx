'use client';

import { useEffect, useState } from 'react';
import { Providers } from '@/components/providers';
import { PageTransition } from '@/components/animations/page-transition';
import { Header } from '@/components/layout/header';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);

  // This effect runs only on the client side
  useEffect(() => {
    setMounted(true);
    
    // Clean up any attributes added by browser extensions
    const cleanupAttributes = () => {
      const body = document.body;
      if (body) {
        body.removeAttribute('data-new-gr-c-s-check-loaded');
        body.removeAttribute('data-gr-ext-installed');
      }
    };

    // Run cleanup on mount and after a short delay to catch any late-added attributes
    cleanupAttributes();
    const timer = setTimeout(cleanupAttributes, 100);
    
    return () => clearTimeout(timer);
  }, []);

  // Don't render anything until we're on the client
  if (!mounted) {
    return null;
  }

  return (
    <Providers>
      <Header />
      <PageTransition>
        {children}
      </PageTransition>
    </Providers>
  );
}
