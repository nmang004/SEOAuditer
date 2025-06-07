'use client';

import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
// import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Folder, 
  Globe, 
  ChevronDown, 
  ChevronUp,
  Sparkles,
  Clock,
  CreditCard,
  AlertCircle,
  Check,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Types
export interface CrawlConfiguration {
  crawlType: 'single' | 'subfolder' | 'domain';
  startUrl: string;
  depth: number;
  maxPages: number;
  filters: {
    includePatterns: string[];
    excludePatterns: string[];
    fileTypes: string[];
    respectRobotsTxt: boolean;
    followExternal: boolean;
    analyzeSubdomains: boolean;
  };
  performance: {
    concurrent: number;
    delayBetweenRequests: number;
    timeout: number;
  };
  analysis: {
    skipDuplicateContent: boolean;
    groupSimilarPages: boolean;
    priorityPages: string[];
  };
}

interface CrawlEstimate {
  pages: number;
  time: string;
  credits: number;
}

// Crawl Type Card Component
function CrawlTypeCard({
  type,
  title,
  description,
  icon,
  selected,
  features,
  onClick
}: {
  type: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  selected: boolean;
  features?: string[];
  onClick: () => void;
}) {
  return (
    <Card
      className={cn(
        "p-6 cursor-pointer transition-all duration-200 hover:shadow-lg",
        "border-2 min-h-[120px] opacity-100 visible relative",
        selected 
          ? "border-indigo-500 bg-indigo-500/5" 
          : "border-gray-700 hover:border-gray-600 bg-gray-800/50"
      )}
      onClick={onClick}
    >
      <div className="flex items-start gap-4">
        <div className={cn(
          "p-3 rounded-lg",
          selected ? "bg-indigo-500/20" : "bg-gray-700/50"
        )}>
          <div className={selected ? "text-indigo-400" : "text-gray-400"}>
            {icon}
          </div>
        </div>
        <div className="flex-1">
          <div className="text-xs text-red-500 font-bold">CARD: {title}</div>
          <h4 className="font-semibold text-white mb-1">{title}</h4>
          <p className="text-sm text-gray-400 mb-3">{description}</p>
          {features && (
            <ul className="space-y-1">
              {features.map((feature, idx) => (
                <li key={idx} className="text-xs text-gray-500 flex items-center gap-1">
                  <Check className="h-3 w-3 text-green-400" />
                  {feature}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Card>
  );
}

// Tag Input Component
function TagInput({
  tags,
  onTagsChange,
  placeholder
}: {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  placeholder: string;
}) {
  const [input, setInput] = useState('');

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && input) {
      e.preventDefault();
      if (!tags.includes(input)) {
        onTagsChange([...tags, input]);
      }
      setInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    onTagsChange(tags.filter(tag => tag !== tagToRemove));
  };

  return (
    <div className="space-y-2">
      <Input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="bg-gray-900/50 border-gray-700 text-white"
      />
      <div className="flex flex-wrap gap-2">
        {tags.map((tag, idx) => (
          <Badge
            key={idx}
            variant="secondary"
            className="bg-gray-700 text-gray-300 hover:bg-gray-600"
          >
            {tag}
            <button
              onClick={() => removeTag(tag)}
              className="ml-2 hover:text-white"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
    </div>
  );
}

// Preset Button Component
function PresetButton({ 
  children, 
  onClick 
}: { 
  children: React.ReactNode; 
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors"
    >
      {children}
    </button>
  );
}

// Crawl Estimation Component
function CrawlEstimation({ config }: { config: CrawlConfiguration }) {
  const estimate = useMemo<CrawlEstimate>(() => {
    let pages = 1;
    let minutes = 1;
    
    if (config.crawlType === 'subfolder') {
      pages = Math.min(config.maxPages, 10 * config.depth);
      minutes = Math.ceil(pages * 0.5);
    } else if (config.crawlType === 'domain') {
      pages = Math.min(config.maxPages, 50 * config.depth);
      minutes = Math.ceil(pages * 0.5);
    }
    
    const credits = Math.ceil(pages * 0.1);
    const time = minutes < 60 
      ? `~${minutes} minutes` 
      : `~${Math.ceil(minutes / 60)} hours`;
    
    return { pages, time, credits };
  }, [config]);
  
  return (
    <Card className="bg-indigo-500/10 border border-indigo-500/20 p-4">
      <h4 className="font-medium text-indigo-400 mb-3 flex items-center gap-2">
        <Sparkles className="h-4 w-4" />
        Crawl Estimation
      </h4>
      <div className="grid grid-cols-3 gap-4 text-sm">
        <div>
          <div className="flex items-center gap-1 text-indigo-300 mb-1">
            <FileText className="h-4 w-4" />
            <span>Estimated Pages:</span>
          </div>
          <span className="text-lg font-semibold text-white">{estimate.pages}</span>
        </div>
        <div>
          <div className="flex items-center gap-1 text-indigo-300 mb-1">
            <Clock className="h-4 w-4" />
            <span>Time Required:</span>
          </div>
          <span className="text-lg font-semibold text-white">{estimate.time}</span>
        </div>
        <div>
          <div className="flex items-center gap-1 text-indigo-300 mb-1">
            <CreditCard className="h-4 w-4" />
            <span>Credits Used:</span>
          </div>
          <span className="text-lg font-semibold text-white">{estimate.credits}</span>
        </div>
      </div>
    </Card>
  );
}

// Main Component
export function EnhancedAnalysisConfigurator({
  onStartAnalysis
}: {
  onStartAnalysis: (config: CrawlConfiguration) => void;
}) {
  const [config, setConfig] = useState<CrawlConfiguration>({
    crawlType: 'single',
    startUrl: '',
    depth: 3,
    maxPages: 50,
    filters: {
      includePatterns: [],
      excludePatterns: [],
      fileTypes: ['html', 'htm', 'php', 'asp', 'aspx'],
      respectRobotsTxt: true,
      followExternal: false,
      analyzeSubdomains: false,
    },
    performance: {
      concurrent: 3,
      delayBetweenRequests: 1000,
      timeout: 30000,
    },
    analysis: {
      skipDuplicateContent: true,
      groupSimilarPages: true,
      priorityPages: [],
    },
  });

  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleUrlChange = (url: string) => {
    setConfig({ ...config, startUrl: url });
  };

  const getPlaceholder = (type: string) => {
    switch (type) {
      case 'single':
        return 'https://example.com/page';
      case 'subfolder':
        return 'https://example.com/blog/';
      case 'domain':
        return 'https://example.com';
      default:
        return 'Enter URL';
    }
  };

  const getCrawlPreview = (cfg: CrawlConfiguration) => {
    if (!cfg.startUrl) return 'Enter a URL to see crawl preview';
    
    try {
      const url = new URL(cfg.startUrl);
      switch (cfg.crawlType) {
        case 'subfolder':
          return `All pages under ${url.pathname}*`;
        case 'domain':
          return `All pages on ${url.hostname}`;
        default:
          return `Only ${url.href}`;
      }
    } catch {
      return 'Invalid URL';
    }
  };

  const updateFilters = (key: keyof CrawlConfiguration['filters'], value: any) => {
    setConfig({
      ...config,
      filters: {
        ...config.filters,
        [key]: value
      }
    });
  };

  const applyPreset = (preset: string) => {
    switch (preset) {
      case 'blog':
        updateFilters('includePatterns', ['/blog/*', '/posts/*', '/articles/*']);
        updateFilters('excludePatterns', ['/tag/*', '/category/*', '/author/*']);
        break;
      case 'products':
        updateFilters('includePatterns', ['/products/*', '/shop/*', '/catalog/*']);
        updateFilters('excludePatterns', ['/cart/*', '/checkout/*']);
        break;
      case 'docs':
        updateFilters('includePatterns', ['/docs/*', '/documentation/*', '/guides/*']);
        updateFilters('excludePatterns', ['/api/*']);
        break;
      case 'marketing':
        updateFilters('includePatterns', ['/', '/about', '/features', '/pricing', '/contact']);
        updateFilters('excludePatterns', ['/blog/*', '/docs/*']);
        break;
    }
  };

  const isValidConfig = () => {
    return config.startUrl && config.startUrl.startsWith('http');
  };

  return (
    <div className="space-y-6 opacity-100 visible z-10 relative bg-gray-900 p-4 rounded-lg">
      {/* Debug Text */}
      <div className="text-red-500 font-bold text-xl mb-4">CONFIGURATOR LOADED</div>
      
      {/* Crawl Type Selector */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Choose Analysis Type</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-red-500/20 p-4 rounded min-h-[150px]">
          <CrawlTypeCard
            type="single"
            title="Single Page"
            description="Analyze one specific page"
            icon={<FileText className="h-5 w-5" />}
            selected={config.crawlType === 'single'}
            onClick={() => setConfig({...config, crawlType: 'single'})}
          />
          <CrawlTypeCard
            type="subfolder"
            title="Subfolder"
            description="Analyze all pages in a section"
            icon={<Folder className="h-5 w-5" />}
            selected={config.crawlType === 'subfolder'}
            features={["All blog posts", "Product categories", "Documentation"]}
            onClick={() => setConfig({...config, crawlType: 'subfolder'})}
          />
          <CrawlTypeCard
            type="domain"
            title="Full Domain"
            description="Comprehensive site audit"
            icon={<Globe className="h-5 w-5" />}
            selected={config.crawlType === 'domain'}
            features={["Complete sitemap", "All internal pages", "Cross-site issues"]}
            onClick={() => setConfig({...config, crawlType: 'domain'})}
          />
        </div>
      </div>

      {/* URL Input */}
      <Card className="p-6 border border-gray-700 bg-gray-800/50 rounded-lg opacity-100 visible">
        <Label htmlFor="url" className="text-white mb-2 block">
          {config.crawlType === 'single' ? 'Page URL' : 'Starting URL'}
        </Label>
        <div className="space-y-2">
          <Input
            id="url"
            type="url"
            value={config.startUrl}
            onChange={(e) => handleUrlChange(e.target.value)}
            placeholder={getPlaceholder(config.crawlType)}
            className="bg-gray-900/50 border-gray-700 text-white"
          />
          {config.crawlType !== 'single' && config.startUrl && (
            <div className="text-sm text-gray-400 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Will crawl: {getCrawlPreview(config)}
            </div>
          )}
        </div>
      </Card>

      {/* Advanced Filters */}
      {config.crawlType !== 'single' && (
        <Card className="border-gray-700 bg-gray-800/50 overflow-hidden">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full p-6 flex items-center justify-between text-left hover:bg-gray-700/30 transition-colors"
          >
            <h3 className="text-lg font-semibold text-white">Advanced Filters</h3>
            {showAdvanced ? (
              <ChevronUp className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            )}
          </button>
          
          {showAdvanced && (
            <div className="p-6 pt-0 space-y-6">
              {/* Depth Control */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-white">Crawl Depth</Label>
                  <span className="text-sm text-gray-400">{config.depth} levels</span>
                </div>
                <input
                  type="range"
                  value={config.depth}
                  onChange={(e) => setConfig({...config, depth: parseInt(e.target.value)})}
                  max={5}
                  min={1}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer py-3"
                />
              </div>

              {/* Max Pages */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-white">Maximum Pages</Label>
                  <span className="text-sm text-gray-400">{config.maxPages} pages</span>
                </div>
                <input
                  type="range"
                  value={config.maxPages}
                  onChange={(e) => setConfig({...config, maxPages: parseInt(e.target.value)})}
                  max={500}
                  min={10}
                  step={10}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer py-3"
                />
              </div>

              {/* Include/Exclude Patterns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-white mb-2 block">Include Patterns</Label>
                  <TagInput
                    tags={config.filters.includePatterns}
                    onTagsChange={(tags) => updateFilters('includePatterns', tags)}
                    placeholder="/blog/*, /products/*"
                  />
                </div>
                <div>
                  <Label className="text-white mb-2 block">Exclude Patterns</Label>
                  <TagInput
                    tags={config.filters.excludePatterns}
                    onTagsChange={(tags) => updateFilters('excludePatterns', tags)}
                    placeholder="/admin/*, /api/*, *.pdf"
                  />
                </div>
              </div>

              {/* Quick Presets */}
              <div>
                <Label className="text-white mb-3 block">Quick Presets</Label>
                <div className="flex gap-2 flex-wrap">
                  <PresetButton onClick={() => applyPreset('blog')}>
                    Blog/Articles Only
                  </PresetButton>
                  <PresetButton onClick={() => applyPreset('products')}>
                    Products/E-commerce
                  </PresetButton>
                  <PresetButton onClick={() => applyPreset('docs')}>
                    Documentation
                  </PresetButton>
                  <PresetButton onClick={() => applyPreset('marketing')}>
                    Marketing Pages
                  </PresetButton>
                </div>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Crawl Estimation */}
      {config.crawlType !== 'single' && (
        <CrawlEstimation config={config} />
      )}

      {/* Start Button */}
      <Button
        onClick={() => onStartAnalysis(config)}
        disabled={!isValidConfig()}
        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-3"
      >
        {config.crawlType === 'single' 
          ? 'Start Single Page Analysis' 
          : config.crawlType === 'subfolder'
          ? 'Start Subfolder Analysis'
          : 'Start Full Domain Analysis'
        }
      </Button>
    </div>
  );
}