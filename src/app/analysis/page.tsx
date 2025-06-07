'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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

export default function CrawlSubmissionPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/dashboard/projects');
  }, [router]);
  return null;
}
