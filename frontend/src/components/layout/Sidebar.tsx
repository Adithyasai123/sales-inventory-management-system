import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { usePendingApprovals } from '../../hooks/useApprovals';
import { UserMenu } from './UserMenu';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  Layers,
  CheckSquare,
  UserCheck,
  Sliders,
  Boxes,
} from 'lucide-react';
import { cn } from '../../lib/utils';

export const Sidebar: React.FC = () => {
  const { user, isManager, isAdmin } = useAuth();
  const { data: pendingData } = usePendingApprovals({ page: 1, page_size: 1 });
  const pendingCount = pendingData?.total || 0;

  const navItems = [
    {
      to: '/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      roles: ['ADMIN', 'MANAGER', 'SALES'],
    },
    {
      to: '/orders',
      label: 'Sales Orders',
      icon: ShoppingCart,
      roles: ['ADMIN', 'MANAGER', 'SALES'],
    },
    {
      to: '/products',
      label: 'Products',
      icon: Package,
      roles: ['ADMIN', 'MANAGER', 'SALES'],
    },
    {
      to: '/customers',
      label: 'Customers',
      icon: Users,
      roles: ['ADMIN', 'MANAGER', 'SALES'],
    },
    {
      to: '/inventory',
      label: 'Inventory',
      icon: Layers,
      roles: ['ADMIN', 'MANAGER', 'SALES'],
    },
    {
      to: '/approvals',
      label: 'Approvals',
      icon: CheckSquare,
      badge: pendingCount > 0 ? pendingCount : undefined,
      roles: ['ADMIN', 'MANAGER'],
    },
    {
      to: '/settings',
      label: 'Settings',
      icon: Sliders,
      roles: ['ADMIN', 'MANAGER'],
    },
    {
      to: '/users',
      label: 'User Admin',
      icon: UserCheck,
      roles: ['ADMIN'],
    },
  ];

  const filteredNav = navItems.filter((item) =>
    user ? item.roles.includes(user.role) : false
  );

  return (
    <aside className="w-64 bg-forest text-white rounded-card flex flex-col p-4 shadow-flat h-full shrink-0 select-none">
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-3 py-3 mb-6 border-b border-white/10">
        <div className="w-9 h-9 rounded-full bg-mint-primary text-forest-dark flex items-center justify-center font-bold text-base shrink-0 shadow-flat">
          <Boxes className="w-5 h-5 text-forest-dark" />
        </div>
        <div>
          <h1 className="font-serif text-lg font-medium tracking-tight text-white leading-tight">
            SIMS
          </h1>
          <p className="text-[11px] text-forest-border font-medium">Sales & Inventory</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 flex flex-col gap-1.5 overflow-y-auto pr-1">
        <div className="px-3 mb-2 text-[10px] font-medium tracking-wider uppercase text-forest-border">
          Navigation
        </div>

        {filteredNav.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex items-center justify-between px-3.5 py-2.5 rounded-full text-xs font-medium transition-all duration-150',
                  isActive
                    ? 'bg-mint-primary text-forest-dark shadow-flat'
                    : 'text-forest-surface/80 hover:text-white hover:bg-forest-dark/40'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <div className="flex items-center gap-3">
                    <Icon
                      className={cn(
                        'w-4 h-4 shrink-0 transition-colors',
                        isActive ? 'text-forest-dark' : 'text-forest-border'
                      )}
                    />
                    <span>{item.label}</span>
                  </div>

                  {item.badge !== undefined && (
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded-full text-[10px] font-bold tabular-nums',
                        isActive
                          ? 'bg-forest text-mint-primary'
                          : 'bg-mint-primary text-forest-dark'
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User profile footer */}
      <UserMenu />
    </aside>
  );
};
