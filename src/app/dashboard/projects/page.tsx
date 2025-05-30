// API contract and authentication updated to match backend (2024-06-01)
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { m } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  ExternalLink, 
  Globe, 
  Calendar, 
  BarChart3, 
  TrendingUp, 
  Eye,
  Search,
  Filter
} from "lucide-react";

interface Project {
  id: string;
  name: string;
  url: string;
  createdAt: string;
  updatedAt: string;
  analysesCount?: number;
  status?: string;
}

export default function ProjectsListPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectName, setProjectName] = useState("");
  const [projectUrl, setProjectUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/projects", {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const result = await response.json();
      
      if (result.success && Array.isArray(result.data)) {
        setProjects(result.data);
      } else {
        setProjects([]);
      }
    } catch (err: unknown) {
      console.error("Failed to fetch projects:", err);
      setProjects([]);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim() || !projectUrl.trim()) return;
    
    setLoading(true);
    setError("");
    
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ name: projectName, url: projectUrl }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        setError(result.error || "Failed to create project");
        return;
      }
      
      setProjects([result.data, ...projects]);
      setProjectName("");
      setProjectUrl("");
      setIsCreating(false);
    } catch (err: unknown) {
      setError("Failed to create project");
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.url.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">
            Manage and monitor your website analysis projects
          </p>
        </div>
        <Button onClick={() => setIsCreating(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New Project
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" size="default" className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          Filter
        </Button>
      </div>

      {/* Create Project Form */}
      {isCreating && (
        <m.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="overflow-hidden"
        >
          <Card>
            <CardHeader>
              <CardTitle>Create New Project</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateProject} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="name" className="text-sm font-medium">
                      Project Name
                    </label>
                    <Input
                      id="name"
                      type="text"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      placeholder="Enter project name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="url" className="text-sm font-medium">
                      Website URL
                    </label>
                    <Input
                      id="url"
                      type="url"
                      value={projectUrl}
                      onChange={(e) => setProjectUrl(e.target.value)}
                      placeholder="https://example.com"
                      required
                    />
                  </div>
                </div>
                
                {error && (
                  <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-3">
                    {error}
                  </div>
                )}
                
                <div className="flex gap-2">
                  <Button type="submit" disabled={loading}>
                    {loading ? "Creating..." : "Create Project"}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setIsCreating(false);
                      setProjectName("");
                      setProjectUrl("");
                      setError("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </m.div>
      )}

      {/* Projects Grid */}
      <div className="grid gap-6">
        {filteredProjects.length === 0 && !isCreating ? (
          <div className="text-center py-12">
            <div className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4">
              <Globe className="h-full w-full" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
            <p className="text-muted-foreground mb-4">
              Get started by creating your first project to analyze your website's SEO performance.
            </p>
            <Button onClick={() => setIsCreating(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create Your First Project
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredProjects.map((project) => (
              <m.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                whileHover={{ y: -2 }}
                className="h-full"
              >
                <Card className="h-full hover:shadow-md transition-shadow cursor-pointer group">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg truncate group-hover:text-primary transition-colors">
                          {project.name || "Untitled Project"}
                        </h3>
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                          <Globe className="h-3 w-3" />
                          <span className="truncate">{project.url}</span>
                        </p>
                      </div>
                      <Badge variant="secondary" className="ml-2">
                        {project.status || "Active"}
                      </Badge>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Created
                        </span>
                        <span>{formatDate(project.createdAt)}</span>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <BarChart3 className="h-3 w-3" />
                          Analyses
                        </span>
                        <span>{project.analysesCount || 0}</span>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-6">
                      <Button asChild size="sm" className="flex-1">
                        <Link href={`/dashboard/projects/${project.id}`} className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          View
                        </Link>
                      </Button>
                      
                      <Button asChild variant="outline" size="sm" className="flex-1">
                        <Link href={`/dashboard/projects/${project.id}/analyses/new`} className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          Analyze
                        </Link>
                      </Button>
                      
                      <Button asChild variant="ghost" size="sm">
                        <a 
                          href={project.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-1"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </m.div>
            ))}
          </div>
        )}
      </div>

      {/* Stats Summary */}
      {filteredProjects.length > 0 && (
        <div className="border-t pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold">{filteredProjects.length}</div>
              <div className="text-sm text-muted-foreground">Total Projects</div>
            </div>
            <div>
              <div className="text-2xl font-bold">
                {filteredProjects.reduce((acc, p) => acc + (p.analysesCount || 0), 0)}
              </div>
              <div className="text-sm text-muted-foreground">Total Analyses</div>
            </div>
            <div>
              <div className="text-2xl font-bold">
                {filteredProjects.filter(p => p.status === "Active").length}
              </div>
              <div className="text-sm text-muted-foreground">Active Projects</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 