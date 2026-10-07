import React, { useEffect, useState } from 'react';
import { useIsMutating, useMutationState } from '@tanstack/react-query';
import { SimsLogo } from './SimsLogo';
import { useEventLoader } from '../../context/EventLoadingContext';
import { cn } from '../../lib/utils';
import {
  Activity,
  ShieldCheck,
  ShoppingCart,
  Users,
  Package,
  Settings,
} from 'lucide-react';

interface MutationMetaInfo {
  title: string;
  description: string;
  icon?: React.ReactNode;
}

const getMutationInfo = (key?: unknown[]): MutationMetaInfo => {
  if (!key || !Array.isArray(key) || key.length === 0) {
    return {
      title: 'Processing Request...',
      description: 'Submitting changes to the server and updating records. Please wait...',
    };
  }

  const primary = String(key[0] || '').toLowerCase();
  const secondary = String(key[1] || '').toLowerCase();

  if (primary === 'orders') {
    if (secondary === 'create') {
      return {
        title: 'Submitting Sales Order...',
        description: 'Verifying warehouse stock, applying GST tax rules, and dispatching approvals...',
        icon: <ShoppingCart className="w-5 h-5 text-accent" />,
      };
    }
    if (secondary === 'cancel') {
      return {
        title: 'Cancelling Sales Order...',
        description: 'Releasing reserved stock items and updating system ledger...',
        icon: <ShoppingCart className="w-5 h-5 text-accent" />,
      };
    }
  }

  if (primary === 'approvals') {
    return {
      title: 'Processing Manager Approval...',
      description: 'Updating order state, deducting warehouse stock, and dispatching live email notifications...',
      icon: <ShieldCheck className="w-5 h-5 text-accent" />,
    };
  }

  if (primary === 'users') {
    return {
      title: 'Updating User Management...',
      description: 'Saving user permissions, reporting hierarchy links, and circle assignments...',
      icon: <Users className="w-5 h-5 text-accent" />,
    };
  }

  if (primary === 'products') {
    if (secondary === 'adjust-stock') {
      return {
        title: 'Adjusting Inventory Stock...',
        description: 'Recording warehouse movement transaction and re-evaluating stock velocity...',
        icon: <Package className="w-5 h-5 text-accent" />,
      };
    }
    return {
      title: 'Updating Product Catalog...',
      description: 'Saving product specifications, pricing, and stock thresholds...',
      icon: <Package className="w-5 h-5 text-accent" />,
    };
  }

  if (primary === 'customers') {
    return {
      title: 'Saving Customer Record...',
      description: 'Updating customer profile, contact details, and account state...',
      icon: <Users className="w-5 h-5 text-accent" />,
    };
  }

  if (primary === 'settings') {
    return {
      title: 'Updating System Configuration...',
      description: 'Saving threshold parameters and organizational system rules...',
      icon: <Settings className="w-5 h-5 text-accent" />,
    };
  }

  return {
    title: 'Processing Event...',
    description: 'Submitting request to the API server and synchronizing records. Please wait...',
    icon: <Activity className="w-5 h-5 text-accent" />,
  };
};

export const MainEventLoader: React.FC = () => {
  const isMutating = useIsMutating();
  const { customLoader, isGlobalMutating } = useEventLoader();

  const isLoginPage = typeof window !== 'undefined' && window.location.pathname.startsWith('/login');

  const pendingMutations = useMutationState({
    filters: { status: 'pending' },
    select: (m) => m.options.mutationKey,
  });

  const isActive = !isLoginPage && (isMutating > 0 || isGlobalMutating || customLoader.isOpen);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isActive) {
      setMounted(true);
    } else {
      timer = setTimeout(() => {
        setMounted(false);
      }, 250);
    }
    return () => clearTimeout(timer);
  }, [isActive]);

  if (!mounted) return null;

  // Resolve title and description
  let title = customLoader.title;
  let description = customLoader.description;
  let icon = customLoader.icon;

  if (!title) {
    const meta = getMutationInfo(pendingMutations[0] as unknown[]);
    title = meta.title;
    description = meta.description;
    icon = meta.icon;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className={cn(
        'fixed inset-0 z-[9990] flex items-center justify-center p-4',
        'bg-bg/60 backdrop-blur-[3px] transition-opacity duration-200',
        isActive ? 'opacity-100' : 'opacity-0 pointer-events-none'
      )}
    >
      <div
        className={cn(
          'relative flex flex-col items-center gap-4 p-6 sm:p-7 rounded-2xl',
          'bg-surface/95 border border-border/80 shadow-2xl backdrop-blur-xl',
          'max-w-sm w-full mx-auto text-center ring-1 ring-white/10 dark:ring-white/5',
          'transition-all duration-200 transform',
          isActive ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        )}
      >
        {/* Animated Brand Pulse / Dual Ring Spinner */}
        <div className="relative flex items-center justify-center w-14 h-14 shrink-0">
          <div className="absolute inset-0 rounded-full border-2 border-accent/20 border-t-accent animate-spin" />
          <div className="absolute inset-1.5 rounded-full border border-dashed border-accent/35 animate-spin [animation-duration:3s] [animation-direction:reverse]" />
          <div className="relative z-10 flex items-center justify-center">
            {icon ? (
              <div className="w-8 h-8 rounded-full bg-surfaceAlt/90 flex items-center justify-center shadow-xs">
                {icon}
              </div>
            ) : (
              <SimsLogo size={24} className="opacity-95" />
            )}
          </div>
        </div>

        {/* Text Content */}
        <div className="space-y-1.5 w-full">
          <h3 className="text-sm font-bold text-text tracking-tight flex items-center justify-center gap-1.5">
            <span>{title}</span>
          </h3>
          <p className="text-xs text-muted leading-relaxed px-1">
            {description}
          </p>
        </div>

        {/* Indeterminate Micro Progress Track */}
        <div className="w-full h-1.5 bg-surfaceAlt/80 rounded-full overflow-hidden relative border border-border/50">
          <div className="absolute top-0 bottom-0 bg-accent rounded-full animate-top-progress" />
          <div className="absolute top-0 bottom-0 bg-accent/70 rounded-full animate-top-progress-short" />
        </div>
      </div>
    </div>
  );
};
