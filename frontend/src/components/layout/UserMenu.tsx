import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LogOut } from 'lucide-react';
import { ThemeToggle } from '../ui/ThemeToggle';

export const UserMenu: React.FC = () => {
  const navigate = useNavigate();
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
        {/* Clickable Profile Pill: navigates to full-screen profile & employee tree page */}
        <button
          type="button"
          onClick={() => navigate('/profile')}
          className="flex items-center gap-2.5 min-w-0 flex-1 text-left p-1 rounded-xl hover:bg-surfaceAlt/70 transition-colors group focus:outline-none focus:ring-1 focus:ring-accent/40"
          title="View full-screen profile & employee hierarchy tree"
          aria-label="View user profile"
        >
          {/* 36px avatar ringed in border color: primary fill with ink/dark initials */}
          <div className="w-9 h-9 rounded-full bg-primary text-primaryText ring-2 ring-border flex items-center justify-center text-caption shrink-0 select-none shadow-card group-hover:scale-105 transition-transform">
            {getInitials(cleanName)}
          </div>

          {/* Name & Role tag */}
          <div className="min-w-0 flex flex-col justify-center flex-1">
            <p className="text-caption text-subtitle truncate leading-tight group-hover:text-primary transition-colors font-medium">
              {cleanName}
            </p>
            <div className="mt-1 flex items-center gap-1.5 flex-wrap">
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] bg-surfaceAlt text-text border border-border/70 uppercase tracking-wide leading-none font-semibold">
                {user.role}
              </span>
              {user.branch && (
                <span className="text-[10px] text-muted truncate max-w-[80px]">
                  {user.branch}
                </span>
              )}
            </div>
          </div>
        </button>

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
