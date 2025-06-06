'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Clock, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Copy, 
  CheckCircle, 
  ExternalLink,
  Zap,
  Target,
  Code2,
  ArrowRight,
  Lightbulb
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

interface RecommendationCardProps {
  recommendation: EnhancedRecommendation;
  onImplement: () => void;
  onMarkComplete: () => void;
  isCompleted?: boolean;
  showExpanded?: boolean;
  isProcessing?: boolean;
}

const DifficultyBadge = ({ level }: { level: 'low' | 'medium' | 'high' }) => {
  const colors = {
    low: 'bg-green-500/10 text-green-400 border-green-500/20',
    medium: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    high: 'bg-red-500/10 text-red-400 border-red-500/20',
  };
  
  return (
    <Badge className={`${colors[level]} border`}>
      {level} effort
    </Badge>
  );
};

const PriorityBadge = ({ priority }: { priority: 'critical' | 'high' | 'medium' | 'low' }) => {
  const colors = {
    critical: 'bg-red-500/10 text-red-400 border-red-500/20',
    high: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    medium: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    low: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  };
  
  return (
    <Badge className={`${colors[priority]} border`}>
      {priority}
    </Badge>
  );
};

const CodeBlock = ({ code, language }: { code: string; language: string }) => {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <div className="relative">
      <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-400 uppercase">{language}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="h-6 px-2 text-gray-400 hover:text-white"
          >
            {copied ? <CheckCircle className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          </Button>
        </div>
        <pre className="text-sm text-gray-200 whitespace-pre-wrap break-all">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
};

export const RecommendationCard: React.FC<RecommendationCardProps> = ({
  recommendation,
  onImplement,
  onMarkComplete,
  isCompleted = false,
  showExpanded = false,
  isProcessing = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(showExpanded);
  const [showDiff, setShowDiff] = useState(false);
  
  const impactColor = recommendation.impact.seoScore >= 8 ? 'text-green-400' : 
                     recommendation.impact.seoScore >= 6 ? 'text-amber-400' : 'text-gray-400';
  
  return (
    <Card className={`
      rounded-2xl border transition-all duration-300 hover:border-gray-600 relative overflow-hidden
      ${isCompleted ? 'border-green-500/30 bg-green-500/5' : 'border-gray-700 bg-gray-800/50'}
      ${recommendation.quickWin ? 'ring-2 ring-indigo-500/20' : ''}
    `}>
      {/* Quick Win Indicator */}
      {recommendation.quickWin && (
        <div className="absolute top-4 right-4">
          <Badge className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-0">
            <Zap className="w-3 h-3 mr-1" />
            Quick Win
          </Badge>
        </div>
      )}
      
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <PriorityBadge priority={recommendation.priority} />
              <DifficultyBadge level={recommendation.impact.implementationEffort} />
              {isCompleted && (
                <Badge className="bg-green-500/10 text-green-400 border-green-500/20 border">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Complete
                </Badge>
              )}
            </div>
            <h3 className="text-xl font-bold text-white mb-2">
              {recommendation.title}
            </h3>
            <p className="text-gray-300 leading-relaxed">
              {recommendation.description}
            </p>
          </div>
        </div>
        
        {/* Impact Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-900/50 rounded-lg p-3 text-center">
            <div className={`text-2xl font-bold ${impactColor} mb-1`}>
              +{recommendation.impact.seoScore}
            </div>
            <div className="text-xs text-gray-400 flex items-center justify-center gap-1">
              <Target className="w-3 h-3" />
              SEO Score
            </div>
          </div>
          
          <div className="bg-gray-900/50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-blue-400 mb-1">
              {recommendation.impact.timeToImplement}min
            </div>
            <div className="text-xs text-gray-400 flex items-center justify-center gap-1">
              <Clock className="w-3 h-3" />
              Time Needed
            </div>
          </div>
          
          <div className="bg-gray-900/50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-purple-400 mb-1">
              +{recommendation.impact.userExperience}
            </div>
            <div className="text-xs text-gray-400 flex items-center justify-center gap-1">
              <Users className="w-3 h-3" />
              User Experience
            </div>
          </div>
          
          <div className="bg-gray-900/50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-green-400 mb-1">
              +{recommendation.impact.conversionPotential}
            </div>
            <div className="text-xs text-gray-400 flex items-center justify-center gap-1">
              <DollarSign className="w-3 h-3" />
              Conversion
            </div>
          </div>
        </div>
        
        {/* Business Case */}
        <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-lg p-4 mb-6 border border-indigo-500/20">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-indigo-400" />
            <span className="font-medium text-indigo-400">Business Impact</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Traffic Increase:</span>
              <div className="text-white font-medium">{recommendation.businessCase.estimatedTrafficIncrease}</div>
            </div>
            <div>
              <span className="text-gray-400">ROI:</span>
              <div className="text-white font-medium">{recommendation.businessCase.roi}</div>
            </div>
            <div>
              <span className="text-gray-400">Industry:</span>
              <div className="text-white font-medium">{recommendation.businessCase.competitorComparison}</div>
            </div>
          </div>
        </div>
        
        {/* Implementation Preview */}
        {isExpanded && (
          <div className="space-y-6">
            {/* Code Comparison */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-gray-400" />
                  <span className="font-medium text-white">Implementation Code</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDiff(!showDiff)}
                  className="text-gray-400 hover:text-white"
                >
                  {showDiff ? 'Show After' : 'Show Before/After'}
                </Button>
              </div>
              
              {showDiff ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-red-400 mb-2">Before:</div>
                    <CodeBlock 
                      code={recommendation.implementation.codeSnippet.before} 
                      language={recommendation.implementation.codeSnippet.language}
                    />
                  </div>
                  <div>
                    <div className="text-sm text-green-400 mb-2">After:</div>
                    <CodeBlock 
                      code={recommendation.implementation.codeSnippet.after} 
                      language={recommendation.implementation.codeSnippet.language}
                    />
                  </div>
                </div>
              ) : (
                <CodeBlock 
                  code={recommendation.implementation.codeSnippet.after} 
                  language={recommendation.implementation.codeSnippet.language}
                />
              )}
            </div>
            
            {/* Step by Step Guide */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="w-4 h-4 text-gray-400" />
                <span className="font-medium text-white">Implementation Steps</span>
              </div>
              <div className="space-y-2">
                {recommendation.implementation.stepByStep.map((step, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-gray-900/30 rounded-lg">
                    <div className="flex-shrink-0 w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                      {index + 1}
                    </div>
                    <span className="text-gray-300">{step}</span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Tools Required */}
            <div>
              <span className="font-medium text-white mb-2 block">Tools Required:</span>
              <div className="flex flex-wrap gap-2">
                {recommendation.implementation.tools.map((tool, index) => (
                  <Badge key={index} className="bg-gray-700 text-gray-300 border-gray-600">
                    {tool}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-700">
          <Button
            onClick={onImplement}
            disabled={isCompleted || isProcessing}
            className={`
              flex-1 h-12 font-medium transition-all duration-200
              ${recommendation.implementation.autoFixAvailable
                ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white'
                : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white'
              }
              ${(isCompleted || isProcessing) ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                Processing...
              </>
            ) : recommendation.implementation.autoFixAvailable ? (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Auto-Fix This
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-2" />
                Copy Solution
              </>
            )}
          </Button>
          
          {!isCompleted && (
            <Button
              variant="outline"
              onClick={onMarkComplete}
              disabled={isProcessing}
              className={`
                flex-1 sm:flex-none border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white
                ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Mark Complete
            </Button>
          )}
          
          <Button
            variant="ghost"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex-1 sm:flex-none text-gray-400 hover:text-white hover:bg-gray-700"
          >
            {isExpanded ? 'Show Less' : 'Learn More'}
            <ArrowRight className={`w-4 h-4 ml-2 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
          </Button>
        </div>
        
        {/* Documentation Links */}
        {isExpanded && recommendation.implementation.documentation.length > 0 && (
          <div className="pt-4 border-t border-gray-700">
            <span className="text-sm text-gray-400 mb-2 block">Learn More:</span>
            <div className="space-y-1">
              {recommendation.implementation.documentation.map((doc, index) => (
                <a
                  key={index}
                  href={doc}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                >
                  <ExternalLink className="w-3 h-3" />
                  Documentation
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};