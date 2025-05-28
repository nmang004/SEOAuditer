'use client';

import { Suspense, type ReactNode } from 'react';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import type { DashboardLayoutProps } from '@/components/layout/dashboard-layout';

// Lazy load the dashboard layout with proper typing
const DashboardLayout = dynamic<DashboardLayoutProps>(
  () => import('@/components/layout/dashboard-layout'),
  {
    loading: () => (
      <div className="flex h-screen w-full">
        <Skeleton className="h-full w-64" />
        <div className="flex-1 p-8">
          <Skeleton className="mb-8 h-16 w-full" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </div>
      </div>
    ),
    ssr: false,
  }
);

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen w-full items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      }
    >
      <DashboardLayout>{children}</DashboardLayout>
    </Suspense>
  );
}
