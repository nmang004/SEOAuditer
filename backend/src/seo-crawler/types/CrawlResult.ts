import { PageAnalysis } from './PageAnalysis';

export type { PageAnalysis };

export interface CrawlResult {
  jobId: string;
  projectId: string;
  userId: string;
  startedAt: Date;
  completedAt?: Date;
  pages: PageAnalysis[];
  issues: any[];
  recommendations: any[];
  score?: number;
  [key: string]: any;
} 