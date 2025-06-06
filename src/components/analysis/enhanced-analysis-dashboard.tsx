'use client';

import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RecommendationCard } from './recommendation-card';
import { RecommendationHero } from './recommendation-hero';
import { ActionDashboard } from './action-dashboard';
import { RecommendationService } from '@/lib/recommendation-service';
import { 
  Search, 
  Filter, 
  Grid, 
  List, 
  Clock, 
  Target, 
  Zap,
  ChevronDown,
  SlidersHorizontal,
  Download,
  Share2,
  Sparkles
} from 'lucide-react';

interface EnhancedRecommendation {
  id: string;
  title: string;
  description: string;
  impact: {
    seoScore: number;
    userExperience: number;
    conversionPotential: number;
    implementationEffort: 'low' | 'medium' | 'high';
    timeToImplement: number;
  };
  implementation: {
    autoFixAvailable: boolean;
    codeSnippet: {
      before: string;
      after: string;
      language: string;
    };
    stepByStep: string[];
    tools: string[];
    documentation: string[];
  };
  businessCase: {
    estimatedTrafficIncrease: string;
    competitorComparison: string;
    roi: string;
  };
  quickWin: boolean;
  category: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
}

interface EnhancedAnalysisDashboardProps {
  recommendations: EnhancedRecommendation[];
  currentScore: number;
  onImplementRecommendation?: (id: string) => void;
  onMarkComplete?: (id: string) => void;
  onExportPlan?: () => void;
}

