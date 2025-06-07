'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function AnalysisPage() {
  const router = useRouter();
  const params = useParams();

  useEffect(() => {
    if (params.analysisId) {
      router.replace(`/analyses/${params.analysisId}/overview`);
    }
  }, [params.analysisId, router]);

  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
        <p className="text-muted-foreground">Loading analysis...</p>
      </div>
    </div>
  );
} 