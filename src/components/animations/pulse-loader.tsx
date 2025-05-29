import * as React from 'react';
import { m } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface PulseLoaderProps {
  size?: number;
  color?: string;
  className?: string;
}

export const PulseLoader: React.FC<PulseLoaderProps> = ({ size = 16, color = '#2563eb', className }) => {
  return (
    <m.div
      className={cn('inline-block rounded-full', className)}
      style={{ width: size, height: size, backgroundColor: color }}
      animate={{ scale: [1, 1.2, 1] }}
      transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
    />
  );
}; 