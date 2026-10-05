import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogOut } from 'lucide-react';
import { ThemeToggle } from '../ui/ThemeToggle';

export const UserMenu: React.FC = () => {
  const { user, logout } = useAuth();
  if (!user) return null;

  // Strip any parenthesized suffix (e.g. "(Manager)") and show pure name
  const cleanName = (user.full_name || 'User').replace(/\s*\([^)]*\)/g, '').trim();

  // Compute initials strictly from first letters of the first two words
  const getInitials = (name: string) => {
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return (parts[0]?.slice(0, 2) || 'U').toUpperCase();
  };

  return (
    <div className="pt-3 border-t border-border mt-auto shrink-0 select-none">
      <div className="flex items-center justify-between p-2 rounded-card bg-surface border border-border">
        {/* 36px avatar ringed in border color: primary fill with ink/dark initials */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="w-9 h-9 rounded-full bg-primary text-primaryText ring-2 ring-border flex items-center justify-center text-caption shrink-0 select-none shadow-card"
            title={cleanName}
          >
            {getInitials(cleanName)}
          </div>

          {/* Name & Role tag */}
          <div className="min-w-0 flex flex-col justify-center">
            <p className="text-caption text-subtitle truncate leading-tight" title={cleanName}>
              {cleanName}
            </p>
            <div className="mt-1">
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] bg-surfaceAlt text-text border border-border/70 uppercase tracking-wide leading-none">
                {user.role}
              </span>
            </div>
          </div>
        </div>

        {/* Theme toggle & Logout side-by-side on the right */}
        <div className="flex items-center gap-0.5 shrink-0 ml-1">
          <ThemeToggle />
          <button
            type="button"
            onClick={logout}
            title="Logout"
            className="p-1.5 rounded-full text-muted hover:text-text hover:bg-surfaceAlt transition-colors"
            aria-label="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
