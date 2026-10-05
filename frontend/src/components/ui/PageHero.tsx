import React from 'react';
import { Illustration, IllustrationName } from './Illustration';

export type PageHeroType =
  | 'dashboard'
  | 'orders'
  | 'create-order'
  | 'products'
  | 'customers'
  | 'inventory'
  | 'approvals'
  | 'users'
  | 'settings'
  | 'login'
  | 'not-found';

interface PageHeroProps {
  type: PageHeroType;
  className?: string;
}

export const PageHero: React.FC<PageHeroProps> = ({ type, className = '' }) => {
  const isCompact = type === 'dashboard';
  const illustrationName: IllustrationName = `page-${type}` as IllustrationName;

  return (
    <div
      className={`hidden md:flex items-center justify-center p-3 rounded-card bg-surfaceAlt border border-border shadow-card shrink-0 select-none ${
        isCompact ? 'w-[110px] h-[72px]' : 'w-[160px] h-[110px]'
      } ${className}`}
    >
      <Illustration
        name={illustrationName}
        size={isCompact ? 90 : 130}
        wrapTile={false}
        alt={`${type} header illustration`}
      />
    </div>
  );
};
