import express from 'express';
import { Request, Response } from 'express';

const router = express.Router();

// Dashboard stats endpoint
router.get('/stats', async (req: Request, res: Response) => {
  try {
    // Mock data for testing - replace with real database queries
    const stats = {
      totalProjects: 8,
      activeAnalyses: 2,
      completedAnalyses: 34,
      averageScore: 82,
      scoreImprovement: 7,
      weeklyIssues: 15,
      resolvedIssues: 23,
      criticalIssues: 3,
      lastScanDate: new Date().toISOString(),
      scoreDistribution: {
        excellent: 3,
        good: 4,
        needsWork: 1,
        poor: 0
      },
      scoreTrends: [
        { date: '2025-05-26', overallScore: 75, technicalScore: 72, contentScore: 78, onPageScore: 80, uxScore: 70 },
        { date: '2025-05-27', overallScore: 77, technicalScore: 74, contentScore: 79, onPageScore: 81, uxScore: 72 },
        { date: '2025-05-28', overallScore: 79, technicalScore: 76, contentScore: 80, onPageScore: 82, uxScore: 74 },
        { date: '2025-05-29', overallScore: 81, technicalScore: 78, contentScore: 82, onPageScore: 83, uxScore: 76 },
        { date: '2025-05-30', overallScore: 82, technicalScore: 79, contentScore: 83, onPageScore: 84, uxScore: 77 },
      ],
      topProjects: [
        { id: '1', name: 'Main Website', score: 89, improvement: 8 },
        { id: '2', name: 'E-commerce Store', score: 85, improvement: 5 },
        { id: '3', name: 'Blog Platform', score: 82, improvement: 3 }
      ],
      concerningProjects: [
        { id: '4', name: 'Legacy Site', score: 58, criticalIssues: 5 },
        { id: '5', name: 'Mobile App Landing', score: 62, criticalIssues: 3 }
      ]
    };

    res.json({
      success: true,
      data: stats,
      cached: false,
      message: "Dashboard statistics loaded successfully from backend"
    });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard statistics'
    });
  }
});

// Recent projects endpoint
router.get('/recent-projects', async (req: Request, res: Response) => {
  try {
    const projects = [
      {
        id: '1',
        name: 'Main Website',
        url: 'https://example.com',
        favicon: 'https://www.google.com/s2/favicons?domain=example.com',
        currentScore: 89,
        previousScore: 81,
        lastScanDate: new Date(),
        status: 'completed' as const,
        criticalIssues: 1,
        progress: undefined as any
      },
      {
        id: '2',
        name: 'E-commerce Store',
        url: 'https://store.example.com',
        favicon: 'https://www.google.com/s2/favicons?domain=store.example.com',
        currentScore: 85,
        previousScore: 80,
        lastScanDate: new Date(),
        status: 'analyzing' as const,
        criticalIssues: 2,
        progress: 75
      }
    ];

    res.json({
      success: true,
      data: projects
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch recent projects'
    });
  }
});

// Priority issues endpoint
router.get('/priority-issues', async (req: Request, res: Response) => {
  try {
    const issues = [
      {
        id: '1',
        projectId: '1',
        projectName: 'Main Website',
        type: 'Core Web Vitals',
        severity: 'critical' as const,
        title: 'Large Content Layout Shift detected',
        affectedPages: 15,
        estimatedImpact: 'High',
        quickFix: true
      },
      {
        id: '2',
        projectId: '2',
        projectName: 'E-commerce Store',
        type: 'Meta Tags',
        severity: 'high' as const,
        title: 'Missing meta descriptions on product pages',
        affectedPages: 45,
        estimatedImpact: 'Medium',
        quickFix: false
      }
    ];

    res.json({
      success: true,
      data: issues
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch priority issues'
    });
  }
});

export default router; 