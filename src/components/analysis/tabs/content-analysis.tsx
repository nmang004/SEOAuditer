import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react';

export function ContentAnalysis() {
  const metaTags = {
    title: {
      present: true,
      length: 58,
      optimized: true,
    },
    description: {
      present: true,
      length: 156,
      optimized: true,
    },
    keywords: {
      present: false,
      relevant: false,
    },
  };

  const headingStructure = {
    h1Count: 1,
    hierarchyValid: true,
    keywordOptimized: true,
    missingLevels: [4, 5],
  };

  const contentQuality = {
    wordCount: 1245,
    readabilityScore: 8.2,
    keywordDensity: 2.1,
    duplicateContent: false,
    internalLinks: 12,
    externalLinks: 4,
  };

  const images = {
    total: 8,
    withAltText: 5,
    oversized: 3,
    modernFormats: 2,
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
      {/* Meta Tags */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Meta Tags</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium">Title Tag</h4>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {metaTags.title.present ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
                <span>{metaTags.title.length} characters</span>
              </div>
              <Badge variant={metaTags.title.optimized ? 'success' : 'destructive'}>
                {metaTags.title.optimized ? 'Optimized' : 'Needs Work'}
              </Badge>
            </div>
            <Progress 
              value={Math.min(100, metaTags.title.length)} 
              className="h-2"
              indicatorClassName={metaTags.title.optimized ? 'bg-green-500' : 'bg-amber-500'}
            />
            <p className="text-xs text-muted-foreground">
              Recommended: 30-60 characters
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">Meta Description</h4>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {metaTags.description.present ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
                <span>{metaTags.description.length} characters</span>
              </div>
              <Badge variant={metaTags.description.optimized ? 'success' : 'destructive'}>
                {metaTags.description.optimized ? 'Optimized' : 'Needs Work'}
              </Badge>
            </div>
            <Progress 
              value={Math.min(100, metaTags.description.length * 100 / 160)} 
              className="h-2"
              indicatorClassName={metaTags.description.optimized ? 'bg-green-500' : 'bg-amber-500'}
            />
            <p className="text-xs text-muted-foreground">
              Recommended: 120-160 characters
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">Meta Keywords</h4>
            <div className="flex items-center gap-2">
              {metaTags.keywords.present ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
              <span>Meta keywords {metaTags.keywords.present ? 'present' : 'missing'}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Note: Meta keywords are not used by most search engines
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Heading Structure */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Heading Structure</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {renderCheckItem(headingStructure.h1Count === 1, 'Single H1 tag')}
            {renderCheckItem(headingStructure.hierarchyValid, 'Valid heading hierarchy')}
            {renderCheckItem(headingStructure.keywordOptimized, 'Keywords in headings')}
            
            {headingStructure.missingLevels.length > 0 && (
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 mt-0.5 text-amber-500 flex-shrink-0" />
                <div>
                  <p>Missing heading levels: {headingStructure.missingLevels.join(', ')}</p>
                  <p className="text-xs text-muted-foreground">
                    Consider adding these heading levels for better structure
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Content Quality */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Content Quality</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div>
                <div className="text-2xl font-bold">{contentQuality.wordCount}</div>
                <div className="text-sm text-muted-foreground">Word Count</div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-lg font-semibold">{contentQuality.readabilityScore}/10</div>
                  <div className="text-xs text-muted-foreground">Readability</div>
                </div>
                <div>
                  <div className="text-lg font-semibold">{contentQuality.keywordDensity}%</div>
                  <div className="text-xs text-muted-foreground">Keyword Density</div>
                </div>
              </div>

              <div className="space-y-1">
                {renderCheckItem(!contentQuality.duplicateContent, 'No duplicate content')}
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>{contentQuality.internalLinks} internal links</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>{contentQuality.externalLinks} external links</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Images */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Images</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div>
                <div className="text-2xl font-bold">{images.total}</div>
                <div className="text-sm text-muted-foreground">Total Images</div>
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm">With Alt Text</span>
                  <span className="text-sm font-medium">
                    {images.withAltText}/{images.total} ({(images.withAltText / images.total * 100).toFixed(0)}%)
                  </span>
                </div>
                <Progress 
                  value={(images.withAltText / images.total) * 100} 
                  className="h-2"
                  indicatorClassName={images.withAltText === images.total ? 'bg-green-500' : 'bg-amber-500'}
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Optimized Size</span>
                  <span className="text-sm font-medium">
                    {images.total - images.oversized}/{images.total}
                  </span>
                </div>
                <Progress 
                  value={((images.total - images.oversized) / images.total) * 100} 
                  className="h-2"
                  indicatorClassName={images.oversized === 0 ? 'bg-green-500' : 'bg-amber-500'}
                />
              </div>

              <div className="pt-2">
                <h4 className="font-medium mb-1">Recommendations</h4>
                <ul className="space-y-1 text-sm">
                  <li className="flex items-start gap-2">
                    <Info className="h-4 w-4 mt-0.5 text-blue-500 flex-shrink-0" />
                    <span>Add alt text to {images.total - images.withAltText} images</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Info className="h-4 w-4 mt-0.5 text-blue-500 flex-shrink-0" />
                    <span>Optimize {images.oversized} large images</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Info className="h-4 w-4 mt-0.5 text-blue-500 flex-shrink-0" />
                    <span>Convert {images.total - images.modernFormats} images to WebP/AVIF</span>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
