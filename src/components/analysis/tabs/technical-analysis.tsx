import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react';

export function TechnicalAnalysis() {
  const pageSpeedData = {
    score: 78,
    loadTime: 3.2,
    firstContentfulPaint: 1.8,
    largestContentfulPaint: 2.4,
    cumulativeLayoutShift: 0.12,
    recommendations: [
      'Optimize images with next-gen formats (WebP/AVIF)',
      'Eliminate render-blocking resources',
      'Reduce unused JavaScript',
    ],
  };

  const mobileFriendliness = {
    score: 85,
    hasViewportMeta: true,
    usesResponsiveDesign: true,
    touchTargetsAppropriate: false,
    issues: [
      'Some touch targets are too small',
      'Text too small to read on mobile',
    ],
  };

  const crawlability = {
    robotsTxtValid: true,
    hasXMLSitemap: true,
    canonicalTagsPresent: true,
    noIndexPages: 3,
    redirectChains: 2,
  };

  const security = {
    hasSSL: true,
    mixedContent: false,
    securityHeaders: [
      'Strict-Transport-Security',
      'X-Content-Type-Options',
      'X-Frame-Options',
    ],
    vulnerabilities: ['jQuery 3.4.1 has known vulnerabilities'],
  };

  const renderCheckItem = (condition: boolean, label: string) => (
    <div className="flex items-center gap-2">
      {condition ? (
        <CheckCircle className="h-4 w-4 text-green-500" />
      ) : (
        <XCircle className="h-4 w-4 text-red-500" />
      )}
      <span>{label}</span>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Page Speed */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Page Speed</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold">{pageSpeedData.score}</div>
              <div className="text-sm text-muted-foreground">Performance Score</div>
            </div>
            <div className="space-y-1 text-right">
              <div className="text-sm">
                <span className="font-medium">{pageSpeedData.loadTime}s</span> load time
              </div>
              <div className="text-sm text-muted-foreground">
                FCP: {pageSpeedData.firstContentfulPaint}s • LCP: {pageSpeedData.largestContentfulPaint}s
              </div>
            </div>
          </div>
          <Progress value={pageSpeedData.score} className="h-2" />
          
          <div className="space-y-2">
            <h4 className="font-medium">Recommendations</h4>
            <ul className="space-y-2 text-sm">
              {pageSpeedData.recommendations.map((rec, i) => (
                <li key={i} className="flex items-start gap-2">
                  <Info className="h-4 w-4 mt-0.5 text-blue-500 flex-shrink-0" />
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Mobile Friendliness */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Mobile Friendliness</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-3xl font-bold">{mobileFriendliness.score}</div>
            <Badge variant="outline" className="text-green-600">
              Mobile-Friendly
            </Badge>
          </div>
          
          <div className="space-y-3">
            {renderCheckItem(mobileFriendliness.hasViewportMeta, 'Viewport meta tag configured')}
            {renderCheckItem(mobileFriendliness.usesResponsiveDesign, 'Uses responsive design')}
            {renderCheckItem(mobileFriendliness.touchTargetsAppropriate, 'Appropriate touch targets')}
          </div>

          {mobileFriendliness.issues.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium">Issues Found</h4>
              <ul className="space-y-1 text-sm">
                {mobileFriendliness.issues.map((issue, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 mt-0.5 text-amber-500 flex-shrink-0" />
                    <span>{issue}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Crawlability */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Crawlability</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              {renderCheckItem(crawlability.robotsTxtValid, 'Valid robots.txt')}
              {renderCheckItem(crawlability.hasXMLSitemap, 'XML sitemap found')}
              {renderCheckItem(crawlability.canonicalTagsPresent, 'Canonical tags present')}
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-amber-500" />
                <span>{crawlability.noIndexPages} pages with noindex</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-amber-500" />
                <span>{crawlability.redirectChains} redirect chains found</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Security</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              {renderCheckItem(security.hasSSL, 'SSL/TLS configured')}
              {renderCheckItem(!security.mixedContent, 'No mixed content')}
              
              <div>
                <h4 className="font-medium mb-1">Security Headers</h4>
                <div className="flex flex-wrap gap-2">
                  {security.securityHeaders.map((header, i) => (
                    <Badge key={i} variant="secondary" className="font-mono text-xs">
                      {header}
                    </Badge>
                  ))}
                </div>
              </div>

              {security.vulnerabilities.length > 0 && (
                <div className="space-y-1">
                  <h4 className="font-medium">Vulnerabilities</h4>
                  <ul className="space-y-1 text-sm text-red-600">
                    {security.vulnerabilities.map((vuln, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <span>{vuln}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
