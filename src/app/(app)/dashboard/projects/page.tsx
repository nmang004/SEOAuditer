// API contract and authentication updated to match backend (2024-06-01)
"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
      console.log('[Projects] Fetching projects with token:', token ? 'present' : 'missing');
      
      // Check if using admin bypass token
      const isAdminBypass = token?.includes('admin-access-token');
      console.log('[Projects] Is admin bypass:', isAdminBypass);
      
      if (isAdminBypass) {
        // For admin bypass, use localStorage and calculate analysis counts
        const adminProjectsData = localStorage.getItem('adminProjects');
        const adminProjects = adminProjectsData ? JSON.parse(adminProjectsData) : [];
        
        // Load analysis jobs to calculate counts
        const adminAnalysisJobs = JSON.parse(localStorage.getItem('adminAnalysisJobs') || '[]');
        
        // Update projects with current analysis counts
        const projectsWithCounts = adminProjects.map((project: Project) => {
          const projectAnalyses = adminAnalysisJobs.filter((job: any) => job.projectId === project.id);
          return {
            ...project,
            analysesCount: projectAnalyses.length
          };
        });
        
        console.log('[Projects] Loaded admin projects from localStorage:', projectsWithCounts.length);
        console.log('[Projects] Analysis counts updated for projects:', projectsWithCounts.map((p: Project) => ({ id: p.id, name: p.name, count: p.analysesCount })));
        setProjects(projectsWithCounts);
        return;
      }
      
      const response = await fetch("/api/projects", {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      
      const result = await response.json();
      console.log('[Projects] Fetch response:', { 
        success: result.success, 
        dataLength: result.data?.length || 0,
        source: result.source || 'backend',
        data: result.data 
      });
      
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
      console.log('[Projects] Creating project with token:', token ? 'present' : 'missing');
      console.log('[Projects] Project data:', { name: projectName, url: projectUrl });
      
      // Check if using admin bypass token
      const isAdminBypass = token?.includes('admin-access-token');
      console.log('[Projects] Is admin bypass for create:', isAdminBypass);
      
      if (isAdminBypass) {
        // For admin bypass, create project locally
        const newProject = {
          id: 'admin-' + Math.random().toString(36).substr(2, 9),
          name: projectName,
          url: projectUrl,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          analysesCount: 0,
          status: 'Active'
        };
        
        // Save to localStorage
        const adminProjectsData = localStorage.getItem('adminProjects');
        const adminProjects = adminProjectsData ? JSON.parse(adminProjectsData) : [];
        const updatedProjects = [newProject, ...adminProjects];
        localStorage.setItem('adminProjects', JSON.stringify(updatedProjects));
        
        console.log('[Projects] Admin project created and saved to localStorage:', newProject);
        console.log('[Projects] Total admin projects:', updatedProjects.length);
        
        // Update state
        setProjects(updatedProjects);
        
        // Clear form and close it
        setProjectName("");
        setProjectUrl("");
        setIsCreating(false);
        setError("");
        
        return;
      }
      
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ name: projectName, url: projectUrl }),
      });
      
      const result = await response.json();
      console.log('[Projects] Create response:', { 
        ok: response.ok, 
        success: result.success, 
        source: result.source || 'backend',
        project: result.data 
      });
      
      if (!response.ok || !result.success) {
        setError(result.error || "Failed to create project");
        return;
      }
      
      // Add the new project to the beginning of the projects array
      const newProject = result.data;
      console.log('[Projects] Adding new project to state:', newProject);
      setProjects(prevProjects => [newProject, ...prevProjects]);
      
      // Clear form and close it
      setProjectName("");
      setProjectUrl("");
      setIsCreating(false);
      setError("");
      
      console.log("Project created successfully:", newProject);
    } catch (err: unknown) {
      console.error("Error creating project:", err);
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
    <div className="space-y-8">
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

      {isCreating && (
        <div className="rounded-2xl border border-gray-700 bg-gray-800/50 backdrop-blur-sm p-6">
          <h3 className="text-xl font-bold mb-6 text-white bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            Create New Project
          </h3>
          
          <form onSubmit={handleCreateProject} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium text-gray-300">
                  Project Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="Enter project name"
                  className="w-full p-3 rounded-lg bg-gray-700/50 border border-gray-600 text-white placeholder:text-gray-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-colors"
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="url" className="text-sm font-medium text-gray-300">
                  Website URL
                </label>
                <input
                  id="url"
                  type="url"
                  value={projectUrl}
                  onChange={(e) => setProjectUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full p-3 rounded-lg bg-gray-700/50 border border-gray-600 text-white placeholder:text-gray-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-colors"
                  required
                />
              </div>
            </div>
            
            {error && (
              <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                {error}
              </div>
            )}
            
            <div className="flex gap-3 pt-2">
              <button 
                type="submit" 
                disabled={loading}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Creating..." : "Create Project"}
              </button>
              <button 
                type="button" 
                className="border border-gray-600 text-gray-300 hover:bg-gray-700/50 hover:text-white px-6 py-3 rounded-lg font-medium transition-all"
                onClick={() => {
                  setIsCreating(false);
                  setProjectName("");
                  setProjectUrl("");
                  setError("");
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid gap-6">
        {filteredProjects.length === 0 && !isCreating ? (
          <div className="flex items-center justify-center min-h-[500px] py-16">
            <div className="relative w-full max-w-2xl">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-3xl blur-xl -z-10 animate-pulse"></div>
              
              <div className="rounded-2xl border border-gray-700 bg-gray-800/50 backdrop-blur-sm p-12 text-center">
                <div className="mb-6 flex justify-center">
                  <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-r from-indigo-500/20 to-purple-500/20 backdrop-blur-sm border border-indigo-500/30">
                    <Globe className="h-8 w-8 text-indigo-400" />
                  </div>
                </div>
                
                <h3 className="text-2xl font-bold text-white mb-3 bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                  No Projects Yet
                </h3>
                <p className="text-gray-300 mb-8 text-lg leading-relaxed">
                  Get started by creating your first project to analyze your website's SEO performance and track improvements over time.
                </p>
                
                <button 
                  onClick={() => setIsCreating(true)} 
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white border-0 h-12 text-base px-8 rounded-lg font-medium transition-all"
                >
                  <Plus className="h-4 w-4 mr-2 inline" />
                  Create Your First Project
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredProjects.map((project) => (
              <div key={project.id} className="h-full">
                <div className="h-full rounded-2xl border border-gray-700 bg-gray-800/50 backdrop-blur-sm hover:border-gray-600 transition-all cursor-pointer group hover:scale-105 p-6">
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
                    <div className="ml-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-2 py-1 rounded text-xs">
                      {project.status || "Active"}
                    </div>
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
                    <a 
                      href={`/dashboard/projects/${project.id}`}
                      className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white border-0 px-3 py-2 rounded text-sm text-center flex items-center justify-center gap-1"
                    >
                      <Eye className="h-3 w-3" />
                      View
                    </a>
                    
                    <a 
                      href={`/dashboard/projects/${project.id}/analyses/new`}
                      className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white bg-transparent border px-3 py-2 rounded text-sm text-center flex items-center justify-center gap-1"
                    >
                      <TrendingUp className="h-3 w-3" />
                      Analyze
                    </a>
                    
                    <a 
                      href={project.url}
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white bg-transparent border px-3 py-2 rounded text-sm flex items-center justify-center gap-1"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

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
}