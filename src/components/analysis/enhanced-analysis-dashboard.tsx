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
    
    return priority;
  };
  
  // Process and filter recommendations
  const sortedRecommendations = useMemo(() => {
    if (!recommendations || !Array.isArray(recommendations) || recommendations.length === 0) {
      return [];
    }
    
    // Filter by search term
    const filtered = recommendations.filter(rec => {
      if (!rec) return false;
      
      const searchMatch = !searchTerm || 
        rec.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rec.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rec.category?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const categoryMatch = filterCategory === 'all' || rec.category === filterCategory;
      const timeMatch = filterTime === 0 || (rec.impact?.timeToImplement || 0) <= filterTime;
      const impactMatch = filterImpact === 0 || (rec.impact?.seoScore || 0) >= filterImpact;
      
      return searchMatch && categoryMatch && timeMatch && impactMatch;
    });
    
    // Sort by calculated priority score
    return filtered.sort((a, b) => calculatePriority(b) - calculatePriority(a));
  }, [recommendations, searchTerm, filterCategory, filterTime, filterImpact]);
  
  // Get top recommendation and quick wins with safety checks
  const topRecommendation = sortedRecommendations?.[0];
  const quickWins = sortedRecommendations?.filter(rec => rec?.quickWin)?.slice(0, 5) || [];
  
  
  // Calculate statistics with safety checks
  const completedIdsArray = Array.from(completedIds);
  const safeRecommendations = recommendations || [];
  const safeQuickWins = quickWins || [];
  
  const stats = {
    totalRecommendations: safeRecommendations?.length || 0,
    completedRecommendations: completedIds?.size || 0,
    totalTimeEstimate: safeRecommendations?.reduce((sum, rec) => {
      const timeToImplement = rec?.impact?.timeToImplement || 0;
      return sum + timeToImplement;
    }, 0) || 0,
    timeInvested: completedIdsArray?.reduce((sum, id) => {
      const rec = safeRecommendations?.find(r => r?.id === id);
      const timeToImplement = rec?.impact?.timeToImplement || 0;
      return sum + timeToImplement;
    }, 0) || 0,
    currentScore: currentScore || 0,
    projectedScore: (currentScore || 0) + (completedIdsArray?.reduce((sum, id) => {
      const rec = safeRecommendations?.find(r => r?.id === id);
      const seoScore = rec?.impact?.seoScore || 0;
      return sum + seoScore;
    }, 0) || 0),
    quickWinsCompleted: safeQuickWins?.filter(qw => qw?.id && completedIds?.has(qw.id))?.length || 0,
    quickWinsTotal: safeQuickWins?.length || 0,
  };
  
  const categories = ['all', ...Array.from(new Set(safeRecommendations.map(r => r?.category).filter(Boolean)))];
  
  const handleMarkComplete = async (id: string) => {
    if (isProcessing.has(id)) return;
    
    setIsProcessing(prev => new Set([...Array.from(prev), id]));
    
    try {
      const recommendation = safeRecommendations.find(r => r?.id === id);
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
    
    const recommendation = safeRecommendations.find(r => r?.id === id);
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
      {/* Enhanced Hero Section */}
      {topRecommendation && (
        <div className="relative overflow-hidden rounded-2xl border border-indigo-500/50 bg-gradient-to-br from-gray-800 to-gray-900 p-8">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-pink-500/10"></div>
          
          <div className="relative space-y-6">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-0 px-4 py-1.5 rounded-full text-sm font-medium">
                ✨ Biggest Impact
              </div>
              {topRecommendation.quickWin && (
                <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white border-0 px-4 py-1.5 rounded-full text-sm font-medium">
                  ⚡ Quick Win
                </div>
              )}
            </div>
            
            <h2 className="text-3xl font-extrabold text-white leading-tight">
              {topRecommendation.title}
            </h2>
            
            <p className="text-lg text-gray-300 leading-relaxed">
              {topRecommendation.description}
            </p>
            
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                <div className="text-3xl font-bold text-indigo-400 mb-1">
                  +{topRecommendation.impact.seoScore}
                </div>
                <div className="text-sm text-gray-400">SEO Score Boost</div>
              </div>
              
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                <div className="text-3xl font-bold text-green-400 mb-1">
                  {topRecommendation.impact.timeToImplement}m
                </div>
                <div className="text-sm text-gray-400">Time to Fix</div>
              </div>
              
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 col-span-2 lg:col-span-1">
                <div className="text-2xl lg:text-3xl font-bold text-purple-400 mb-1">
                  {topRecommendation.businessCase.estimatedTrafficIncrease}
                </div>
                <div className="text-sm text-gray-400">Traffic Increase</div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => handleImplement(topRecommendation.id)}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white border-0 px-8 py-3 rounded-lg font-semibold transition-all"
              >
                Fix This Now →
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Stats Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="rounded-2xl border border-gray-700 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 backdrop-blur-sm p-6">
          <div className="text-center space-y-4">
            <div className="text-4xl font-bold text-indigo-400">{stats.currentScore}</div>
            <div className="text-white font-medium">Current SEO Score</div>
            <div className="text-sm text-gray-400">Target: {stats.projectedScore}</div>
          </div>
        </div>
        
        <div className="rounded-2xl border border-gray-700 bg-gradient-to-br from-amber-500/10 to-orange-500/10 backdrop-blur-sm p-6">
          <div className="text-center space-y-4">
            <div className="text-4xl font-bold text-amber-400">{stats.completedRecommendations}/{stats.totalRecommendations}</div>
            <div className="text-white font-medium">Recommendations</div>
            <div className="text-sm text-gray-400">
              {((stats.completedRecommendations / stats.totalRecommendations) * 100).toFixed(0)}% complete
            </div>
          </div>
        </div>
        
        <div className="rounded-2xl border border-gray-700 bg-gradient-to-br from-green-500/10 to-emerald-500/10 backdrop-blur-sm p-6">
          <div className="text-center space-y-4">
            <div className="text-4xl font-bold text-green-400">{stats.quickWinsCompleted}/{stats.quickWinsTotal}</div>
            <div className="text-white font-medium">Quick Wins</div>
            <div className="text-sm text-gray-400">Easy victories</div>
          </div>
        </div>
      </div>
      
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
          {completedIds.size} completed • {quickWins.filter(qw => qw?.id && completedIds.has(qw.id)).length}/{quickWins.length} quick wins done
        </span>
      </div>
      
      {/* Enhanced Recommendations List */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">📋 All Recommendations ({sortedRecommendations.length})</h2>
          <div className="text-sm text-gray-400">
            {completedIds.size} completed • {quickWins.filter(qw => qw?.id && completedIds.has(qw.id)).length}/{quickWins.length} quick wins done
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {sortedRecommendations?.map((recommendation) => (
            <div 
              key={recommendation.id} 
              className={`
                rounded-2xl border transition-all duration-300 hover:border-gray-600 relative overflow-hidden p-6
                ${completedIds.has(recommendation.id) ? 'border-green-500/30 bg-green-500/5' : 'border-gray-700 bg-gray-800/50'}
                ${recommendation.quickWin ? 'ring-2 ring-indigo-500/20' : ''}
              `}
            >
              {/* Quick Win Badge */}
              {recommendation.quickWin && (
                <div className="absolute top-4 right-4">
                  <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-0 px-3 py-1 rounded-full text-xs font-medium">
                    ⚡ Quick Win
                  </div>
                </div>
              )}
              
              {/* Header */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`px-2 py-1 rounded text-xs font-medium border ${
                    recommendation.priority === 'critical' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                    recommendation.priority === 'high' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                    recommendation.priority === 'medium' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                    'bg-blue-500/10 text-blue-400 border-blue-500/20'
                  }`}>
                    {recommendation.priority}
                  </div>
                  <div className={`px-2 py-1 rounded text-xs font-medium border ${
                    recommendation.impact.implementationEffort === 'low' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                    recommendation.impact.implementationEffort === 'medium' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                    'bg-red-500/10 text-red-400 border-red-500/20'
                  }`}>
                    {recommendation.impact.implementationEffort} effort
                  </div>
                  {completedIds.has(recommendation.id) && (
                    <div className="bg-green-500/10 text-green-400 border-green-500/20 border px-2 py-1 rounded text-xs font-medium">
                      ✓ Complete
                    </div>
                  )}
                </div>
                
                <h3 className="text-xl font-bold text-white mb-2">
                  {recommendation.title}
                </h3>
                <p className="text-gray-300 leading-relaxed">
                  {recommendation.description}
                </p>
              </div>
              
              {/* Impact Metrics */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-900/50 rounded-lg p-3 text-center">
                  <div className={`text-2xl font-bold mb-1 ${
                    recommendation.impact.seoScore >= 8 ? 'text-green-400' : 
                    recommendation.impact.seoScore >= 6 ? 'text-amber-400' : 'text-gray-400'
                  }`}>
                    +{recommendation.impact.seoScore}
                  </div>
                  <div className="text-xs text-gray-400">SEO Score</div>
                </div>
                
                <div className="bg-gray-900/50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-blue-400 mb-1">
                    {recommendation.impact.timeToImplement}min
                  </div>
                  <div className="text-xs text-gray-400">Time Needed</div>
                </div>
              </div>
              
              {/* Business Impact */}
              <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-lg p-4 mb-6 border border-indigo-500/20">
                <div className="text-sm">
                  <span className="text-gray-400">Traffic Increase:</span>
                  <div className="text-white font-medium">{recommendation.businessCase.estimatedTrafficIncrease}</div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => handleImplement(recommendation.id)}
                  disabled={completedIds.has(recommendation.id) || isProcessing.has(recommendation.id)}
                  className={`
                    flex-1 px-4 py-3 rounded-lg font-medium transition-all duration-200
                    ${recommendation.implementation?.autoFixAvailable
                      ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white'
                      : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white'
                    }
                    ${(completedIds.has(recommendation.id) || isProcessing.has(recommendation.id)) ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  {isProcessing.has(recommendation.id) ? 'Processing...' :
                   recommendation.implementation?.autoFixAvailable ? '⚡ Auto-Fix' : '📋 Copy Solution'}
                </button>
                
                {!completedIds.has(recommendation.id) && (
                  <button
                    onClick={() => handleMarkComplete(recommendation.id)}
                    disabled={isProcessing.has(recommendation.id)}
                    className={`
                      px-4 py-3 rounded-lg font-medium border border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white transition-all
                      ${isProcessing.has(recommendation.id) ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                  >
                    ✓ Complete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
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