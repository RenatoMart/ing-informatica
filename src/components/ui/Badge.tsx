import React from 'react';
import clsx from 'clsx';

type BadgeVariant = 'primary' | 'secondary' | 'success' | 'info' | 'gray';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

export function Badge({ children, variant = 'primary', className }: BadgeProps) {
  const variants: Record<BadgeVariant, string> = {
    primary: 'bg-primary/10 text-primary',
    secondary: 'bg-gold/20 text-yellow-900',
    success: 'bg-success/10 text-success',
    info: 'bg-blue-100 text-blue-800',
    gray: 'bg-gray-100 text-gray-800'
  };

  return (
    <span 
      className={clsx(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold',
        variants[variant] || variants.primary,
        className
      )}
    >
      {children}
    </span>
  );
}