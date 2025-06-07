import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

type BreadcrumbItem = {
  label: string;
  href: string;
  active?: boolean;
};

interface ProjectData {
  id: string;
  name: string;
}

interface AnalysisData {
  id: string;
  url: string;
}

export function Breadcrumb() {
  const pathname = usePathname();
  const params = useParams();
  const [projectData, setProjectData] = useState<ProjectData | null>(null);
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  
  // Fetch project and analysis data when params change
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch project data if projectId exists
        if (params.projectId) {
          // Mock data - replace with actual API call
          setProjectData({
            id: params.projectId as string,
            name: `Project ${(params.projectId as string).slice(0, 8)}...`
          });
        }
        
        // Fetch analysis data if analysisId exists
        if (params.analysisId) {
          // Mock data - replace with actual API call
          setAnalysisData({
            id: params.analysisId as string,
            url: `Analysis ${(params.analysisId as string).slice(0, 8)}...`
          });
        }
      } catch (error) {
        console.error('Error fetching breadcrumb data:', error);
      }
    };

    fetchData();
  }, [params.projectId, params.analysisId]);
  
  const getBreadcrumbs = (): BreadcrumbItem[] => {
    const segments = pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [];
    
    // Always start with dashboard for authenticated routes
    if (!pathname.startsWith('/login') && !pathname.startsWith('/register') && pathname !== '/') {
      breadcrumbs.push({
        label: 'Dashboard',
        href: '/dashboard',
        active: segments.length === 1 && segments[0] === 'dashboard'
      });
    }
    
    // Build breadcrumbs based on URL structure
    let currentPath = '';
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      currentPath += `/${segment}`;
      const isLast = i === segments.length - 1;
      
      switch (segment) {
        case 'dashboard':
          // Skip dashboard as it's already added
          break;
          
        case 'projects':
          if (segments.includes('projects') && !params.projectId) {
            breadcrumbs.push({
              label: 'Projects',
              href: '/dashboard/projects',
              active: isLast
            });
          }
          break;
          
        case 'analyses':
          if (segments.includes('projects') && params.projectId) {
            // Project-specific analyses
            breadcrumbs.push({
              label: 'Analyses',
              href: `/projects/${params.projectId}/analyses`,
              active: isLast
            });
          } else {
            // Global analyses
            breadcrumbs.push({
              label: 'Analyses',
              href: '/analyses',
              active: isLast
            });
          }
          break;
          
        case 'issues':
          if (segments.includes('projects') && params.projectId) {
            breadcrumbs.push({
              label: 'Issues',
              href: `/projects/${params.projectId}/issues`,
              active: isLast
            });
          } else if (segments.includes('analyses') && params.analysisId) {
            breadcrumbs.push({
              label: 'Issues',
              href: `/analyses/${params.analysisId}/issues`,
              active: isLast
            });
          } else {
            breadcrumbs.push({
              label: 'Issues',
              href: '/issues',
              active: isLast
            });
          }
          break;
          
        case 'search':
          breadcrumbs.push({
            label: 'Search',
            href: '/search',
            active: isLast
          });
          break;
          
        case 'settings':
          if (segments.includes('projects') && params.projectId) {
            breadcrumbs.push({
              label: 'Settings',
              href: `/projects/${params.projectId}/settings`,
              active: isLast
            });
          } else {
            breadcrumbs.push({
              label: 'Settings',
              href: '/dashboard/settings',
              active: isLast
            });
          }
          break;
          
        case 'new':
          if (segments.includes('analyses')) {
            breadcrumbs.push({
              label: 'New Analysis',
              href: currentPath,
              active: isLast
            });
          } else if (segments.includes('projects')) {
            breadcrumbs.push({
              label: 'New Project',
              href: currentPath,
              active: isLast
            });
          }
          break;
          
        // Analysis tabs
        case 'overview':
        case 'technical':
        case 'content':
        case 'onpage':
        case 'performance':
        case 'recommendations':
        case 'history':
        case 'export':
          breadcrumbs.push({
            label: segment.charAt(0).toUpperCase() + segment.slice(1),
            href: currentPath,
            active: isLast
          });
          break;
          
        // Dynamic segments
        default:
          if (params.projectId === segment && projectData) {
            breadcrumbs.push({
              label: projectData.name,
              href: `/projects/${segment}`,
              active: isLast
            });
          } else if (params.analysisId === segment && analysisData) {
            const href = segments.includes('projects') && params.projectId
              ? `/projects/${params.projectId}/analyses/${segment}`
              : `/analyses/${segment}`;
            breadcrumbs.push({
              label: analysisData.url,
              href,
              active: isLast
            });
          }
          break;
      }
    }
    
    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <nav className="flex items-center text-sm" aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2">
        <li>
          <Link href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
            <Home className="h-4 w-4" />
            <span className="sr-only">Dashboard</span>
          </Link>
        </li>
        {breadcrumbs.map((breadcrumb, index) => (
          <li key={breadcrumb.href} className="flex items-center">
            <ChevronRight className="h-4 w-4 text-muted-foreground mx-2" />
            <Link
              href={breadcrumb.href}
              className={cn(
                "text-sm font-medium transition-colors hover:text-foreground",
                breadcrumb.active
                  ? "text-foreground"
                  : "text-muted-foreground"
              )}
              aria-current={breadcrumb.active ? 'page' : undefined}
            >
              {breadcrumb.label}
            </Link>
          </li>
        ))}
      </ol>
    </nav>
  );
}
