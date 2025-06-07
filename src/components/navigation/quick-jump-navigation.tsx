import React from 'react';
import { cn } from '@/lib/utils';

export interface QuickJumpSection {
  label: string;
  href: string;
}

interface QuickJumpNavigationProps {
  sections: QuickJumpSection[];
  className?: string;
}

export function QuickJumpNavigation({ sections, className }: QuickJumpNavigationProps) {
  return (
    <nav className={cn('flex gap-2 overflow-x-auto py-2', className)} aria-label="Quick jump navigation">
      {sections.map((section) => (
        <a
          key={section.href}
          href={section.href}
          className="px-3 py-1 rounded-md bg-muted text-sm font-medium text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors whitespace-nowrap"
        >
          {section.label}
        </a>
      ))}
    </nav>
  );
} 