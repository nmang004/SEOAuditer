// API contract and authentication updated to match backend (2024-06-01)
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
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

  // Debug logging
  console.log('ProjectsListPage render:', { 
    projects: projects.length, 
    isCreating, 
    filteredProjects: projects.filter(project =>
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.url.toLowerCase().includes(searchTerm.toLowerCase())
    ).length 
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      console.log('Fetching projects...');
      const token = localStorage.getItem("token");
      const response = await fetch("/api/projects", {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      
      console.log('Projects API response:', response.status, response.statusText);
      const result = await response.json();
      console.log('Projects API result:', result);
      
      if (result.success && Array.isArray(result.data)) {
        setProjects(result.data);
      } else {
        console.log('Invalid response format, setting empty array');
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

  // Error boundary fallback
  try {
    return (
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            Projects
          </h1>
          <p className="text-gray-300 mt-2 text-lg">
            Manage and monitor your website analysis projects
          </p>
        </div>
        <Button 
          onClick={() => setIsCreating(true)} 
          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white border-0 h-12 text-base px-6 flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          New Project
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-400 focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>
        <Button className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white bg-transparent flex items-center gap-2">
          <Filter className="h-4 w-4" />
          Filter
        </Button>
      </div>

      {/* Create Project Form */}
      {isCreating && (
        <div className="animate-in slide-in-from-top-2 duration-300">
          <Card className="rounded-2xl border border-gray-700 bg-gray-800/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                Create New Project
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateProject} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="name" className="text-sm font-medium text-gray-300">
                      Project Name
                    </label>
                    <Input
                      id="name"
                      type="text"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      placeholder="Enter project name"
                      className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-400 focus:border-indigo-500 focus:ring-indigo-500"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="url" className="text-sm font-medium text-gray-300">
                      Website URL
                    </label>
                    <Input
                      id="url"
                      type="url"
                      value={projectUrl}
                      onChange={(e) => setProjectUrl(e.target.value)}
                      placeholder="https://example.com"
                      className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-400 focus:border-indigo-500 focus:ring-indigo-500"
                      required
                    />
                  </div>
                </div>
                
                {error && (
                  <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-md p-3">
                    {error}
                  </div>
                )}
                
                <div className="flex gap-2">
                  <Button 
                    type="submit" 
                    disabled={loading}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white border-0"
                  >
                    {loading ? "Creating..." : "Create Project"}
                  </Button>
                  <Button 
                    type="button" 
                    className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white bg-transparent"
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
        </div>
      )}

      {/* Projects Grid */}
      <div className="grid gap-6">
        {filteredProjects.length === 0 && !isCreating ? (
          <div className="flex items-center justify-center min-h-[500px] py-16">
            <div className="relative w-full max-w-2xl">
              {/* Animated background gradient */}
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-3xl blur-xl -z-10 animate-pulse"></div>
              
              <div className="rounded-2xl border border-gray-700 bg-gray-800/50 backdrop-blur-sm p-12 text-center">
                {/* Icon */}
                <div className="mb-6 flex justify-center">
                  <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-r from-indigo-500/20 to-purple-500/20 backdrop-blur-sm border border-indigo-500/30">
                    <Globe className="h-8 w-8 text-indigo-400" />
                  </div>
                </div>
                
                {/* Content */}
                <h3 className="text-2xl font-bold text-white mb-3 bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                  No Projects Yet
                </h3>
                <p className="text-gray-300 mb-8 text-lg leading-relaxed">
                  Get started by creating your first project to analyze your website's SEO performance and track improvements over time.
                </p>
                
                {/* Primary Action */}
                <Button 
                  onClick={() => setIsCreating(true)} 
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white border-0 h-12 text-base px-8"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Project
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredProjects.map((project) => (
              <div
                key={project.id}
                className="h-full animate-in fade-in-0 slide-in-from-bottom-4 duration-300"
              >
                <Card className="h-full rounded-2xl border border-gray-700 bg-gray-800/50 backdrop-blur-sm hover:border-gray-600 transition-all cursor-pointer group hover:scale-105">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg truncate text-white group-hover:text-indigo-400 transition-colors">
                          {project.name || "Untitled Project"}
                        </h3>
                        <p className="text-sm text-gray-400 flex items-center gap-1 mt-1">
                          <Globe className="h-3 w-3" />
                          <span className="truncate">{project.url}</span>
                        </p>
                      </div>
                      <Badge className="ml-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                        {project.status || "Active"}
                      </Badge>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Created
                        </span>
                        <span className="text-gray-300">{formatDate(project.createdAt)}</span>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400 flex items-center gap-1">
                          <BarChart3 className="h-3 w-3" />
                          Analyses
                        </span>
                        <span className="text-gray-300">{project.analysesCount || 0}</span>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-6">
                      <Button 
                        asChild 
                        size="sm" 
                        className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white border-0"
                      >
                        <Link href={`/dashboard/projects/${project.id}`} className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          View
                        </Link>
                      </Button>
                      
                      <Button 
                        asChild 
                        size="sm" 
                        className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white bg-transparent"
                      >
                        <Link href={`/dashboard/projects/${project.id}/analyses/new`} className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          Analyze
                        </Link>
                      </Button>
                      
                      <Button 
                        asChild 
                        size="sm"
                        className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white bg-transparent"
                      >
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
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stats Summary */}
      {filteredProjects.length > 0 && (
        <div className="border-t border-gray-700 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-indigo-400">{filteredProjects.length}</div>
              <div className="text-sm text-gray-400">Total Projects</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-400">
                {filteredProjects.reduce((acc, p) => acc + (p.analysesCount || 0), 0)}
              </div>
              <div className="text-sm text-gray-400">Total Analyses</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-pink-400">
                {filteredProjects.filter(p => p.status === "Active").length}
              </div>
              <div className="text-sm text-gray-400">Active Projects</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
  } catch (error) {
    console.error('ProjectsListPage error:', error);
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-4">Something went wrong</h1>
            <p className="text-gray-300 mb-4">There was an error loading the projects page.</p>
            <Button 
              onClick={() => window.location.reload()} 
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white border-0"
            >
              Reload Page
            </Button>
          </div>
        </div>
      </div>
    );
  }
} 