export const EnhancedAnalysisDashboard: React.FC<EnhancedAnalysisDashboardProps> = ({
  recommendations,
  currentScore,
  onImplementRecommendation = () => {},
  onMarkComplete = () => {},
  onExportPlan = () => {},
}) => {
  // Debug logging
  console.log('[EnhancedAnalysisDashboard] Props received:', {
    recommendations: recommendations?.length || 0,
    currentScore,
    recommendationsData: recommendations
  });

  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterTime, setFilterTime] = useState<number>(0);
  const [filterImpact, setFilterImpact] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [isProcessing, setIsProcessing] = useState<Set<string>>(new Set());
  
  const recommendationService = RecommendationService.getInstance();
  
  // Calculate priority scores for sorting
  const calculatePriority = (rec: EnhancedRecommendation): number => {
    // Add null/undefined checks with more robust fallbacks
    if (!rec) return 0;
    
    // Ensure impact exists with defaults
    const impact = rec.impact || {
      seoScore: 5,
      userExperience: 5,
      conversionPotential: 5,
      implementationEffort: 'medium' as const,
      timeToImplement: 30
    };
    
    const weights = {
      seoImpact: 0.3,
      implementationEase: 0.25,
      userExperience: 0.2,
      quickWin: 0.15,
      businessValue: 0.1
    };
    
    const scores = {
      seoImpact: Math.max(0, Math.min(10, impact.seoScore || 5)) / 10,
      implementationEase: impact.implementationEffort === 'low' ? 1 : 
                         impact.implementationEffort === 'medium' ? 0.5 : 0.2,
      userExperience: Math.max(0, Math.min(10, impact.userExperience || 5)) / 10,
      quickWin: rec.quickWin ? 1 : 0,
      businessValue: Math.max(0, Math.min(10, impact.conversionPotential || 5)) / 10
    };
    
    const priority = Object.entries(weights).reduce((total, [key, weight]) => 
      total + (scores[key as keyof typeof scores] * weight), 0
    ) * 100;
    
    console.log('[EnhancedAnalysisDashboard] Calculated priority for', rec.id, ':', priority, scores);
    return priority;
  };
  
  // Sort and filter recommendations
  const sortedRecommendations = useMemo(() => {
    console.log('[EnhancedAnalysisDashboard] Processing recommendations:', {
      total: recommendations?.length || 0,
      filterCategory,
      filterTime,
      filterImpact,
      searchTerm,
      sampleRec: recommendations?.[0]
    });

    if (!recommendations || recommendations.length === 0) {
      console.log('[EnhancedAnalysisDashboard] No recommendations to process');
      return [];
    }

    // First normalize the recommendations to ensure they have required properties
    const normalizedRecommendations = recommendations.map(rec => {
      if (!rec) return null;
      
      // Create a new object with defaults if impact is missing
      const normalizedRec = {
        ...rec,
        impact: rec.impact || {
          seoScore: 5,
          userExperience: 5,
          conversionPotential: 5,
          implementationEffort: 'medium' as const,
          timeToImplement: 30
        },
        // Ensure other required fields exist
        businessCase: rec.businessCase || {
          estimatedTrafficIncrease: '5-10%',
          competitorComparison: 'Standard optimization',
          roi: 'Quick improvement'
        },
        implementation: rec.implementation || {
          autoFixAvailable: false,
          codeSnippet: {
            before: '',
            after: '',
            language: 'html'
          },
          stepByStep: ['Manual implementation required'],
          tools: [],
          documentation: []
        },
        quickWin: rec.quickWin !== undefined ? rec.quickWin : false,
        category: rec.category || 'general',
        priority: rec.priority || 'medium' as const
      };
      
      return normalizedRec;
    }).filter(rec => rec !== null) as EnhancedRecommendation[];

    const filtered = normalizedRecommendations.filter(rec => {
      // Apply filters only if they're actually set
      if (filterCategory !== 'all' && rec.category && rec.category !== filterCategory) {
        console.log('[EnhancedAnalysisDashboard] Filtered out by category:', rec.id, rec.category, 'vs', filterCategory);
        return false;
      }
      if (filterTime > 0 && (rec.impact.timeToImplement || 0) > filterTime) {
        console.log('[EnhancedAnalysisDashboard] Filtered out by time:', rec.id, rec.impact.timeToImplement, 'vs', filterTime);
        return false;
      }
      if (filterImpact > 0 && (rec.impact.seoScore || 0) < filterImpact) {
        console.log('[EnhancedAnalysisDashboard] Filtered out by impact:', rec.id, rec.impact.seoScore, 'vs', filterImpact);
        return false;
      }
      if (searchTerm && rec.title && rec.description && 
          !rec.title.toLowerCase().includes(searchTerm.toLowerCase()) && 
          !rec.description.toLowerCase().includes(searchTerm.toLowerCase())) {
        console.log('[EnhancedAnalysisDashboard] Filtered out by search:', rec.id, searchTerm);
        return false;
      }
      
      console.log('[EnhancedAnalysisDashboard] Rec passed filters:', rec.id, rec.title);
      return true;
    });
    
    console.log('[EnhancedAnalysisDashboard] Filtered recommendations:', filtered.length);
    const sorted = filtered.sort((a, b) => calculatePriority(b) - calculatePriority(a));
    console.log('[EnhancedAnalysisDashboard] Sorted recommendations:', sorted.length);
    
    return sorted;
  }, [recommendations, filterCategory, filterTime, filterImpact, searchTerm]);
  
  // Get top recommendation and quick wins
  const topRecommendation = sortedRecommendations[0];
  const quickWins = sortedRecommendations.filter(rec => rec.quickWin).slice(0, 5);
  
  // Calculate statistics
  const completedIdsArray = Array.from(completedIds);
  const stats = {
    totalRecommendations: recommendations.length,
    completedRecommendations: completedIds.size,
    totalTimeEstimate: recommendations.reduce((sum, rec) => sum + (rec?.impact?.timeToImplement || 0), 0),
    timeInvested: completedIdsArray.reduce((sum, id) => {
      const rec = recommendations.find(r => r.id === id);
      return sum + (rec?.impact?.timeToImplement || 0);
    }, 0),
    currentScore,
    projectedScore: currentScore + completedIdsArray.reduce((sum, id) => {
      const rec = recommendations.find(r => r.id === id);
      return sum + (rec?.impact?.seoScore || 0);
    }, 0),
    quickWinsCompleted: quickWins.filter(qw => completedIds.has(qw.id)).length,
    quickWinsTotal: quickWins.length,
  };
  
  const categories = ['all', ...Array.from(new Set(recommendations.map(r => r.category).filter(Boolean)))];
  
  const handleMarkComplete = async (id: string) => {
    if (isProcessing.has(id)) return;
    
    setIsProcessing(prev => new Set([...Array.from(prev), id]));
    
    try {
      const recommendation = recommendations.find(r => r.id === id);
      const result = await recommendationService.markComplete(id, {
        timeSpent: recommendation?.impact?.timeToImplement || 0,
      });
      
      if (result.success) {
        setCompletedIds(prev => new Set([...Array.from(prev), id]));
        onMarkComplete(id);
      } else {
        console.error('Failed to mark complete:', result.message);
      }
    } catch (error) {
      console.error('Error marking complete:', error);
    } finally {
      setIsProcessing(prev => {
        const newSet = new Set(Array.from(prev));
        newSet.delete(id);
        return newSet;
      });
    }
  };
  
  const handleImplement = async (id: string) => {
    if (isProcessing.has(id)) return;
    
    const recommendation = recommendations.find(r => r.id === id);
    if (!recommendation) return;
    
    setIsProcessing(prev => new Set([...Array.from(prev), id]));
    
    try {
      if (recommendation.implementation?.autoFixAvailable) {
        // Attempt auto-fix
        const result = await recommendationService.implementAutoFix(id);
        
        if (result.success) {
          // Auto-fix succeeded, mark as complete
          setCompletedIds(prev => new Set([...Array.from(prev), id]));
          onMarkComplete(id);
        } else {
          // Auto-fix failed, copy code instead
          const copied = await recommendationService.copyToClipboard(
            recommendation.implementation?.codeSnippet?.after || ''
          );
          if (copied) {
            // Show success message or notification
            console.log('Code copied to clipboard');
          }
        }
      } else {
        // Copy code to clipboard
        const copied = await recommendationService.copyToClipboard(
          recommendation.implementation?.codeSnippet?.after || ''
        );
        if (copied) {
          console.log('Code copied to clipboard');
        }
      }
      
      onImplementRecommendation(id);
    } catch (error) {
      console.error('Error implementing recommendation:', error);
    } finally {
      setIsProcessing(prev => {
        const newSet = new Set(Array.from(prev));
        newSet.delete(id);
        return newSet;
      });
    }
  };
  
  // Early return if no recommendations
  if (!recommendations || recommendations.length === 0) {
    console.log('[EnhancedAnalysisDashboard] No recommendations provided');
    return (
      <div className="space-y-8">
        <Card className="rounded-2xl border border-gray-700 bg-gray-800/50 backdrop-blur-sm p-12 text-center">
          <div className="text-gray-400 mb-4">
            <Sparkles className="w-12 h-12 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No Recommendations Yet</h3>
            <p>The analysis is either in progress or no recommendations were generated.</p>
            <div className="mt-4 text-sm text-gray-500">
              Current Score: {currentScore || 'N/A'}
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      {topRecommendation && (
        <RecommendationHero
          topRecommendation={{
            id: topRecommendation.id,
            title: topRecommendation.title,
            description: topRecommendation.description,
            impact: {
              seoScore: topRecommendation.impact.seoScore,
              timeToImplement: topRecommendation.impact.timeToImplement,
              implementationEffort: topRecommendation.impact.implementationEffort,
            },
            businessCase: topRecommendation.businessCase,
            quickWin: topRecommendation.quickWin,
          }}
          quickWins={quickWins.map(qw => ({
            id: qw.id,
            title: qw.title,
            timeToImplement: qw.impact.timeToImplement,
            impact: { seoScore: qw.impact.seoScore },
          }))}
          onImplementTop={() => handleImplement(topRecommendation.id)}
          onImplementQuickWin={handleImplement}
        />
      )}
      
      {/* Action Dashboard */}
      <ActionDashboard stats={stats} />
      
      {/* Filter and Search */}
      <Card className="rounded-2xl border border-gray-700 bg-gray-800/50 backdrop-blur-sm">
        <div className="p-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search recommendations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-gray-700 border-gray-600 text-white focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              
              {/* Advanced Filters Toggle */}
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
              >
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                Filters
                <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </Button>
            </div>
            
            <div className="flex items-center gap-3">
              {/* View Mode Toggle */}
              <div className="flex bg-gray-700 rounded-lg p-1">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-1 ${viewMode === 'grid' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}
                >
                  <Grid className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-1 ${viewMode === 'list' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
              
              {/* Export Button */}
              <Button
                variant="outline"
                onClick={async () => {
                  try {
                    await recommendationService.exportImplementationPlan(recommendations);
                    onExportPlan();
                  } catch (error) {
                    console.error('Export failed:', error);
                  }
                }}
                className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
              >
                <Download className="w-4 h-4 mr-2" />
                Export Plan
              </Button>
            </div>
          </div>
          
          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-6 pt-6 border-t border-gray-700">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Category Filter */}
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-2 block">Category</label>
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>
                        {cat === 'all' ? 'All Categories' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Time Filter */}
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-2 block">Max Time</label>
                  <select
                    value={filterTime}
                    onChange={(e) => setFilterTime(Number(e.target.value))}
                    className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value={0}>Any time</option>
                    <option value={5}>Under 5 min</option>
                    <option value={15}>Under 15 min</option>
                    <option value={30}>Under 30 min</option>
                    <option value={60}>Under 1 hour</option>
                  </select>
                </div>
                
                {/* Impact Filter */}
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-2 block">Min Impact</label>
                  <select
                    value={filterImpact}
                    onChange={(e) => setFilterImpact(Number(e.target.value))}
                    className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value={0}>Any impact</option>
                    <option value={5}>5+ score boost</option>
                    <option value={7}>7+ score boost</option>
                    <option value={8}>8+ score boost</option>
                    <option value={9}>9+ score boost</option>
                  </select>
                </div>
                
                {/* Quick Filters */}
                <div className="flex flex-wrap gap-2">
                  <Badge 
                    className={`cursor-pointer transition-all ${
                      filterCategory === 'all' && filterTime === 5 ? 
                      'bg-green-600 text-white' : 
                      'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                    onClick={() => {
                      setFilterCategory('all');
                      setFilterTime(5);
                      setFilterImpact(0);
                    }}
                  >
                    <Zap className="w-3 h-3 mr-1" />
                    Quick Wins
                  </Badge>
                  <Badge 
                    className={`cursor-pointer transition-all ${
                      filterImpact === 8 ? 
                      'bg-indigo-600 text-white' : 
                      'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                    onClick={() => {
                      setFilterCategory('all');
                      setFilterTime(0);
                      setFilterImpact(8);
                    }}
                  >
                    <Target className="w-3 h-3 mr-1" />
                    High Impact
                  </Badge>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>
      
      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-gray-400">
        <span>
          Showing {sortedRecommendations.length} of {recommendations.length} recommendations
        </span>
        <span>
          {completedIds.size} completed • {quickWins.filter(qw => completedIds.has(qw.id)).length}/{quickWins.length} quick wins done
        </span>
      </div>
      
      {/* Recommendations Grid/List */}
      <div className={
        viewMode === 'grid' ? 
        'grid grid-cols-1 lg:grid-cols-2 gap-6' : 
        'space-y-4'
      }>
        {(() => {
          console.log('[EnhancedAnalysisDashboard] Rendering grid with recommendations:', sortedRecommendations.length);
          return sortedRecommendations.map((recommendation) => {
            console.log('[EnhancedAnalysisDashboard] Rendering recommendation:', recommendation.id, recommendation.title);
            return (
              <RecommendationCard
                key={recommendation.id}
                recommendation={recommendation}
                onImplement={() => handleImplement(recommendation.id)}
                onMarkComplete={() => handleMarkComplete(recommendation.id)}
                isCompleted={completedIds.has(recommendation.id)}
                showExpanded={viewMode === 'list'}
                isProcessing={isProcessing.has(recommendation.id)}
              />
            );
          });
        })()}
      </div>
      
      {sortedRecommendations.length === 0 && (
        <Card className="rounded-2xl border border-gray-700 bg-gray-800/50 backdrop-blur-sm p-12 text-center">
          <div className="text-gray-400 mb-4">
            <Filter className="w-12 h-12 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No recommendations found</h3>
            <p>Try adjusting your filters to see more results.</p>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              setFilterCategory('all');
              setFilterTime(0);
              setFilterImpact(0);
              setSearchTerm('');
            }}
            className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
          >
            Clear all filters
          </Button>
        </Card>
      )}
    </div>
  );
};