// import Bull, { Job, Queue, JobOptions } from 'bull';
import { Worker as BullWorker, Job } from 'bullmq';
import { EnhancedQueueAdapter, JobProgress } from './EnhancedQueueAdapter';
import { CrawlerConfig } from '../types/CrawlerConfig';
import { logger } from '../../utils/logger';
import { PrismaClient } from '@prisma/client';
import { enhancedWebSocketGateway, EnhancedAnalysisProgress } from '../ws/EnhancedWebSocketGateway';
import { AnalysisIntegrationService } from '../../services/analysis-integration.service';
import IORedis from 'ioredis';
import { EnhancedPageAnalyzer } from '../engine/EnhancedPageAnalyzer';

interface AnalysisJobData extends CrawlerConfig {
  projectId: string;
  userId: string;
  timeout?: number;
  cancelled?: boolean;
}

export interface EnhancedPageAnalysis {
  url: string;
  statusCode: number;
  score?: number;
  scores?: any;
  issues?: any[];
  recommendations?: any[];
  overallScore?: number;
  technicalScore?: number;
  contentScore?: number;
  onpageScore?: number;
  uxScore?: number;
  metadata?: any;
  storedResult?: any;
  jobId?: string;
  duration?: number;
  title?: string;
  meta?: any;
  content?: any;
  headings?: any;
  links?: any;
  images?: any;
  schema?: any;
  performance?: any;
  security?: any;
  accessibility?: any;
  seoIssues?: any;
  scoreBreakdown?: any;
  contentAnalysis?: any;
  categorizedIssues?: any;
  detailedRecommendations?: any;
  performanceMetrics?: any;
  [key: string]: any;
}

export class EnhancedWorker {
  private worker: BullWorker;
  private queueAdapter: EnhancedQueueAdapter;
  private prisma: PrismaClient;
  private analysisIntegrationService: AnalysisIntegrationService;
  private redis: IORedis;
  private progressUpdateThrottle = new Map<string, number>();

  constructor(queueAdapter: EnhancedQueueAdapter) {
    this.queueAdapter = queueAdapter;
    this.prisma = new PrismaClient();
    this.analysisIntegrationService = new AnalysisIntegrationService();
    this.redis = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379');

    this.worker = new BullWorker(
      'seo-analysis',
      this.processAnalysisJob.bind(this),
      {
        connection: {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379'),
        },
        concurrency: parseInt(process.env.WORKER_CONCURRENCY || '2'),
        removeOnComplete: { count: 10 },
        removeOnFail: { count: 25 },
      }
    );

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.worker.on('ready', () => {
      logger.info('Enhanced worker is ready to process analysis jobs');
    });

    this.worker.on('error', (error: Error) => {
      logger.error('Enhanced worker error:', error);
    });

    this.worker.on('failed', (job: Job<AnalysisJobData> | undefined, error: Error) => {
      logger.error(`Analysis job ${job?.id} failed:`, error);
      if (job?.id) {
        enhancedWebSocketGateway.emitError(job.id.toString(), error);
      }
    });

    this.worker.on('completed', (job: Job<AnalysisJobData>, result: any) => {
      logger.info(`Analysis job ${job.id} completed successfully`);
      if (job?.id) {
        enhancedWebSocketGateway.emitCompleted(job.id.toString(), result);
      }
    });
  }

  /**
   * Start the worker to begin processing jobs
   */
  async start(): Promise<void> {
    try {
      logger.info('Starting enhanced worker...');
      // The Bull worker starts automatically when instantiated
      // This method provides explicit confirmation that startup is complete
      logger.info('Enhanced worker started successfully');
    } catch (error) {
      logger.error('Failed to start enhanced worker:', error);
      throw error;
    }
  }

