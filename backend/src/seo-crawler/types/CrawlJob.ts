export interface CrawlJob {
  id: string;
  projectId: string;
  userId: string;
  status: string;
  startedAt: Date;
  completedAt?: Date;
  config: any;
  result?: any;
  progress: number;
  error?: string;
} 