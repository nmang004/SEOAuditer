'use client';

import { Suspense } from 'react';
import { AnalysisContent } from './analysis-content';
import { AnimateFadeIn, AnimateStagger, AnimateStaggerItem } from '@/components/animations';
import { Skeleton } from '@/components/ui/skeleton';
import { Breadcrumb } from '@/components/navigation/breadcrumb';
import { MobileNavigation } from '@/components/navigation/mobile-navigation';
import { analysisNavItems } from '@/components/navigation/nav-items';

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-32" />
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Skeleton className="h-96 rounded-xl" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    </div>
  );
}

export default function AnalysisPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <Breadcrumb />
        <MobileNavigation navItems={analysisNavItems} />
      </div>
      <AnimateStagger className="space-y-8">
        <AnimateStaggerItem>
          <AnimateFadeIn>
            <Suspense fallback={<LoadingSkeleton />}>
              <AnalysisContent />
            </Suspense>
          </AnimateFadeIn>
        </AnimateStaggerItem>
      </AnimateStagger>
    </div>
  );
}
