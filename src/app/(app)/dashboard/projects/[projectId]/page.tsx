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
  Clock
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
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-32 bg-muted rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="text-center py-12">
        <div className="text-destructive mb-4">{error}</div>
        <Button asChild variant="outline">
          <Link href="/dashboard/projects">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Projects
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-start gap-4">
          <Button asChild variant="ghost" size="sm">
            <Link href="/dashboard/projects">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <a 
                href={project.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {project.url}
              </a>
              <ExternalLink className="h-3 w-3 text-muted-foreground" />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">
            {project.status || "Active"}
          </Badge>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Project Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total Analyses</p>
                <p className="text-2xl font-bold">{project.analysesCount || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="text-sm font-medium">{formatDate(project.createdAt)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Last Analysis</p>
                <p className="text-sm font-medium">
                  {project.lastAnalysisDate ? formatDate(project.lastAnalysisDate) : "Never"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="text-sm font-medium">{project.status || "Active"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <m.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button asChild className="w-full h-20 flex flex-col gap-2">
                <Link href={`/dashboard/projects/${projectId}/analyses/new`}>
                  <Play className="h-6 w-6" />
                  Start New Analysis
                </Link>
              </Button>
            </m.div>

            <m.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button asChild variant="outline" className="w-full h-20 flex flex-col gap-2">
                <Link href={`/dashboard/projects/${projectId}/analyses`}>
                  <BarChart3 className="h-6 w-6" />
                  View All Analyses
                </Link>
              </Button>
            </m.div>

            <m.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button asChild variant="outline" className="w-full h-20 flex flex-col gap-2">
                <Link href={`/dashboard/projects/${projectId}/trends`}>
                  <TrendingUp className="h-6 w-6" />
                  View Trends
                </Link>
              </Button>
            </m.div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {activityLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse flex items-center gap-3">
                  <div className="h-4 w-4 bg-muted rounded-full"></div>
                  <div className="flex-1 space-y-1">
                    <div className="h-3 bg-muted rounded w-3/4"></div>
                    <div className="h-2 bg-muted rounded w-1/2"></div>
                  </div>
                  <div className="h-2 bg-muted rounded w-16"></div>
                </div>
              ))}
            </div>
          ) : recentActivity.length > 0 ? (
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 py-2">
                  <div className="mt-0.5">
                    {getActivityIcon(activity.type, activity.severity)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">{activity.title}</p>
                      <span className={`text-xs ${getSeverityColor(activity.severity)}`}>
                        {formatActivityDate(activity.timestamp)}
                      </span>
                    </div>
                    {activity.description && (
                      <p className="text-sm text-muted-foreground mt-1 truncate">
                        {activity.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No recent activity</p>
              <p className="text-sm">Start your first analysis to see activity here</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Project Information */}
      <Card>
        <CardHeader>
          <CardTitle>Project Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Project ID</label>
              <p className="font-mono text-sm bg-muted p-2 rounded mt-1">{project.id}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
              <p className="text-sm mt-1">{formatDate(project.updatedAt)}</p>
            </div>
          </div>
          
          <Separator />
          
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Share className="h-4 w-4 mr-2" />
              Share Project
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}