import React from 'react';
import { ProductLine } from '../../types';

interface LogoProps {
  line?: ProductLine | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeMap = {
  sm: 'text-base',
  md: 'text-xl',
  lg: 'text-2xl',
  xl: 'text-4xl',
};

export const Logo: React.FC<LogoProps> = ({ line, size = 'md', className = '' }) => {
  const textSize = sizeMap[size];
  return (
    <span className={`font-logo font-bold tracking-tight ${textSize} ${className}`}>
      <span className="text-slate-900">PrintMy</span>
      <span className="text-sky-400">[</span>
      {line && <span className="text-sky-400">{line}</span>}
      <span className="text-sky-400">]</span>
      <span className="text-slate-900">3D</span>
    </span>
  );
};
