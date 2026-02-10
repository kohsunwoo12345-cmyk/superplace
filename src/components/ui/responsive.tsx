import React from 'react';
import { cn } from '@/lib/utils';

interface ResponsiveContainerProps {
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function ResponsiveContainer({ children, className, size = 'md' }: ResponsiveContainerProps) {
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-md sm:max-w-lg',
    lg: 'max-w-lg md:max-w-xl lg:max-w-2xl',
    xl: 'max-w-xl md:max-w-2xl lg:max-w-4xl'
  };

  return (
    <div className={cn('w-full responsive-container', sizeClasses[size], className)}>
      {children}
    </div>
  );
}

interface ResponsiveCardProps {
  children: React.ReactNode;
  className?: string;
}

export function ResponsiveCard({ children, className }: ResponsiveCardProps) {
  return (
    <div className={cn('responsive-padding rounded-lg border bg-card shadow-lg', className)}>
      {children}
    </div>
  );
}

interface ResponsiveHeadingProps {
  children: React.ReactNode;
  level?: 1 | 2 | 3;
  className?: string;
}

export function ResponsiveHeading({ children, level = 1, className }: ResponsiveHeadingProps) {
  const levelClasses = {
    1: 'responsive-heading',
    2: 'responsive-subheading',
    3: 'responsive-text font-semibold'
  };

  const Tag = `h${level}` as keyof JSX.IntrinsicElements;

  return React.createElement(
    Tag,
    { className: cn(levelClasses[level], className) },
    children
  );
}

interface ResponsiveGridProps {
  children: React.ReactNode;
  cols?: 2 | 3 | 4;
  className?: string;
}

export function ResponsiveGrid({ children, cols = 4, className }: ResponsiveGridProps) {
  const colClasses = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
  };

  return (
    <div className={cn('grid gap-4 md:gap-6', colClasses[cols], className)}>
      {children}
    </div>
  );
}
