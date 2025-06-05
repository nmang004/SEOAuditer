"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { m } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Globe, 
  Calendar, 
  BarChart3, 
  TrendingUp, 
  Play, 
  ExternalLink,
  ArrowLeft,
  Settings,
  Share,
  Download,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap
} from "lucide-react";

interface ProjectData {
  id: string;
  name: string;
  url: string;
  createdAt: string;
  updatedAt: string;
  status?: string;
  analysesCount?: number;
  lastAnalysisDate?: string;
}

interface RecentActivity {
  id: string;
  projectId: string;
  projectName: string;
  type: 'scan' | 'issue' | 'update';
  title: string;
  description?: string;
  timestamp: string;
  severity?: 'info' | 'warning' | 'error';
}

export default function ProjectDashboardPage() {
  const params = useParams();
  const projectId = params?.projectId as string;
  const [project, setProject] = useState<ProjectData | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [activityLoading, setActivityLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchProjectData = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const isAdminBypass = token?.includes('admin-access-token');
      
      if (isAdminBypass) {
        // For admin users, load project data from localStorage
        console.log('[Project Detail] Loading project data for admin bypass user');
        const storedProjects = JSON.parse(localStorage.getItem('adminProjects') || '[]');
        const project = storedProjects.find((p: ProjectData) => p.id === projectId);
        
        if (project) {
          // Calculate analyses count and last analysis date from stored analyses
          const storedJobs = JSON.parse(localStorage.getItem('adminAnalysisJobs') || '[]');
          const projectAnalyses = storedJobs.filter((job: any) => job.projectId === projectId);
          
          const projectWithStats = {
            ...project,
            analysesCount: projectAnalyses.length,
            lastAnalysisDate: projectAnalyses.length > 0 
              ? projectAnalyses
                  .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
                  .createdAt
              : null,
            status: 'Active'
          };
          
          console.log('[Project Detail] Loaded project data from localStorage:', projectWithStats);
          setProject(projectWithStats);
          setLoading(false);
          return;
        } else {
          console.log('[Project Detail] Project not found in localStorage, creating fallback');
          // Create a fallback project if not found
          const fallbackProject: ProjectData = {
            id: projectId,
            name: `Project ${projectId.slice(-8)}`,
            url: 'https://example.com',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: 'Active',
            analysesCount: 0,
            lastAnalysisDate: null
          };
          setProject(fallbackProject);
          setLoading(false);
          return;
        }
      }
      
      const response = await fetch(`/api/projects/${projectId}`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch project data");
      }
      
      const result = await response.json();
      if (result.success) {
        setProject(result.data);
      } else {
        throw new Error(result.error || "Failed to load project");
      }
    } catch (err: unknown) {
      setError("Failed to load project data");
      console.error("Error fetching project:", err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const fetchRecentActivity = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const isAdminBypass = token?.includes('admin-access-token');
      
      if (isAdminBypass) {
        // For admin users, generate activity based on stored analyses
        console.log('[Project Detail] Loading recent activity for admin bypass user');
        const storedJobs = JSON.parse(localStorage.getItem('adminAnalysisJobs') || '[]');
        const projectAnalyses = storedJobs.filter((job: any) => job.projectId === projectId);
        
        const activities: RecentActivity[] = projectAnalyses
          .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 5)
          .map((job: any, index: number) => ({
            id: `activity-${job.jobId}`,
            projectId: projectId,
            projectName: `Project ${projectId.slice(-8)}`,
            type: 'scan' as const,
            title: `SEO Analysis Completed`,
            description: `Analysis of ${job.url} completed successfully`,
            timestamp: job.createdAt,
            severity: 'info' as const
          }));
        
        console.log('[Project Detail] Generated activities for admin user:', activities);
        setRecentActivity(activities);
        setActivityLoading(false);
        return;
      }
      
      const response = await fetch(`/api/dashboard/recent-activity?limit=5`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch recent activity");
      }
      
      const result = await response.json();
      if (result.success) {
        // Filter activities for the current project
        const projectActivities = result.data.filter((activity: RecentActivity) => 
          activity.projectId === projectId
        );
        setRecentActivity(projectActivities);
      }
    } catch (err: unknown) {
      console.error("Error fetching recent activity:", err);
      // Don't show error for activity, just show empty state
    } finally {
      setActivityLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchProjectData();
    fetchRecentActivity();
  }, [fetchProjectData, fetchRecentActivity]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatActivityDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return "Just now";
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      if (diffInDays < 7) {
        return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
      } else {
        return date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
      }
    }
  };

  const getActivityIcon = (type: string, severity?: string) => {
    if (type === 'scan') {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    } else if (type === 'issue') {
      return <AlertTriangle className={`h-4 w-4 ${severity === 'error' ? 'text-red-500' : 'text-yellow-500'}`} />;
    } else {
      return <Clock className="h-4 w-4 text-blue-500" />;
    }
  };

  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case 'error':
        return 'text-red-600';
      case 'warning':
        return 'text-yellow-600';
      default:
        return 'text-muted-foreground';
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="relative w-16 h-16 mx-auto mb-4">
              <div className="absolute inset-0 rounded-full border-4 border-gray-700"></div>
              <div className="absolute inset-0 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin"></div>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Loading Project</h2>
            <p className="text-gray-300">Please wait while we load your project data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="w-full max-w-md">
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 backdrop-blur-sm p-8 text-center">
              <div className="h-12 w-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="h-6 w-6 text-red-400" />
              </div>
              <h2 className="text-xl font-bold text-red-400 mb-2">Error Loading Project</h2>
              <p className="text-red-300 mb-6">{error || "Failed to load project data"}</p>
              <button 
                onClick={() => window.location.href = '/dashboard/projects'}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 mx-auto"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Projects
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => window.location.href = '/dashboard/projects'}
            className="border border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white p-2 rounded-lg transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              {project.name}
            </h1>
            <div className="flex items-center gap-2 mt-2">
              <Globe className="h-4 w-4 text-gray-400" />
              <a 
                href={project.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-indigo-400 transition-colors text-lg"
              >
                {project.url}
              </a>
              <ExternalLink className="h-3 w-3 text-gray-400" />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center rounded-full bg-green-500/10 border border-green-500/20 px-4 py-2 text-sm font-medium text-green-400">
            {project.status || "Active"}
          </div>
          <button className="border border-gray-600 text-gray-300 hover:bg-gray-700/50 hover:text-white px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </button>
        </div>
      </div>

      {/* Project Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-gray-700 bg-gray-800/50 backdrop-blur-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Total Analyses</p>
              <p className="text-2xl font-bold text-white">{project.analysesCount || 0}</p>
            </div>
            <BarChart3 className="h-5 w-5 text-indigo-400" />
          </div>
        </div>

        <div className="rounded-2xl border border-gray-700 bg-gray-800/50 backdrop-blur-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Created</p>
              <p className="text-sm font-medium text-gray-300">{formatDate(project.createdAt)}</p>
            </div>
            <Calendar className="h-5 w-5 text-green-400" />
          </div>
        </div>

        <div className="rounded-2xl border border-gray-700 bg-gray-800/50 backdrop-blur-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Last Analysis</p>
              <p className="text-sm font-medium text-gray-300">
                {project.lastAnalysisDate ? formatDate(project.lastAnalysisDate) : "Never"}
              </p>
            </div>
            <TrendingUp className="h-5 w-5 text-purple-400" />
          </div>
        </div>

        <div className="rounded-2xl border border-gray-700 bg-gray-800/50 backdrop-blur-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Status</p>
              <p className="text-sm font-medium text-green-400">{project.status || "Active"}</p>
            </div>
            <Globe className="h-5 w-5 text-blue-400" />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="rounded-2xl border border-gray-700 bg-gray-800/50 backdrop-blur-sm p-6">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <Zap className="h-5 w-5 text-indigo-400" />
          Quick Actions
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          <button 
            onClick={() => window.location.href = `/dashboard/projects/${projectId}/analyses/new`}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white h-20 rounded-xl font-medium transition-all flex flex-col items-center justify-center gap-2"
          >
            <Play className="h-6 w-6" />
            Start New Analysis
          </button>

          <button 
            onClick={() => window.location.href = `/dashboard/projects/${projectId}/analyses`}
            className="border border-gray-600 text-gray-300 hover:bg-gray-700/50 hover:text-white h-20 rounded-xl font-medium transition-all flex flex-col items-center justify-center gap-2"
          >
            <BarChart3 className="h-6 w-6" />
            View All Analyses
          </button>

          <button 
            onClick={() => window.location.href = `/dashboard/projects/${projectId}/trends`}
            className="border border-gray-600 text-gray-300 hover:bg-gray-700/50 hover:text-white h-20 rounded-xl font-medium transition-all flex flex-col items-center justify-center gap-2"
          >
            <TrendingUp className="h-6 w-6" />
            View Trends
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="rounded-2xl border border-gray-700 bg-gray-800/50 backdrop-blur-sm p-6">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <Clock className="h-5 w-5 text-green-400" />
          Recent Activity
        </h2>
        {activityLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse flex items-center gap-3">
                <div className="h-4 w-4 bg-gray-600 rounded-full"></div>
                <div className="flex-1 space-y-1">
                  <div className="h-3 bg-gray-600 rounded w-3/4"></div>
                  <div className="h-2 bg-gray-700 rounded w-1/2"></div>
                </div>
                <div className="h-2 bg-gray-700 rounded w-16"></div>
              </div>
            ))}
          </div>
        ) : recentActivity.length > 0 ? (
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 py-3 border-b border-gray-700/50 last:border-b-0">
                <div className="mt-0.5">
                  {getActivityIcon(activity.type, activity.severity)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-white truncate">{activity.title}</p>
                    <span className="text-xs text-gray-400 flex-shrink-0">
                      {formatActivityDate(activity.timestamp)}
                    </span>
                  </div>
                  {activity.description && (
                    <p className="text-sm text-gray-300 mt-1 truncate">
                      {activity.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="h-16 w-16 rounded-full bg-indigo-500/20 flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="h-8 w-8 text-indigo-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">No Recent Activity</h3>
            <p className="text-gray-300 mb-4">Start your first analysis to see activity here</p>
            <button 
              onClick={() => window.location.href = `/dashboard/projects/${projectId}/analyses/new`}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 mx-auto"
            >
              <Play className="h-4 w-4" />
              Start Analysis
            </button>
          </div>
        )}
      </div>

      {/* Project Information */}
      <div className="rounded-2xl border border-gray-700 bg-gray-800/50 backdrop-blur-sm p-6">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <Settings className="h-5 w-5 text-purple-400" />
          Project Information
        </h2>
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-gray-400">Project ID</label>
              <p className="font-mono text-sm bg-gray-700/50 border border-gray-600 p-3 rounded-lg mt-2 text-gray-300">{project.id}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-400">Last Updated</label>
              <p className="text-sm mt-2 text-gray-300 bg-gray-700/30 p-3 rounded-lg">{formatDate(project.updatedAt)}</p>
            </div>
          </div>
          
          <div className="border-t border-gray-700 pt-6">
            <div className="flex gap-3">
              <button className="border border-gray-600 text-gray-300 hover:bg-gray-700/50 hover:text-white px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2">
                <Share className="h-4 w-4" />
                Share Project
              </button>
              <button className="border border-gray-600 text-gray-300 hover:bg-gray-700/50 hover:text-white px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2">
                <Download className="h-4 w-4" />
                Export Data
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}