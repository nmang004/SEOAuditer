'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Target, 
  Clock, 
  TrendingUp, 
  CheckCircle, 
  AlertCircle,
  Zap,
  Trophy,
  Timer
} from 'lucide-react';

interface ProgressStats {
  totalRecommendations: number;
  completedRecommendations: number;
  totalTimeEstimate: number;
  timeInvested: number;
  currentScore: number;
  projectedScore: number;
  quickWinsCompleted: number;
  quickWinsTotal: number;
}

interface ActionDashboardProps {
  stats: ProgressStats;
  onStartImplementation?: () => void;
}

export const ActionDashboard: React.FC<ActionDashboardProps> = ({
  stats,
  onStartImplementation,
}) => {
  const completionPercentage = (stats.completedRecommendations / stats.totalRecommendations) * 100;
  const scoreIncrease = stats.projectedScore - stats.currentScore;
  const timeProgress = (stats.timeInvested / stats.totalTimeEstimate) * 100;
  const quickWinProgress = (stats.quickWinsCompleted / stats.quickWinsTotal) * 100;
  
  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  };
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Impact Calculator */}
      <Card className="rounded-2xl border border-gray-700 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 backdrop-blur-sm">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-indigo-500/20 rounded-lg">
              <Target className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="font-bold text-white">Score Impact</h3>
              <p className="text-xs text-gray-400">Potential improvement</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-gray-300">
                {stats.currentScore}
              </span>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-400" />
                <span className="text-green-400 font-medium">+{scoreIncrease}</span>
              </div>
              <span className="text-3xl font-bold text-indigo-400">
                {stats.projectedScore}
              </span>
            </div>
            
            <div className="relative">
              <Progress 
                value={completionPercentage} 
                className="h-3 bg-gray-800 [&>div]:bg-gradient-to-r [&>div]:from-indigo-500 [&>div]:to-purple-500"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>Current</span>
                <span>{completionPercentage.toFixed(0)}% complete</span>
                <span>Target</span>
              </div>
            </div>
            
            <div className="text-center p-3 bg-white/5 rounded-lg border border-white/10">
              <div className="text-lg font-bold text-indigo-400">
                {stats.completedRecommendations}/{stats.totalRecommendations}
              </div>
              <div className="text-xs text-gray-400">Recommendations Fixed</div>
            </div>
          </div>
        </div>
      </Card>
      
      {/* Time Tracker */}
      <Card className="rounded-2xl border border-gray-700 bg-gradient-to-br from-amber-500/10 to-orange-500/10 backdrop-blur-sm">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-amber-500/20 rounded-lg">
              <Clock className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="font-bold text-white">Time Investment</h3>
              <p className="text-xs text-gray-400">Progress tracking</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-400">
                  {formatTime(stats.timeInvested)}
                </div>
                <div className="text-xs text-gray-400">Invested</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-300">
                  {formatTime(stats.totalTimeEstimate - stats.timeInvested)}
                </div>
                <div className="text-xs text-gray-400">Remaining</div>
              </div>
            </div>
            
            <div className="relative">
              <Progress 
                value={timeProgress} 
                className="h-3 bg-gray-800 [&>div]:bg-gradient-to-r [&>div]:from-amber-500 [&>div]:to-orange-500"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>0min</span>
                <span>{timeProgress.toFixed(0)}%</span>
                <span>{formatTime(stats.totalTimeEstimate)}</span>
              </div>
            </div>
            
            <div className="flex items-center justify-center gap-2 p-3 bg-white/5 rounded-lg border border-white/10">
              <Timer className="w-4 h-4 text-amber-400" />
              <span className="text-sm text-amber-400 font-medium">
                ~{formatTime(Math.ceil((stats.totalTimeEstimate - stats.timeInvested) / Math.max(1, stats.totalRecommendations - stats.completedRecommendations)))} per fix
              </span>
            </div>
          </div>
        </div>
      </Card>
      
      {/* Quick Wins Progress */}
      <Card className="rounded-2xl border border-gray-700 bg-gradient-to-br from-green-500/10 to-emerald-500/10 backdrop-blur-sm">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <Zap className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <h3 className="font-bold text-white">Quick Wins</h3>
              <p className="text-xs text-gray-400">Easy victories</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-4xl font-bold text-green-400 mb-2">
                {stats.quickWinsCompleted}/{stats.quickWinsTotal}
              </div>
              <div className="text-sm text-gray-300">Quick fixes completed</div>
            </div>
            
            <div className="relative">
              <Progress 
                value={quickWinProgress} 
                className="h-3 bg-gray-800 [&>div]:bg-gradient-to-r [&>div]:from-green-500 [&>div]:to-emerald-500"
              />
              <div className="text-center text-xs text-gray-400 mt-1">
                {quickWinProgress.toFixed(0)}% complete
              </div>
            </div>
            
            <div className="space-y-2">
              {stats.quickWinsCompleted === stats.quickWinsTotal && stats.quickWinsTotal > 0 && (
                <div className="flex items-center justify-center gap-2 p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                  <Trophy className="w-4 h-4 text-green-400" />
                  <span className="text-sm text-green-400 font-medium">
                    All Quick Wins Complete!
                  </span>
                </div>
              )}
              
              {stats.quickWinsCompleted < stats.quickWinsTotal && (
                <div className="flex items-center justify-center gap-2 p-3 bg-white/5 rounded-lg border border-white/10">
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                  <span className="text-sm text-amber-400 font-medium">
                    {stats.quickWinsTotal - stats.quickWinsCompleted} quick wins remaining
                  </span>
                </div>
              )}
              
              {stats.quickWinsCompleted > 0 && (
                <div className="text-center">
                  <Badge className="bg-green-500/10 text-green-400 border-green-500/20 border">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    {stats.quickWinsCompleted} completed
                  </Badge>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};