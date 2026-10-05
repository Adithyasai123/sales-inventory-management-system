import React from 'react';
import { cn } from '../../lib/utils';

export type IllustrationName =
  | 'page-dashboard'
  | 'page-orders'
  | 'page-create-order'
  | 'page-products'
  | 'page-customers'
  | 'page-inventory'
  | 'page-approvals'
  | 'page-users'
  | 'page-settings'
  | 'page-login'
  | 'page-404'
  | 'state-no-data'
  | 'state-empty-search'
  | 'state-empty-cart'
  | 'state-empty-chart'
  | 'state-all-caught-up'
  | 'state-healthy-stock'
  | 'state-connection-error'
  | 'state-success';

interface IllustrationProps {
  name: IllustrationName;
  size?: number;
  alt?: string;
  className?: string;
  wrapTile?: boolean;
}

export const Illustration: React.FC<IllustrationProps> = ({
  name,
  size = 160,
  alt = '',
  className,
  wrapTile = true,
}) => {
  const renderSvg = () => {
    switch (name) {
      case 'page-dashboard':
        return (
          <svg width={size} height={size * 0.67} viewBox="0 0 96 64" fill="none">
            {/* Dashboard Board */}
            <rect x="6" y="8" width="84" height="48" rx="8" fill="var(--color-surfaceAlt)" stroke="var(--color-border)" strokeWidth="2.5" />
            <rect x="14" y="28" width="12" height="20" rx="3" fill="var(--color-primary)" />
            <rect x="32" y="20" width="12" height="28" rx="3" fill="var(--color-primarySoft)" stroke="var(--color-accent)" strokeWidth="1.5" />
            <rect x="50" y="32" width="12" height="16" rx="3" fill="var(--color-primary)" />
            <rect x="68" y="14" width="12" height="34" rx="3" fill="var(--color-accent)" />
            {/* Rising Arrow Line */}
            <path d="M 12 30 L 32 20 L 50 32 L 74 12" stroke="var(--color-accent)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M 68 12 L 74 12 L 74 18" fill="var(--color-accent)" />
          </svg>
        );

      case 'page-orders':
        return (
          <svg width={size} height={size * 0.75} viewBox="0 0 160 120" fill="none">
            {/* Receipt Scroll Floating */}
            <rect x="15" y="20" width="55" height="80" rx="6" fill="var(--color-primarySoft)" stroke="var(--color-accent)" strokeWidth="2.5" />
            <line x1="25" y1="35" x2="55" y2="35" stroke="var(--color-accent)" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="25" y1="45" x2="50" y2="45" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round" />
            <line x1="25" y1="55" x2="58" y2="55" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round" />
            <line x1="25" y1="65" x2="45" y2="65" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round" />
            {/* Shopping Bag Front */}
            <rect x="75" y="35" width="70" height="70" rx="10" fill="var(--color-primary)" stroke="var(--color-accent)" strokeWidth="3" />
            <path d="M 95 35 C 95 20 125 20 125 35" stroke="var(--color-accent)" strokeWidth="3.5" fill="none" strokeLinecap="round" />
            <circle cx="110" cy="70" r="12" fill="var(--color-surfaceAlt)" stroke="var(--color-accent)" strokeWidth="2" />
            <path d="M 104 70 L 108 74 L 116 66" stroke="var(--color-accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        );

      case 'page-create-order':
        return (
          <svg width={size} height={size * 0.75} viewBox="0 0 160 120" fill="none">
            {/* Clipboard Body */}
            <rect x="35" y="15" width="90" height="95" rx="8" fill="var(--color-surfaceAlt)" stroke="var(--color-border)" strokeWidth="3" />
            <rect x="65" y="10" width="30" height="12" rx="4" fill="var(--color-accent)" />
            {/* Checklines */}
            <rect x="50" y="35" width="18" height="18" rx="4" fill="var(--color-primary)" stroke="var(--color-accent)" strokeWidth="2" />
            <path d="M 54 44 L 58 48 L 64 40" stroke="var(--color-accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="78" y1="44" x2="110" y2="44" stroke="var(--color-textMuted)" strokeWidth="3" strokeLinecap="round" />
            
            <rect x="50" y="65" width="18" height="18" rx="4" fill="var(--color-primarySoft)" stroke="var(--color-accent)" strokeWidth="2" />
            <path d="M 54 74 L 58 78 L 64 70" stroke="var(--color-accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="78" y1="74" x2="105" y2="74" stroke="var(--color-textMuted)" strokeWidth="3" strokeLinecap="round" />
          </svg>
        );

      case 'page-products':
        return (
          <svg width={size} height={size * 0.75} viewBox="0 0 160 120" fill="none">
            {/* Stacked Warehouse Boxes */}
            <rect x="25" y="50" width="65" height="55" rx="8" fill="var(--color-primary)" stroke="var(--color-accent)" strokeWidth="3" />
            <path d="M 25 50 L 57.5 70 L 90 50" stroke="var(--color-accent)" strokeWidth="2" fill="none" />
            <rect x="75" y="25" width="60" height="50" rx="8" fill="var(--color-primarySoft)" stroke="var(--color-accent)" strokeWidth="2.5" />
            <path d="M 75 25 L 105 42 L 135 25" stroke="var(--color-accent)" strokeWidth="2" fill="none" />
            {/* Price Tag Badge */}
            <circle cx="120" cy="80" r="16" fill="var(--color-surfaceAlt)" stroke="var(--color-accent)" strokeWidth="2" />
            <text x="111" y="85" fill="var(--color-accent)" fontSize="14" fontWeight="bold">$</text>
          </svg>
        );

      case 'page-customers':
        return (
          <svg width={size} height={size * 0.75} viewBox="0 0 160 120" fill="none">
            {/* Avatar 1 Left */}
            <circle cx="55" cy="45" r="22" fill="var(--color-primarySoft)" stroke="var(--color-accent)" strokeWidth="2.5" />
            <circle cx="55" cy="38" r="9" fill="var(--color-accent)" />
            <path d="M 39 60 C 39 52 71 52 71 60" stroke="var(--color-accent)" strokeWidth="2.5" fill="var(--color-primary)" />

            {/* Avatar 2 Right */}
            <circle cx="105" cy="45" r="22" fill="var(--color-primary)" stroke="var(--color-accent)" strokeWidth="2.5" />
            <circle cx="105" cy="38" r="9" fill="var(--color-accent)" />
            <path d="M 89 60 C 89 52 121 52 121 60" stroke="var(--color-accent)" strokeWidth="2.5" fill="var(--color-primarySoft)" />

            {/* Speech Bubble Center */}
            <rect x="62" y="70" width="36" height="26" rx="8" fill="var(--color-surfaceAlt)" stroke="var(--color-border)" strokeWidth="2" />
            <path d="M 72 96 L 68 102 L 78 96 Z" fill="var(--color-surfaceAlt)" stroke="var(--color-border)" strokeWidth="1.5" />
            <circle cx="72" cy="83" r="2" fill="var(--color-accent)" />
            <circle cx="80" cy="83" r="2" fill="var(--color-accent)" />
            <circle cx="88" cy="83" r="2" fill="var(--color-accent)" />
          </svg>
        );

      case 'page-inventory':
        return (
          <svg width={size} height={size * 0.75} viewBox="0 0 160 120" fill="none">
            {/* Shelf Frame */}
            <rect x="25" y="15" width="110" height="90" rx="8" fill="var(--color-surfaceAlt)" stroke="var(--color-border)" strokeWidth="3" />
            <line x1="25" y1="60" x2="135" y2="60" stroke="var(--color-border)" strokeWidth="3" />
            {/* Boxes on Shelf */}
            <rect x="35" y="28" width="28" height="26" rx="4" fill="var(--color-primary)" stroke="var(--color-accent)" strokeWidth="2" />
            <rect x="70" y="24" width="45" height="30" rx="4" fill="var(--color-primarySoft)" stroke="var(--color-accent)" strokeWidth="2" />
            <rect x="35" y="70" width="50" height="26" rx="4" fill="var(--color-primarySoft)" stroke="var(--color-accent)" strokeWidth="2" />
            <rect x="92" y="68" width="32" height="28" rx="4" fill="var(--color-primary)" stroke="var(--color-accent)" strokeWidth="2" />
          </svg>
        );

      case 'page-approvals':
        return (
          <svg width={size} height={size * 0.75} viewBox="0 0 160 120" fill="none">
            {/* Approval Document */}
            <rect x="40" y="15" width="80" height="95" rx="8" fill="var(--color-surfaceAlt)" stroke="var(--color-border)" strokeWidth="3" />
            <line x1="55" y1="35" x2="105" y2="35" stroke="var(--color-textMuted)" strokeWidth="3" strokeLinecap="round" />
            <line x1="55" y1="48" x2="95" y2="48" stroke="var(--color-textMuted)" strokeWidth="3" strokeLinecap="round" />
            <line x1="55" y1="61" x2="100" y2="61" stroke="var(--color-textMuted)" strokeWidth="3" strokeLinecap="round" />
            {/* Approval Stamp Seal */}
            <circle cx="95" cy="80" r="18" fill="var(--color-primary)" stroke="var(--color-accent)" strokeWidth="3" />
            <path d="M 86 80 L 92 86 L 104 74" stroke="var(--color-accent)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        );

      case 'page-users':
        return (
          <svg width={size} height={size * 0.75} viewBox="0 0 160 120" fill="none">
            {/* ID Badge Card Left */}
            <rect x="25" y="25" width="60" height="75" rx="8" fill="var(--color-primarySoft)" stroke="var(--color-accent)" strokeWidth="2.5" />
            <circle cx="55" cy="48" r="12" fill="var(--color-accent)" />
            <line x1="38" y1="72" x2="72" y2="72" stroke="var(--color-accent)" strokeWidth="3" strokeLinecap="round" />
            <line x1="42" y1="82" x2="68" y2="82" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round" />

            {/* Shield Badge Right */}
            <path d="M 115 30 L 140 40 V 65 C 140 85 115 95 115 95 C 115 95 90 85 90 65 V 40 L 115 30 Z" fill="var(--color-surfaceAlt)" stroke="var(--color-accent)" strokeWidth="3" />
            <path d="M 107 60 L 113 66 L 123 54" stroke="var(--color-accent)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        );

      case 'page-settings':
        return (
          <svg width={size} height={size * 0.75} viewBox="0 0 160 120" fill="none">
            {/* Main Gear */}
            <circle cx="65" cy="55" r="25" fill="var(--color-primarySoft)" stroke="var(--color-accent)" strokeWidth="3" />
            <circle cx="65" cy="55" r="9" fill="var(--color-surfaceAlt)" stroke="var(--color-accent)" strokeWidth="2" />

            {/* Secondary Gear */}
            <circle cx="110" cy="75" r="18" fill="var(--color-primary)" stroke="var(--color-accent)" strokeWidth="2.5" />
            <circle cx="110" cy="75" r="6" fill="var(--color-surfaceAlt)" />

            {/* Slider Controls Top Right */}
            <rect x="95" y="20" width="45" height="30" rx="6" fill="var(--color-surfaceAlt)" stroke="var(--color-border)" strokeWidth="2" />
            <line x1="103" y1="35" x2="132" y2="35" stroke="var(--color-border)" strokeWidth="3" strokeLinecap="round" />
            <circle cx="118" cy="35" r="5" fill="var(--color-accent)" />
          </svg>
        );

      case 'page-login':
        return (
          <svg width={240} height={120} viewBox="0 0 240 120" fill="none">
            {/* Background Soft Circle Base */}
            <circle cx="120" cy="60" r="55" fill="var(--color-surfaceAlt)" />
            {/* Center Box */}
            <rect x="85" y="25" width="70" height="60" rx="10" fill="var(--color-primary)" stroke="var(--color-accent)" strokeWidth="3" />
            <path d="M 85 25 L 120 45 L 155 25" stroke="var(--color-accent)" strokeWidth="2.5" fill="none" />
            {/* SIMS Leaf Mark Floating Top Left */}
            <path d="M 50 25 C 40 10 25 15 15 25 C 5 35 20 50 50 25 Z" fill="var(--color-accent)" />
            <path d="M 50 25 C 60 10 75 15 85 25 C 95 35 80 50 50 25 Z" fill="var(--color-primarySoft)" />
          </svg>
        );

      case 'page-404':
      case 'state-no-data':
        return (
          <svg width={size} height={size * 0.75} viewBox="0 0 160 120" fill="none">
            {/* Tilted Empty Box */}
            <rect x="40" y="35" width="80" height="60" rx="10" fill="var(--color-surfaceAlt)" stroke="var(--color-accent)" strokeWidth="3" strokeDasharray="6 4" />
            <circle cx="80" cy="65" r="12" fill="var(--color-primarySoft)" stroke="var(--color-accent)" strokeWidth="2" />
            <line x1="75" y1="65" x2="85" y2="65" stroke="var(--color-accent)" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        );

      case 'state-empty-search':
        return (
          <svg width={size} height={size * 0.75} viewBox="0 0 160 120" fill="none">
            {/* Magnifying Glass Lens */}
            <circle cx="70" cy="50" r="32" fill="var(--color-primarySoft)" stroke="var(--color-accent)" strokeWidth="3.5" />
            <circle cx="70" cy="50" r="22" fill="var(--color-surfaceAlt)" stroke="var(--color-border)" strokeWidth="2" />
            {/* Glass Handle */}
            <rect x="95" y="70" width="14" height="40" rx="6" fill="var(--color-accent)" transform="rotate(-45 95 70)" />
          </svg>
        );

      case 'state-empty-cart':
        return (
          <svg width={size} height={size * 0.75} viewBox="0 0 160 120" fill="none">
            {/* Cart Body */}
            <rect x="35" y="30" width="90" height="50" rx="10" fill="var(--color-primarySoft)" stroke="var(--color-accent)" strokeWidth="3" />
            <circle cx="55" cy="92" r="10" fill="var(--color-accent)" />
            <circle cx="105" cy="92" r="10" fill="var(--color-accent)" />
            <path d="M 20 20 L 35 30" stroke="var(--color-accent)" strokeWidth="3.5" strokeLinecap="round" />
          </svg>
        );

      case 'state-empty-chart':
        return (
          <svg width={size} height={size * 0.75} viewBox="0 0 160 120" fill="none">
            {/* Empty Chart Frame */}
            <rect x="30" y="20" width="100" height="80" rx="8" fill="var(--color-surfaceAlt)" stroke="var(--color-border)" strokeWidth="3" />
            <rect x="42" y="60" width="16" height="30" rx="3" fill="var(--color-primarySoft)" />
            <rect x="66" y="40" width="16" height="50" rx="3" fill="var(--color-primary)" />
            <rect x="90" y="70" width="16" height="20" rx="3" fill="var(--color-primarySoft)" />
          </svg>
        );

      case 'state-all-caught-up':
      case 'state-success':
      case 'state-healthy-stock':
        return (
          <svg width={size} height={size * 0.75} viewBox="0 0 160 120" fill="none">
            {/* Success Check Badge */}
            <circle cx="80" cy="60" r="40" fill="var(--color-primary)" stroke="var(--color-accent)" strokeWidth="3.5" />
            <path d="M 62 60 L 74 72 L 98 48" stroke="var(--color-accent)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        );

      case 'state-connection-error':
        return (
          <svg width={size} height={size * 0.75} viewBox="0 0 160 120" fill="none">
            {/* Disconnected Plug */}
            <rect x="45" y="35" width="70" height="55" rx="10" fill="var(--color-surfaceAlt)" stroke="var(--color-accent)" strokeWidth="3" />
            <rect x="60" y="15" width="10" height="20" rx="3" fill="var(--color-accent)" />
            <rect x="90" y="15" width="10" height="20" rx="3" fill="var(--color-accent)" />
            {/* Alert Cross */}
            <circle cx="80" cy="62" r="14" fill="var(--color-primarySoft)" stroke="var(--color-accent)" strokeWidth="2" />
            <path d="M 73 55 L 87 69 M 87 55 L 73 69" stroke="var(--color-accent)" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        );

      default:
        return null;
    }
  };

  const svgContent = renderSvg();

  if (!wrapTile) {
    return (
      <div className={cn('inline-flex items-center justify-center select-none', className)}>
        {svgContent}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'inline-flex items-center justify-center p-4 rounded-card bg-surfaceAlt border border-border shadow-card select-none shrink-0',
        className
      )}
      style={{ width: size, height: size }}
      aria-label={alt}
      role={alt ? 'img' : undefined}
    >
      {svgContent}
    </div>
  );
};
