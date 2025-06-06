'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Zap, 
  TrendingUp, 
  Clock, 
  Target,
  ArrowRight,
  Sparkles
} from 'lucide-react';

interface TopRecommendation {
  id: string;
  title: string;
  description: string;
  impact: {
    seoScore: number;
    timeToImplement: number;
    implementationEffort: 'low' | 'medium' | 'high';
  };
  businessCase: {
    estimatedTrafficIncrease: string;
    roi: string;
  };
  quickWin: boolean;
}

interface QuickWin {
  id: string;
  title: string;
  timeToImplement: number;
  impact: {
    seoScore: number;
  };
}

interface RecommendationHeroProps {
  topRecommendation: TopRecommendation;
  quickWins: QuickWin[];
  onImplementTop: () => void;
  onImplementQuickWin: (id: string) => void;
}

export const RecommendationHero: React.FC<RecommendationHeroProps> = ({
  topRecommendation,
  quickWins,
  onImplementTop,
  onImplementQuickWin,
}) => {
  return (
    <div className="space-y-6">
      {/* Hero Recommendation */}
      <Card className="relative overflow-hidden rounded-3xl border-2 border-gradient-to-r from-indigo-500 to-purple-500 bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-pink-500/10"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-indigo-500/20 to-transparent rounded-full blur-3xl"></div>
        
        <div className="relative p-8 lg:p-12">
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-8">
            {/* Content */}
            <div className="flex-1 space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Badge className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-0 px-4 py-1.5">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Biggest Impact
                  </Badge>
                  {topRecommendation.quickWin && (
                    <Badge className="bg-gradient-to-r from-green-600 to-emerald-600 text-white border-0 px-4 py-1.5">
                      <Zap className="w-4 h-4 mr-2" />
                      Quick Win
                    </Badge>
                  )}
                </div>
                
                <h2 className="text-3xl lg:text-4xl font-extrabold text-white leading-tight">
                  {topRecommendation.title}
                </h2>
                
                <p className="text-lg text-gray-300 leading-relaxed max-w-2xl">
                  {topRecommendation.description}
                </p>
              </div>
              
              {/* Impact Metrics */}
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                  <div className="text-3xl font-bold text-indigo-400 mb-1">
                    +{topRecommendation.impact.seoScore}
                  </div>
                  <div className="text-sm text-gray-400 flex items-center gap-1">
                    <Target className="w-4 h-4" />
                    SEO Score Boost
                  </div>
                </div>
                
                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                  <div className="text-3xl font-bold text-green-400 mb-1">
                    {topRecommendation.impact.timeToImplement}m
                  </div>
                  <div className="text-sm text-gray-400 flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    Time to Fix
                  </div>
                </div>
                
                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 col-span-2 lg:col-span-1">
                  <div className="text-2xl lg:text-3xl font-bold text-purple-400 mb-1">
                    {topRecommendation.businessCase.estimatedTrafficIncrease}
                  </div>
                  <div className="text-sm text-gray-400 flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" />
                    Traffic Increase
                  </div>
                </div>
              </div>
              
              {/* ROI Statement */}
              <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-xl p-4 border border-amber-500/20">
                <div className="text-amber-400 font-medium text-lg">
                  💰 {topRecommendation.businessCase.roi}
                </div>
              </div>
            </div>
            
            {/* Call to Action */}
            <div className="flex flex-col items-center lg:items-start space-y-4">
              <Button
                onClick={onImplementTop}
                size="lg"
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white border-0 h-14 px-8 text-lg font-semibold shadow-2xl shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all duration-300 transform hover:scale-105"
              >
                Fix This Now
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              
              <p className="text-xs text-gray-400 text-center lg:text-left max-w-xs">
                Start with the highest impact recommendation first
              </p>
            </div>
          </div>
        </div>
      </Card>
      
      {/* Quick Wins Bar */}
      <Card className="rounded-2xl border border-gray-700 bg-gray-800/50 backdrop-blur-sm">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <Zap className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Quick Wins</h3>
                <p className="text-gray-400 text-sm">Fix these in under 5 minutes each</p>
              </div>
            </div>
            
            <Badge className="bg-green-500/10 text-green-400 border-green-500/20 border px-3 py-1">
              {quickWins.length} available
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {quickWins.slice(0, 3).map((quickWin) => (
              <div
                key={quickWin.id}
                className="bg-gray-900/50 rounded-xl p-4 border border-gray-700 hover:border-gray-600 transition-all duration-200 cursor-pointer group"
                onClick={() => onImplementQuickWin(quickWin.id)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-medium text-white text-sm mb-1 group-hover:text-green-400 transition-colors">
                      {quickWin.title}
                    </h4>
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {quickWin.timeToImplement}min
                      </span>
                      <span className="flex items-center gap-1">
                        <Target className="w-3 h-3" />
                        +{quickWin.impact.seoScore}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-1.5 bg-green-500/10 rounded-lg group-hover:bg-green-500/20 transition-colors">
                    <ArrowRight className="w-3 h-3 text-green-400 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
                
                <Button
                  size="sm"
                  className="w-full bg-green-600 hover:bg-green-700 text-white border-0 h-8 text-xs font-medium"
                  onClick={(e) => {
                    e.stopPropagation();
                    onImplementQuickWin(quickWin.id);
                  }}
                >
                  Quick Fix
                </Button>
              </div>
            ))}
          </div>
          
          {quickWins.length > 3 && (
            <div className="mt-4 text-center">
              <Button variant="ghost" className="text-gray-400 hover:text-white">
                View {quickWins.length - 3} more quick wins
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};