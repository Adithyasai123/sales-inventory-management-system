import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogOut, User as UserIcon, Shield } from 'lucide-react';

export const UserMenu: React.FC = () => {
  const { user, logout } = useAuth();
  if (!user) return null;

  const roleBadgeStyles: Record<string, string> = {
    ADMIN: 'bg-white/20 text-white border-white/30',
    MANAGER: 'bg-mint-primary text-forest-dark border-mint',
    SALES: 'bg-forest-surface text-forest border-forest-border',
  };

  return (
    <div className="flex items-center justify-between p-3 rounded-card bg-forest-dark/40 border border-white/10 mt-auto">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-8 h-8 rounded-full bg-mint-primary text-forest-dark flex items-center justify-center font-medium text-xs shrink-0">
          {user.full_name.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-white truncate">{user.full_name}</p>
          <div className="flex items-center gap-1 mt-0.5">
            <span
              className={`text-[10px] font-medium px-2 py-0.2 rounded-full border ${
                roleBadgeStyles[user.role] || 'bg-white/10 text-white'
              }`}
            >
              {user.role}
            </span>
          </div>
        </div>
      </div>

      <button
        onClick={logout}
        title="Logout"
        className="text-forest-surface/70 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition-colors"
      >
        <LogOut className="w-4 h-4" />
      </button>
    </div>
  );
};
