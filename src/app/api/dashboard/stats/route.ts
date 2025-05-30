import { NextRequest, NextResponse } from 'next/server';

interface DashboardStats {
  totalProjects: number;
  activeAnalyses: number;
  completedAnalyses: number;
  averageScore: number;
  scoreImprovement: number;
  weeklyIssues: number;
  resolvedIssues: number;
  criticalIssues: number;
  lastScanDate: string;
  
  scoreDistribution: {
    excellent: number;    // 80-100
    good: number;        // 60-79
    needsWork: number;   // 40-59
    poor: number;        // 0-39
  };
  
  scoreTrends: Array<{
    date: string;
    overallScore: number;
    technicalScore: number;
    contentScore: number;
    onPageScore: number;
    uxScore: number;
  }>;
  
  topProjects: Array<{
    id: string;
    name: string;
    score: number;
    improvement: number;
  }>;
  
  concerningProjects: Array<{
    id: string;
    name: string;
    score: number;
    criticalIssues: number;
  }>;
}

export async function GET(request: NextRequest) {
  try {
    // Get user from auth (implement your auth logic here)
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Mock data for testing - replace with real database queries later
    const stats: DashboardStats = {
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

    return NextResponse.json({
      success: true,
      data: stats,
      cached: false,
      message: "Dashboard statistics loaded successfully"
    });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    );
  }
} 