import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const CrawlConfigurationSchema = z.object({
  crawlType: z.enum(['single', 'subfolder', 'domain']),
  startUrl: z.string().url(),
  depth: z.number().min(1).max(5).default(3),
  maxPages: z.number().min(1).max(500).default(50),
  filters: z.object({
    includePatterns: z.array(z.string()).default([]),
    excludePatterns: z.array(z.string()).default([]),
    fileTypes: z.array(z.string()).default(['html', 'htm', 'php', 'asp', 'aspx']),
    respectRobotsTxt: z.boolean().default(true),
    followExternal: z.boolean().default(false),
    analyzeSubdomains: z.boolean().default(false),
  }).default({}),
  performance: z.object({
    concurrent: z.number().min(1).max(10).default(3),
    delayBetweenRequests: z.number().min(100).max(10000).default(1000),
    timeout: z.number().min(5000).max(60000).default(30000),
  }).default({}),
  analysis: z.object({
    skipDuplicateContent: z.boolean().default(true),
    groupSimilarPages: z.boolean().default(true),
    priorityPages: z.array(z.string()).default([]),
  }).default({}),
});

const StartCrawlRequestSchema = z.object({
  projectId: z.string().optional(),
  config: CrawlConfigurationSchema,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, config } = StartCrawlRequestSchema.parse(body);

    // Get user from token (implementation depends on your auth system)
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify user and get user ID
    // This is a placeholder - implement your actual auth verification
    const userId = await verifyTokenAndGetUserId(token);
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    // Generate session ID
    const sessionId = generateSessionId();

    // Estimate crawl requirements
    const estimate = estimateCrawl(config);

    // Check user's crawl limits (implement based on your subscription system)
    const canStartCrawl = await checkUserCrawlLimits(userId, estimate);
    if (!canStartCrawl.allowed) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Crawl limit exceeded',
          details: canStartCrawl.reason
        },
        { status: 403 }
      );
    }

    // Create crawl session in database
    const session = await createCrawlSession({
      sessionId,
      userId,
      projectId,
      config,
      estimate
    });

    // Start the crawl in background
    startCrawlInBackground(sessionId, config, userId);

    return NextResponse.json({
      success: true,
      data: {
        sessionId,
        estimatedDuration: estimate.duration,
        estimatedPages: estimate.pages,
        estimatedCredits: estimate.credits,
        status: 'pending'
      }
    });

  } catch (error) {
    console.error('Error starting multi-page crawl:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid request data',
          details: error.errors
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function verifyTokenAndGetUserId(token: string): Promise<string | null> {
  // Implement your token verification logic here
  // This should verify the JWT token and return the user ID
  try {
    // Placeholder implementation
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/verify`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.userId;
    }
    
    return null;
  } catch {
    return null;
  }
}

function generateSessionId(): string {
  return `crawl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function estimateCrawl(config: any) {
  let estimatedPages = 1;
  let duration = 1; // minutes
  
  if (config.crawlType === 'subfolder') {
    estimatedPages = Math.min(config.maxPages, 10 * config.depth);
    duration = Math.ceil(estimatedPages * 0.5);
  } else if (config.crawlType === 'domain') {
    estimatedPages = Math.min(config.maxPages, 50 * config.depth);
    duration = Math.ceil(estimatedPages * 0.5);
  }
  
  const credits = Math.ceil(estimatedPages * 0.1);
  
  return {
    pages: estimatedPages,
    duration,
    credits
  };
}

async function checkUserCrawlLimits(userId: string, estimate: any) {
  // Implement your crawl limits checking logic here
  // This should check user's subscription tier and current usage
  
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users/${userId}/crawl-limits`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(estimate)
    });
    
    if (response.ok) {
      const data = await response.json();
      return { allowed: data.allowed, reason: data.reason };
    }
    
    return { allowed: false, reason: 'Unable to verify crawl limits' };
  } catch {
    return { allowed: false, reason: 'Service unavailable' };
  }
}

async function createCrawlSession({
  sessionId,
  userId,
  projectId,
  config,
  estimate
}: {
  sessionId: string;
  userId: string;
  projectId?: string;
  config: any;
  estimate: any;
}) {
  // Create session in database via backend API
  const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/crawl/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId,
      userId,
      projectId,
      crawlType: config.crawlType,
      startUrl: config.startUrl,
      config,
      estimatedPages: estimate.pages,
      estimatedDuration: estimate.duration
    })
  });
  
  if (!response.ok) {
    throw new Error('Failed to create crawl session');
  }
  
  return response.json();
}

async function startCrawlInBackground(sessionId: string, config: any, userId: string) {
  // Start the crawl process in background
  // This could be done via a queue system, worker process, or direct API call
  
  try {
    await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/crawl/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        config,
        userId
      })
    });
  } catch (error) {
    console.error('Failed to start background crawl:', error);
    // Update session status to failed
    await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/crawl/sessions/${sessionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'failed',
        errorMessage: 'Failed to start crawl process'
      })
    });
  }
}