  private async processAnalysisJob(job: Job<AnalysisJobData>): Promise<EnhancedPageAnalysis> {
    const { projectId, userId, timeout = 600000, ...config } = job.data;
    const jobId = job.id!.toString();
    
    logger.info(`Starting SEO analysis job ${jobId} for project ${projectId}`);

    try {
      // Check if job was cancelled during queue time
      if (job.data.cancelled) {
        throw new Error('Job was cancelled before processing');
      }

      // Emit initial progress - initialization
      await this.updateProgress(job, {
        percentage: 5,
        stage: 'initializing',
        details: 'Setting up analysis environment',
        startTime: new Date(),
        currentStep: 'Initializing',
        totalSteps: 8,
        stepProgress: 0
      });

      // Get project details from database
      const project = await this.prisma.project.findUnique({
        where: { id: projectId },
        include: { user: true },
      });

      if (!project) {
        throw new Error(`Project ${projectId} not found`);
      }

      // Check for cancellation again after database query
      const updatedJob = await this.queueAdapter.getJobStatus(jobId);
      if (updatedJob?.data?.cancelled) {
        throw new Error('Job was cancelled during processing');
      }

      // Update progress - starting analysis
      await this.updateProgress(job, {
        percentage: 10,
        stage: 'starting_analysis',
        details: `Analyzing ${project.url}`,
        currentStep: 'Starting Analysis',
        stepProgress: 100
      });

      // Create/update crawl session in database
      await this.prisma.crawlSession.upsert({
        where: { id: jobId },
        update: {
          status: 'running',
          startedAt: new Date(),
        },
        create: {
          id: jobId,
          projectId,
          url: project.url,
          status: 'running',
          startedAt: new Date(),
        },
      });

      // Setup comprehensive timeout handling
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Analysis timeout after ${Math.round(timeout / 1000)}s`));
        }, timeout);
      });

      // Get previous analysis for trend calculation
      const previousAnalysis = await this.getPreviousAnalysis(projectId);
      const previousScore = previousAnalysis?.overallScore;

      // Enhanced crawler configuration with progress tracking
      const enhancedConfig: CrawlerConfig = {
        ...config,
        url: project.url,
        projectId,
        userId,
        crawlOptions: {
          ...config.crawlOptions,
          userAgent: config.crawlOptions?.userAgent || 'SEO-Analyzer-Enhanced/2.0 (+https://rival-outranker.com/bot)',
          timeout: Math.min(timeout - 60000, 480000),
          retryAttempts: 2,
          respectRobots: true,
          crawlDelay: 1000,
          extractOptions: {
            ...config.crawlOptions?.extractOptions,
          },
          blockResources: ['font', 'media', 'other'],
          viewport: { width: 1200, height: 800, deviceType: 'desktop' as const },
        },
      };

      // Emit step change - crawling
      enhancedWebSocketGateway.emitStepChange(jobId, {
        currentStep: 'Crawling Website',
        totalSteps: 8,
        stepNumber: 2,
        stepProgress: 0,
        details: 'Fetching page content and resources'
      });

      // Update progress - crawling
      await this.updateProgress(job, {
        percentage: 20,
        stage: 'crawling',
        details: 'Fetching page content',
        currentStep: 'Crawling Website',
        stepProgress: 50
      });

      // Initialize enhanced analyzer with timeout protection
      const analyzer = new EnhancedPageAnalyzer(enhancedConfig);

      // Update progress - analyzing
      await this.updateProgress(job, {
        percentage: 30,
        stage: 'analyzing',
        details: 'Running technical analysis',
        currentStep: 'Technical Analysis',
        stepProgress: 0
      });

      // Run analysis with comprehensive timeout and cancellation protection
      const analysisPromise = this.runAnalysisWithCancellationCheck(
        analyzer, 
        project.url, 
        previousScore, 
        jobId
      );
      
      const result = await Promise.race([analysisPromise, timeoutPromise]);

      // Validate result completeness
      if (!result || !result.scores) {
        throw new Error('Analysis result is incomplete or invalid');
      }

      // Update progress - scoring
      await this.updateProgress(job, {
        percentage: 70,
        stage: 'scoring',
        details: 'Calculating SEO scores',
        currentStep: 'Scoring Analysis',
        stepProgress: 100
      });

      // Update progress - generating recommendations
      await this.updateProgress(job, {
        percentage: 80,
        stage: 'generating_recommendations',
        details: 'Generating improvement recommendations',
        currentStep: 'Recommendations',
        stepProgress: 100
      });

      // Store analysis results using the integration service
      await this.updateProgress(job, {
        percentage: 90,
        stage: 'storing_results',
        details: 'Storing analysis results in database',
        currentStep: 'Storing Results',
        stepProgress: 50
      });

      const storedResult = await this.analysisIntegrationService.storeAnalysisResults(
        jobId,
        projectId,
        result
      );

      // Update crawl session status to completed
      await this.prisma.crawlSession.update({
        where: { id: jobId },
        data: {
          status: 'completed',
          completedAt: new Date(),
        },
      });

      // Calculate final metrics
      const duration = this.calculateJobDuration(job);

      // Final progress update
      await this.updateProgress(job, {
        percentage: 100,
        stage: 'completed',
        details: `Analysis completed successfully. Overall score: ${storedResult.overallScore}`,
        currentStep: 'Completed',
        stepProgress: 100,
      });

      // Emit completion with comprehensive data
      const completionData = {
        jobId,
        userId,
        projectId,
        overallScore: storedResult.overallScore,
        duration,
        issueCount: result.issues?.length || 0,
        improvementSuggestions: result.recommendations?.length || 0,
        processingTime: duration,
        timestamp: new Date()
      };

      enhancedWebSocketGateway.emitCompleted(jobId, completionData);

      // Send user notification
      enhancedWebSocketGateway.emitSystemNotification(userId, {
        type: 'success',
        title: 'Analysis Complete',
        message: `Your SEO analysis for ${project.name} has completed with a score of ${storedResult.overallScore}/100`,
        data: completionData
      });

      logger.info(`SEO analysis job ${jobId} completed successfully with score: ${storedResult.overallScore}`);
      
      // Return the enhanced result with storage information and required properties
      return {
        ...result,
        url: config.url,
        statusCode: 200, // Default to 200 if not available
        scores: {
          overall: storedResult.overallScore,
          technical: storedResult.technicalScore,
          content: storedResult.contentScore,
          onpage: storedResult.onpageScore,
          ux: storedResult.uxScore
        },
        storedResult,
        jobId,
        duration,
      } as EnhancedPageAnalysis;

    } catch (error: any) {
      logger.error(`SEO analysis job ${jobId} failed:`, error);

      // Emit error to WebSocket
      enhancedWebSocketGateway.emitError(jobId, error);

      // Send user notification
      enhancedWebSocketGateway.emitSystemNotification(userId, {
        type: 'error',
        title: 'Analysis Failed',
        message: `Analysis for project failed: ${error.message}`,
        data: { jobId, error: error.message }
      });

      // Update crawl session status to failed
      try {
        await this.prisma.crawlSession.update({
          where: { id: jobId },
          data: {
            status: 'failed',
            completedAt: new Date(),
            errorMessage: error.message,
          },
        });
      } catch (dbError) {
        logger.error(`Failed to update crawl session status for ${jobId}:`, dbError);
      }

      // Determine if this is a retryable error
      const isRetryable = this.isRetryableError(error);
      
      if (!isRetryable || job.attemptsMade >= (job.opts.attempts || 3)) {
        // Store permanent failure
        await this.storeAnalysisFailure(jobId, job.data, error);
      }

      // Re-throw to let BullMQ handle retry logic
      throw error;
    }
  }

  /**
   * Enhanced progress update with WebSocket integration and throttling
   */
  private async updateProgress(job: Job<AnalysisJobData>, progress: JobProgress): Promise<void> {
    try {
      const jobId = job.id!.toString();
      const userId = job.data.userId;
      
      // Throttle progress updates (max 1 per second per job)
      const now = Date.now();
      const lastUpdate = this.progressUpdateThrottle.get(jobId);
      if (lastUpdate && now - lastUpdate < 1000) {
        return; // Skip this update
      }
      this.progressUpdateThrottle.set(jobId, now);

      // Calculate estimated time remaining
      let estimatedTimeRemaining: number | undefined;
      if (progress.percentage && progress.percentage > 5) {
        const elapsed = Date.now() - (job.processedOn || job.timestamp);
        const progressPercent = Math.max(progress.percentage, 1);
        const totalEstimated = (elapsed / progressPercent) * 100;
        estimatedTimeRemaining = Math.max(0, totalEstimated - elapsed);
      }

      // Enhance progress with additional metadata
      const enhancedProgress: EnhancedAnalysisProgress = {
        ...progress,
        jobId,
        userId,
        timestamp: new Date(),
        estimatedTimeRemaining,
        currentStep: progress.currentStep || progress.stage,
        totalSteps: progress.totalSteps || 8,
        stepProgress: progress.stepProgress || 0
      };

      // Update job progress in Redis/BullMQ
      await job.updateProgress(enhancedProgress);

      // Cache progress in Redis for quick retrieval
      await this.redis.setex(
        `analysis:progress:${jobId}`,
        3600, // 1 hour TTL
        JSON.stringify(enhancedProgress)
      );

      // Emit to WebSocket
      enhancedWebSocketGateway.emitProgress(jobId, enhancedProgress);

      logger.debug(`Progress updated for job ${jobId}: ${progress.percentage}% - ${progress.stage}`);

    } catch (error) {
      logger.warn(`Failed to update progress for job ${job.id}:`, error);
    }
  }

  /**
   * Run analysis with periodic cancellation checks and step tracking
   */
  private async runAnalysisWithCancellationCheck(
    analyzer: EnhancedPageAnalyzer,
    url: string,
    previousScore: number | undefined,
    jobId: string
  ): Promise<EnhancedPageAnalysis> {
    // Set up cancellation check interval
    const cancellationCheckInterval = setInterval(async () => {
      try {
        const jobStatus = await this.queueAdapter.getJobStatus(jobId);
        if (jobStatus?.data?.cancelled) {
          clearInterval(cancellationCheckInterval);
          enhancedWebSocketGateway.emitError(jobId, 'Job was cancelled during analysis');
          throw new Error('Job was cancelled during analysis');
        }
      } catch (error) {
        logger.debug(`Cancellation check failed for job ${jobId}:`, error);
      }
    }, 10000); // Check every 10 seconds

    try {
      // Step tracking during analysis
      enhancedWebSocketGateway.emitStepChange(jobId, {
        currentStep: 'Content Analysis',
        totalSteps: 8,
        stepNumber: 3,
        stepProgress: 0,
        details: 'Analyzing page content and structure'
      });

      const result = await analyzer.analyzePage(url, previousScore);
      
      clearInterval(cancellationCheckInterval);
      return result;
    } catch (error) {
      clearInterval(cancellationCheckInterval);
      throw error;
    }
  }

  private async getPreviousAnalysis(projectId: string): Promise<{ overallScore: number } | null> {
    try {
      const previousAnalysis = await this.prisma.sEOAnalysis.findFirst({
        where: { projectId },
        orderBy: { createdAt: 'desc' },
        select: { overallScore: true },
      });

      // Ensure overallScore is a number, not null
      if (previousAnalysis && previousAnalysis.overallScore !== null) {
        return { overallScore: previousAnalysis.overallScore };
      }

      return null;
    } catch (error) {
      logger.warn(`Failed to get previous analysis for project ${projectId}:`, error);
      return null;
    }
  }

  private calculateJobDuration(job: Job): number {
    const startTime = job.processedOn || job.timestamp;
    return Math.round((Date.now() - startTime) / 1000); // Duration in seconds
  }

  private isRetryableError(error: any): boolean {
    // Define retryable error conditions
    const retryableErrors = [
      'timeout',
      'network',
      'connection',
      'ECONNRESET',
      'ENOTFOUND',
      'ETIMEDOUT'
    ];

    const errorMessage = error.message?.toLowerCase() || '';
    return retryableErrors.some(retryable => errorMessage.includes(retryable));
  }

  /**
   * Enhanced failure storage with detailed error information
   */
  private async storeAnalysisFailure(
    jobId: string,
    jobData: AnalysisJobData,
    error: Error
  ): Promise<void> {
    try {
      // Create a basic SEO analysis record for the failure
      const seoAnalysis = await this.prisma.sEOAnalysis.create({
        data: {
          crawlSessionId: jobId,
          projectId: jobData.projectId,
          overallScore: 0,
          technicalScore: 0,
          contentScore: 0,
          onpageScore: 0,
          uxScore: 0,
        },
      });

      // Create a failure issue
      await this.prisma.sEOIssue.create({
        data: {
          analysisId: seoAnalysis.id,
          type: 'system',
          category: 'technical',
          severity: 'critical',
          title: 'Analysis Failed',
          description: `Analysis failed with error: ${error.message}`,
          recommendation: 'Please try running the analysis again. If the issue persists, contact support.',
          status: 'open',
        },
      });

      logger.info(`Stored failure information for job ${jobId}`);

    } catch (storageError) {
      logger.error(`Failed to store failure information for job ${jobId}:`, storageError);
    }
  }

  /**
   * Gracefully shutdown the worker
   */
  async shutdown(): Promise<void> {
    try {
      logger.info('Shutting down enhanced worker...');
      
      await this.worker.close();
      await this.prisma.$disconnect();
      await this.redis.disconnect();
      
      logger.info('Enhanced worker shutdown complete');
    } catch (error) {
      logger.error('Error during worker shutdown:', error);
      throw error;
    }
  }

  /**
   * Stop the worker (alias for shutdown for compatibility)
   */
  async stop(): Promise<void> {
    return this.shutdown();
  }

  /**
   * Get worker metrics
   */
  getWorkerMetrics(): {
    activeJobs: number;
    completedJobs: number;
    failedJobs: number;
    stalledJobs: number;
    isRunning: boolean;
  } {
    return {
      activeJobs: 0, // Worker running property is protected, use 0 for now
      completedJobs: 0, // BullMQ doesn't track this at worker level
      failedJobs: 0,    // BullMQ doesn't track this at worker level
      stalledJobs: 0,   // BullMQ doesn't track this at worker level
      isRunning: !this.worker.closing
    };
  }
} 