'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Search, Filter, Grid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';

interface Project {
  id: string;
  name: string;
  url: string;
  lastScanDate: string;
  currentScore: number;
  previousScore: number;
  criticalIssues: number;
  status: 'active' | 'paused' | 'analyzing';
  favicon?: string;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        // Mock data - replace with actual API call
        const mockProjects: Project[] = [
          {
            id: 'proj-1',
            name: 'Example.com',
            url: 'https://example.com',
            lastScanDate: '2024-01-15',
            currentScore: 85,
            previousScore: 78,
            criticalIssues: 3,
            status: 'active',
            favicon: 'https://www.google.com/s2/favicons?domain=example.com'
          },
          {
            id: 'proj-2',
            name: 'Test Site',
            url: 'https://test-site.com',
            lastScanDate: '2024-01-14',
            currentScore: 72,
            previousScore: 75,
            criticalIssues: 8,
            status: 'analyzing',
            favicon: 'https://www.google.com/s2/favicons?domain=test-site.com'
          }
        ];
        
        setTimeout(() => {
          setProjects(mockProjects);
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Error fetching projects:', error);
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.url.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-28" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Projects</h1>
          <p className="text-muted-foreground">
            Manage your SEO projects and track their performance
          </p>
        </div>
        <Link href="/dashboard/projects/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Button>
        </Link>
      </div>

      {/* Filters and Search */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Projects Grid/List */}
      {filteredProjects.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">No projects found</p>
          <Link href="/dashboard/projects/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Project
            </Button>
          </Link>
        </div>
      ) : (
        <motion.div
          className={`grid gap-6 ${
            viewMode === 'grid' 
              ? 'md:grid-cols-2 lg:grid-cols-3' 
              : 'grid-cols-1'
          }`}
          layout
        >
          {filteredProjects.map((project, index) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Link href={`/projects/${project.id}`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader className="flex flex-row items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                      {project.favicon ? (
                        <img 
                          src={project.favicon} 
                          alt={`${project.name} favicon`}
                          className="w-6 h-6"
                        />
                      ) : (
                        <div className="w-6 h-6 bg-primary/20 rounded" />
                      )}
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg">{project.name}</CardTitle>
                      <CardDescription>{project.url}</CardDescription>
                    </div>
                    <Badge 
                      variant={
                        project.status === 'active' ? 'default' :
                        project.status === 'analyzing' ? 'secondary' : 'outline'
                      }
                    >
                      {project.status}
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">SEO Score</p>
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-bold">{project.currentScore}</span>
                          <Badge 
                            variant={project.currentScore > project.previousScore ? 'default' : 'destructive'}
                          >
                            {project.currentScore > project.previousScore ? '+' : ''}
                            {project.currentScore - project.previousScore}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Critical Issues</p>
                        <span className="text-2xl font-bold text-destructive">{project.criticalIssues}</span>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-xs text-muted-foreground">
                        Last scan: {new Date(project.lastScanDate).toLocaleDateString()}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
} 