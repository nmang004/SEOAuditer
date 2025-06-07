interface AutoFixResult {
  success: boolean;
  message: string;
  codeApplied?: string;
  newScore?: number;
  timeToImplement?: number;
}

interface CompletionResult {
  success: boolean;
  message: string;
  data?: {
    recommendationId: string;
    completedAt: string;
    timeSpent: number;
    notes: string;
  };
}

export class RecommendationService {
  private static instance: RecommendationService;
  
  public static getInstance(): RecommendationService {
    if (!RecommendationService.instance) {
      RecommendationService.instance = new RecommendationService();
    }
    return RecommendationService.instance;
  }

  async implementAutoFix(recommendationId: string): Promise<AutoFixResult> {
    try {
      const response = await fetch(`/api/recommendations/${recommendationId}/implement`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to implement auto-fix');
      }

      return result.data;
    } catch (error) {
      console.error('Auto-fix implementation failed:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async markComplete(
    recommendationId: string, 
    options: { notes?: string; timeSpent?: number } = {}
  ): Promise<CompletionResult> {
    try {
      const response = await fetch(`/api/recommendations/${recommendationId}/complete`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          notes: options.notes || '',
          timeSpent: options.timeSpent || 0,
        }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to mark as complete');
      }

      return result;
    } catch (error) {
      console.error('Mark complete failed:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async removeCompletion(recommendationId: string): Promise<CompletionResult> {
    try {
      const response = await fetch(`/api/recommendations/${recommendationId}/complete`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to remove completion');
      }

      return result;
    } catch (error) {
      console.error('Remove completion failed:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async copyToClipboard(text: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      // Fallback for older browsers
      try {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        return successful;
      } catch (fallbackError) {
        console.error('Clipboard copy failed:', fallbackError);
        return false;
      }
    }
  }

  async generateImplementationPlan(recommendations: any[]): Promise<string> {
    const quickWins = recommendations.filter(rec => rec.quickWin);
    const highImpact = recommendations.filter(rec => rec.impact.seoScore >= 8);
    const totalTime = recommendations.reduce((sum, rec) => sum + rec.impact.timeToImplement, 0);

    const plan = `
# SEO Implementation Plan

Generated on: ${new Date().toLocaleDateString()}

## Quick Wins (${quickWins.length} items - ~${quickWins.reduce((sum, rec) => sum + rec.impact.timeToImplement, 0)} minutes)

${quickWins.map(rec => `
### ${rec.title}
- **Time**: ${rec.impact.timeToImplement} minutes
- **Impact**: +${rec.impact.seoScore} SEO score
- **Code**: 
\`\`\`${rec.implementation.codeSnippet.language}
${rec.implementation.codeSnippet.after}
\`\`\`
- **Steps**:
${rec.implementation.stepByStep.map((step: string, i: number) => `  ${i + 1}. ${step}`).join('\n')}

`).join('')}

## High Impact Recommendations (${highImpact.length} items)

${highImpact.filter(rec => !rec.quickWin).map(rec => `
### ${rec.title}
- **Time**: ${rec.impact.timeToImplement} minutes
- **Impact**: +${rec.impact.seoScore} SEO score
- **Effort**: ${rec.impact.implementationEffort}
- **ROI**: ${rec.businessCase.roi}
- **Code**: 
\`\`\`${rec.implementation.codeSnippet.language}
${rec.implementation.codeSnippet.after}
\`\`\`

`).join('')}

## Summary
- **Total Recommendations**: ${recommendations.length}
- **Quick Wins**: ${quickWins.length}
- **Estimated Total Time**: ${Math.floor(totalTime / 60)}h ${totalTime % 60}m
- **Potential Score Increase**: +${recommendations.reduce((sum, rec) => sum + rec.impact.seoScore, 0)}

## Implementation Order
1. Start with Quick Wins (highest ROI)
2. Focus on High Impact items next
3. Address remaining recommendations by priority

---
Generated by SEO Director - Premium SEO Analysis Platform
    `.trim();

    return plan;
  }

  async exportImplementationPlan(recommendations: any[]): Promise<void> {
    try {
      const plan = await this.generateImplementationPlan(recommendations);
      const blob = new Blob([plan], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `seo-implementation-plan-${new Date().toISOString().split('T')[0]}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      throw new Error('Failed to export implementation plan');
    }
  }
}