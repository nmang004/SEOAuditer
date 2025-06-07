"use client";

import { useState } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { CheckCircle2, AlertCircle, Info, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { TechnicalAnalysisData } from '@/lib/analysis-types';
import { cn } from '@/lib/utils';

function getStatusIcon(status: boolean) {
  return status ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />;
}

function getTrafficLightColor(score: number) {
  if (score >= 80) return 'bg-green-500';
  if (score >= 60) return 'bg-yellow-500';
  if (score >= 30) return 'bg-orange-500';
  return 'bg-red-500';
}

export function TechnicalAnalysis({
  technicalAnalysis,
  previousAnalysis
}: {
  technicalAnalysis: TechnicalAnalysisData;
  previousAnalysis?: TechnicalAnalysisData;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);

  // Helper for before/after
  const renderBeforeAfter = (label: string, current: any, previous: any) => (
    <div className="flex items-center gap-2 text-xs">
      <span className="font-medium">{label}:</span>
      <span className="font-mono">{String(current)}</span>
      {previous !== undefined && previous !== current && (
        <span className="ml-2 flex items-center gap-1 text-muted-foreground">
          <span>was</span>
          <span className="font-mono line-through">{String(previous)}</span>
        </span>
      )}
    </div>
  );

  return (
    <Card id="technical" className="p-6">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Technical Analysis</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Page Speed */}
        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpanded(expanded === 'pageSpeed' ? null : 'pageSpeed')}>
            <div className="flex items-center gap-2">
              <span className={cn('h-3 w-3 rounded-full', getTrafficLightColor(technicalAnalysis.pageSpeed.score))} />
              <span className="font-medium">Page Speed</span>
            </div>
            <Button size="icon" variant="ghost">
              {expanded === 'pageSpeed' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
          <AnimatePresence>
            {expanded === 'pageSpeed' && (
              <m.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="pt-4 space-y-2">
                <Progress value={technicalAnalysis.pageSpeed.score} className="h-2" />
                {renderBeforeAfter('Score', technicalAnalysis.pageSpeed.score, previousAnalysis?.pageSpeed.score)}
                {renderBeforeAfter('Load Time (s)', technicalAnalysis.pageSpeed.loadTime, previousAnalysis?.pageSpeed.loadTime)}
                {renderBeforeAfter('FCP (s)', technicalAnalysis.pageSpeed.firstContentfulPaint, previousAnalysis?.pageSpeed.firstContentfulPaint)}
                {renderBeforeAfter('LCP (s)', technicalAnalysis.pageSpeed.largestContentfulPaint, previousAnalysis?.pageSpeed.largestContentfulPaint)}
                {renderBeforeAfter('CLS', technicalAnalysis.pageSpeed.cumulativeLayoutShift, previousAnalysis?.pageSpeed.cumulativeLayoutShift)}
                <div className="pt-2">
                  <span className="font-semibold">Recommendations:</span>
                  <ul className="list-disc pl-6">
                    {technicalAnalysis.pageSpeed.recommendations.map((rec, i) => <li key={i}>{rec}</li>)}
                  </ul>
                </div>
              </m.div>
            )}
          </AnimatePresence>
        </div>
        {/* Mobile Friendliness */}
        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpanded(expanded === 'mobile' ? null : 'mobile')}>
            <div className="flex items-center gap-2">
              <span className={cn('h-3 w-3 rounded-full', getTrafficLightColor(technicalAnalysis.mobileFriendliness.score))} />
              <span className="font-medium">Mobile Friendliness</span>
            </div>
            <Button size="icon" variant="ghost">
              {expanded === 'mobile' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
          <AnimatePresence>
            {expanded === 'mobile' && (
              <m.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="pt-4 space-y-2">
                <Progress value={technicalAnalysis.mobileFriendliness.score} className="h-2" />
                {renderBeforeAfter('Score', technicalAnalysis.mobileFriendliness.score, previousAnalysis?.mobileFriendliness.score)}
                <div className="flex gap-4 flex-wrap">
                  <div className="flex items-center gap-1">{getStatusIcon(technicalAnalysis.mobileFriendliness.hasViewportMeta)}<span>Viewport Meta</span></div>
                  <div className="flex items-center gap-1">{getStatusIcon(technicalAnalysis.mobileFriendliness.usesResponsiveDesign)}<span>Responsive</span></div>
                  <div className="flex items-center gap-1">{getStatusIcon(technicalAnalysis.mobileFriendliness.touchTargetsAppropriate)}<span>Touch Targets</span></div>
                </div>
                {technicalAnalysis.mobileFriendliness.issues.length > 0 && (
                  <div className="pt-2">
                    <span className="font-semibold">Issues:</span>
                    <ul className="list-disc pl-6">
                      {technicalAnalysis.mobileFriendliness.issues.map((issue, i) => <li key={i}>{issue}</li>)}
                    </ul>
                  </div>
                )}
              </m.div>
            )}
          </AnimatePresence>
        </div>
        {/* Crawlability */}
        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpanded(expanded === 'crawl' ? null : 'crawl')}>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-blue-500" />
              <span className="font-medium">Crawlability</span>
            </div>
            <Button size="icon" variant="ghost">
              {expanded === 'crawl' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
          <AnimatePresence>
            {expanded === 'crawl' && (
              <m.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="pt-4 space-y-2">
                <div className="flex gap-4 flex-wrap">
                  <div className="flex items-center gap-1">{getStatusIcon(technicalAnalysis.crawlability.robotsTxtValid)}<span>robots.txt</span></div>
                  <div className="flex items-center gap-1">{getStatusIcon(technicalAnalysis.crawlability.hasXMLSitemap)}<span>XML Sitemap</span></div>
                  <div className="flex items-center gap-1">{getStatusIcon(technicalAnalysis.crawlability.canonicalTagsPresent)}<span>Canonical Tags</span></div>
                  <div className="flex items-center gap-1"><Info className="h-4 w-4 text-yellow-500" /><span>NoIndex Pages: {technicalAnalysis.crawlability.noIndexPages}</span></div>
                  <div className="flex items-center gap-1"><Info className="h-4 w-4 text-yellow-500" /><span>Redirect Chains: {technicalAnalysis.crawlability.redirectChains}</span></div>
                </div>
              </m.div>
            )}
          </AnimatePresence>
        </div>
        {/* Security */}
        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpanded(expanded === 'security' ? null : 'security')}>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-purple-500" />
              <span className="font-medium">Security</span>
            </div>
            <Button size="icon" variant="ghost">
              {expanded === 'security' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
          <AnimatePresence>
            {expanded === 'security' && (
              <m.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="pt-4 space-y-2">
                <div className="flex gap-4 flex-wrap">
                  <div className="flex items-center gap-1">{getStatusIcon(technicalAnalysis.security.hasSSL)}<span>SSL</span></div>
                  <div className="flex items-center gap-1">{getStatusIcon(!technicalAnalysis.security.mixedContent)}<span>No Mixed Content</span></div>
                  <div className="flex items-center gap-1"><Info className="h-4 w-4 text-yellow-500" /><span>Headers: {technicalAnalysis.security.securityHeaders.join(', ')}</span></div>
                  {technicalAnalysis.security.vulnerabilities.length > 0 && (
                    <div className="flex items-center gap-1 text-red-500"><AlertCircle className="h-4 w-4" />{technicalAnalysis.security.vulnerabilities.join(', ')}</div>
                  )}
                </div>
              </m.div>
            )}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
} 