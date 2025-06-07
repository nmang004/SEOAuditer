export interface Recommendation {
  id: string;
  jobId: string;
  pageUrl: string;
  type: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact: {
    seoScore: number; // 0-10 impact on overall score
    userExperience: number; // 0-10 UX impact
    conversionPotential: number; // 0-10 conversion impact
    implementationEffort: 'low' | 'medium' | 'high';
    timeToImplement: number; // minutes
  };
  implementation: {
    autoFixAvailable: boolean;
    codeSnippet: {
      before: string;
      after: string;
      language: 'html' | 'css' | 'javascript' | 'json';
    };
    stepByStep: string[];
    tools: string[];
    documentation: string[];
  };
  visualization: {
    beforeScreenshot?: string;
    afterMockup?: string;
    comparisonMetrics: Record<string, number>;
  };
  businessCase: {
    estimatedTrafficIncrease: string;
    competitorComparison: string;
    roi: string;
  };
  quickWin: boolean;
  category: 'technical' | 'onpage' | 'content' | 'structured' | 'performance';
  affectedElements: string[];
  relatedIssues: string[];
  dependencies: string[];
  conflicts: string[];
} 