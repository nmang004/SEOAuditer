"use client";

import { useState } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { CheckCircle2, AlertCircle, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { ContentAnalysisData } from '@/lib/analysis-types';
import { cn } from '@/lib/utils';

function getScoreColor(score: number) {
  if (score >= 80) return 'bg-green-500';
  if (score >= 60) return 'bg-yellow-500';
  if (score >= 30) return 'bg-orange-500';
  return 'bg-red-500';
}

export function ContentAnalysis({
  contentAnalysis
}: {
  contentAnalysis: ContentAnalysisData;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);

  // Tree view for headings
  const renderHeadingTree = () => {
    const { h1Count, missingLevels, hierarchyValid } = contentAnalysis.headingStructure;
    return (
      <div className="pl-2">
        <div className="flex items-center gap-2">
          <span className="font-semibold">H1</span>
          <Badge variant={h1Count === 1 ? 'success' : 'danger'}>{h1Count}</Badge>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className="font-semibold">Missing Levels:</span>
          {missingLevels.length === 0 ? <span>None</span> : missingLevels.join(', ')}
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className="font-semibold">Hierarchy Valid:</span>
          <Badge variant={hierarchyValid ? 'success' : 'danger'}>{hierarchyValid ? 'Yes' : 'No'}</Badge>
        </div>
      </div>
    );
  };

  // Keyword density chart (simple bar)
  const renderKeywordDensity = () => (
    <div className="flex items-center gap-2">
      <span className="font-semibold">Keyword Density:</span>
      <div className="w-32 h-3 bg-muted rounded-full overflow-hidden">
        <div className="h-full bg-primary" style={{ width: `${contentAnalysis.contentQuality.keywordDensity * 30}%` }} />
      </div>
      <span className="ml-2">{contentAnalysis.contentQuality.keywordDensity}%</span>
    </div>
  );

  // Reading level visualization (simple bar)
  const renderReadingLevel = () => (
    <div className="flex items-center gap-2">
      <span className="font-semibold">Readability Score:</span>
      <div className="w-32 h-3 bg-muted rounded-full overflow-hidden">
        <div className="h-full bg-green-500" style={{ width: `${contentAnalysis.contentQuality.readabilityScore}%` }} />
      </div>
      <span className="ml-2">{contentAnalysis.contentQuality.readabilityScore}</span>
    </div>
  );

  // Image optimization stats
  const renderImageStats = () => (
    <div className="space-y-1">
      <div>Images: {contentAnalysis.images.total}</div>
      <div>With Alt Text: {contentAnalysis.images.withAltText}</div>
      <div>Oversized: {contentAnalysis.images.oversized}</div>
      <div>Modern Formats: {contentAnalysis.images.modernFormats}</div>
    </div>
  );

  return (
    <Card id="content" className="p-6">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Content Analysis</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Meta Tags */}
        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpanded(expanded === 'meta' ? null : 'meta')}>
            <span className="font-medium">Meta Tags</span>
            <Button size="icon" variant="ghost">
              {expanded === 'meta' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
          <AnimatePresence>
            {expanded === 'meta' && (
              <m.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="pt-4 space-y-2">
                <div>Title: <Badge variant={contentAnalysis.metaTags.title.optimized ? 'success' : 'warning'}>{contentAnalysis.metaTags.title.length} chars</Badge></div>
                <div>Description: <Badge variant={contentAnalysis.metaTags.description.optimized ? 'success' : 'warning'}>{contentAnalysis.metaTags.description.length} chars</Badge></div>
                <div>Keywords: <Badge variant={contentAnalysis.metaTags.keywords.relevant ? 'success' : 'warning'}>{contentAnalysis.metaTags.keywords.present ? 'Present' : 'Missing'}</Badge></div>
              </m.div>
            )}
          </AnimatePresence>
        </div>
        {/* Headings Structure */}
        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpanded(expanded === 'headings' ? null : 'headings')}>
            <span className="font-medium">Heading Structure</span>
            <Button size="icon" variant="ghost">
              {expanded === 'headings' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
          <AnimatePresence>
            {expanded === 'headings' && (
              <m.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="pt-4">
                {renderHeadingTree()}
              </m.div>
            )}
          </AnimatePresence>
        </div>
        {/* Content Quality */}
        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpanded(expanded === 'quality' ? null : 'quality')}>
            <span className="font-medium">Content Quality</span>
            <Button size="icon" variant="ghost">
              {expanded === 'quality' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
          <AnimatePresence>
            {expanded === 'quality' && (
              <m.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="pt-4 space-y-2">
                <div>Word Count: <Badge>{contentAnalysis.contentQuality.wordCount}</Badge></div>
                {renderReadingLevel()}
                {renderKeywordDensity()}
                <div>Duplicate Content: <Badge variant={contentAnalysis.contentQuality.duplicateContent ? 'danger' : 'success'}>{contentAnalysis.contentQuality.duplicateContent ? 'Yes' : 'No'}</Badge></div>
                <div>Internal Links: <Badge>{contentAnalysis.contentQuality.internalLinks}</Badge></div>
                <div>External Links: <Badge>{contentAnalysis.contentQuality.externalLinks}</Badge></div>
              </m.div>
            )}
          </AnimatePresence>
        </div>
        {/* Images */}
        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpanded(expanded === 'images' ? null : 'images')}>
            <span className="font-medium">Images</span>
            <Button size="icon" variant="ghost">
              {expanded === 'images' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
          <AnimatePresence>
            {expanded === 'images' && (
              <m.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="pt-4">
                {renderImageStats()}
              </m.div>
            )}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
} 