export interface Recommendation {
  id: string;
  jobId: string;
  pageUrl: string;
  type: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'easy' | 'medium' | 'hard';
  timeToImplement: string;
  difficulty: number;
  implementation: {
    steps: string[];
    codeExamples?: string[];
    beforeAfter?: {
      before: string;
      after: string;
      explanation: string;
    };
    tools: string[];
    resources: Array<{
      title: string;
      url: string;
      type: 'guide' | 'tool' | 'documentation';
    }>;
  };
  expectedResults: {
    seoImpact: string;
    userImpact: string;
    businessImpact: string;
    timeframe: string;
  };
  relationships: {
    affectedElements: string[];
    relatedIssues: string[];
    dependencies: string[];
    conflicts: string[];
  };
} 