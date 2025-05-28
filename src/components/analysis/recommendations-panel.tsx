import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, Clock, ArrowUpRight, Check, X } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

type Priority = 'high' | 'medium' | 'low';

interface Recommendation {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  category: string;
  estimatedImpact: string;
  timeToImplement: string;
  status: 'pending' | 'in-progress' | 'completed' | 'dismissed';
  steps: string[];
}

const recommendations: Recommendation[] = [
  {
    id: 'rec-1',
    title: 'Optimize Page Load Speed',
    description: 'Improve page load time by optimizing images and scripts',
    priority: 'high',
    category: 'Performance',
    estimatedImpact: 'High',
    timeToImplement: '1-2 hours',
    status: 'pending',
    steps: [
      'Compress and resize images',
      'Enable browser caching',
      'Minify CSS and JavaScript',
      'Defer non-critical JavaScript',
    ],
  },
  {
    id: 'rec-2',
    title: 'Improve Mobile Usability',
    description: 'Fix touch targets and viewport configuration',
    priority: 'high',
    category: 'Mobile',
    estimatedImpact: 'High',
    timeToImplement: '2-3 hours',
    status: 'in-progress',
    steps: [
      'Increase touch target sizes',
      'Adjust viewport configuration',
      'Test on mobile devices',
    ],
  },
  {
    id: 'rec-3',
    title: 'Add Missing Alt Text',
    description: 'Add descriptive alt text to images for better accessibility',
    priority: 'medium',
    category: 'Accessibility',
    estimatedImpact: 'Medium',
    timeToImplement: '30 minutes',
    status: 'pending',
    steps: [
      'Identify images without alt text',
      'Write descriptive alt text',
      'Update image tags',
    ],
  },
  {
    id: 'rec-4',
    title: 'Improve Meta Descriptions',
    description: 'Create compelling meta descriptions for key pages',
    priority: 'medium',
    category: 'On-Page SEO',
    estimatedImpact: 'Medium',
    timeToImplement: '1 hour',
    status: 'pending',
    steps: [
      'Identify pages with missing/weak meta descriptions',
      'Write compelling descriptions (150-160 characters)',
      'Include primary keywords naturally',
    ],
  },
];

const priorityColors = {
  high: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  low: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
} as const;

interface RecommendationsPanelProps {
  count: number;
}

export function RecommendationsPanel({ count }: RecommendationsPanelProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<Priority | 'all'>('all');

  const filteredRecommendations = recommendations
    .filter((rec) => activeFilter === 'all' || rec.priority === activeFilter)
    .slice(0, count);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'in-progress':
        return <Clock className="h-4 w-4 text-amber-500" />;
      case 'dismissed':
        return <X className="h-4 w-4 text-gray-400" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          Recommendations
        </CardTitle>
        <div className="flex items-center space-x-2">
          <Button
            variant={activeFilter === 'all' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveFilter('all')}
            className="h-7 text-xs"
          >
            All
          </Button>
          <Button
            variant={activeFilter === 'high' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveFilter('high')}
            className="h-7 text-xs bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50"
          >
            High
          </Button>
          <Button
            variant={activeFilter === 'medium' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveFilter('medium')}
            className="h-7 text-xs bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:hover:bg-yellow-900/50"
          >
            Medium
          </Button>
          <Button
            variant={activeFilter === 'low' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveFilter('low')}
            className="h-7 text-xs bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50"
          >
            Low
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="space-y-1">
          {filteredRecommendations.length > 0 ? (
            filteredRecommendations.map((rec) => (
              <div 
                key={rec.id} 
                className="border-b last:border-b-0"
              >
                <button
                  onClick={() => toggleExpand(rec.id)}
                  className="w-full text-left p-4 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{rec.title}</h3>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${priorityColors[rec.priority]}`}
                        >
                          {rec.priority}
                        </Badge>
                        {getStatusIcon(rec.status)}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {rec.description}
                      </p>
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      <ArrowUpRight 
                        className={`h-4 w-4 text-muted-foreground transition-transform ${
                          expandedId === rec.id ? 'rotate-90' : ''
                        }`} 
                      />
                    </div>
                  </div>
                  
                  <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                    <span>Impact: {rec.estimatedImpact}</span>
                    <span>•</span>
                    <span>Time: {rec.timeToImplement}</span>
                    <span>•</span>
                    <span>{rec.steps.length} steps</span>
                  </div>
                </button>
                
                {expandedId === rec.id && (
                  <div className="px-4 pb-4 pt-2 bg-accent/30">
                    <div className="mb-3">
                      <h4 className="text-sm font-medium mb-2">Implementation Steps</h4>
                      <ol className="space-y-2 pl-4 text-sm">
                        {rec.steps.map((step, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-muted-foreground">{i + 1}.</span>
                            <span>{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Check className="h-4 w-4 mr-2" />
                          Mark as Complete
                        </Button>
                        <Button size="sm" variant="ghost">
                          <X className="h-4 w-4 mr-2" />
                          Dismiss
                        </Button>
                      </div>
                      <Button size="sm" variant="link" className="text-blue-600">
                        Learn More
                        <ArrowUpRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="p-6 text-center text-muted-foreground">
              No recommendations found for the selected filter.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
