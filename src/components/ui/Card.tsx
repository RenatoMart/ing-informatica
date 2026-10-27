import React from 'react';
import clsx from 'clsx';

export function Card({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div 
      className={clsx('bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden', className)} 
      {...props}
    >
      {children}
    </div>
  );
}