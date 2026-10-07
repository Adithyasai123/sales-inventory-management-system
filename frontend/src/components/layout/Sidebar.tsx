import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { usePendingApprovals } from '../../hooks/useApprovals';
import { UserMenu } from './UserMenu';
import { SimsLogo } from '../ui/SimsLogo';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  Layers,
  CheckSquare,
  UserCheck,
  Sliders,
  Activity,
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface SidebarProps {
  isMobileDrawer?: boolean;
  onCloseMobileDrawer?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isMobileDrawer = false,
  onCloseMobileDrawer,
}) => {
  const { user, isSuperAdmin } = useAuth();
  const { data: pendingData } = usePendingApprovals({ page: 1, page_size: 1 });
  const pendingCount = pendingData?.total || 0;

  const navItems = [
    {
      to: '/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      screenId: 'dashboard',
      roles: ['ADMIN', 'MANAGER', 'SALES', 'WAREHOUSE', 'FINANCE'],
    },
    {
      to: '/orders',
      label: 'Sales Orders',
      icon: ShoppingCart,
      screenId: 'orders',
      roles: ['ADMIN', 'MANAGER', 'SALES', 'WAREHOUSE', 'FINANCE'],
    },
    {
      to: '/products',
      label: 'Products',
      icon: Package,
      screenId: 'products',
      roles: ['ADMIN', 'MANAGER', 'SALES', 'WAREHOUSE', 'FINANCE'],
    },
    {
      to: '/customers',
      label: 'Customers',
      icon: Users,
      screenId: 'customers',
      roles: ['ADMIN', 'MANAGER', 'SALES', 'FINANCE'],
    },
    {
      to: '/inventory',
      label: 'Inventory',
      icon: Layers,
      screenId: 'inventory',
      roles: ['ADMIN', 'MANAGER', 'SALES', 'WAREHOUSE', 'FINANCE'],
    },
    {
      to: '/approvals',
      label: 'Approvals',
      icon: CheckSquare,
      screenId: 'approvals',
      badge: pendingCount > 0 ? pendingCount : undefined,
      roles: ['ADMIN', 'MANAGER'],
    },
    {
      to: '/settings',
      label: 'Settings',
      icon: Sliders,
      screenId: 'settings',
      roles: ['ADMIN', 'MANAGER'],
    },
    {
      to: '/users',
      label: isSuperAdmin ? 'User Management' : 'My Team',
      icon: UserCheck,
      screenId: 'users',
      roles: ['MANAGER', 'ADMIN'],
    },
    {
      to: '/audit',
      label: 'Audit & Emails',
      icon: Activity,
      screenId: 'audit',
      roles: ['MANAGER', 'ADMIN', 'FINANCE'],
    },
  ];

  const filteredNav = navItems.filter((item) => {
    if (!user) return false;
    // Manager is Super Admin and has access to all screens
    if (isSuperAdmin) return true;

    // Check basic role requirement
    if (!item.roles.includes(user.role)) return false;

    // Check screen access permissions configured by Manager
    if (user.allowed_screens && user.allowed_screens.length > 0) {
      return user.allowed_screens.includes(item.screenId);
    }
    return true;
  });

  return (
    <aside
      className={cn(
        'bg-sidebar border-r border-border select-none flex flex-col overflow-hidden',
        isMobileDrawer
          ? 'h-full w-[240px] p-4'
          : 'fixed top-0 left-0 h-[100dvh] w-[var(--sidebar-w)] rounded-none p-4 z-30'
      )}
    >
      {/* Brand Header: Logo mark + SIMS on one line */}
      <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-border shrink-0 px-1">
        <SimsLogo size={32} />
        <div>
          <span className="text-title text-sidebarText block leading-tight">
            SIMS
          </span>
          <span className="text-[10px] text-muted tracking-wider uppercase block">
            Sales &amp; Inventory
          </span>
        </div>
      </div>

      {/* Nav items in middle */}
      <nav className="flex-1 flex flex-col gap-1.5 overflow-y-auto">
        {filteredNav.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={isMobileDrawer ? onCloseMobileDrawer : undefined}
              className={({ isActive }) =>
                cn(
                  'flex items-center justify-between h-[40px] min-h-[40px] px-3.5 rounded-full text-body transition-all duration-150',
                  isActive
                    ? 'bg-navActive text-navActiveText shadow-card'
                    : 'text-sidebarText/90 hover:text-sidebarText hover:bg-sidebarHover'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <div className="flex items-center gap-3">
                    <Icon
                      className={cn(
                        'w-[18px] h-[18px] shrink-0 transition-colors',
                        isActive ? 'text-navActiveText' : 'text-sidebarIcon'
                      )}
                    />
                    <span className="truncate">{item.label}</span>
                  </div>

                  {item.badge !== undefined && (
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded-full text-[10px] tabular-nums shrink-0',
                        isActive
                          ? 'bg-primary text-primaryText'
                          : 'bg-primary text-primaryText'
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

      {/* User / role / theme toggle / logout pinned bottom with mt-auto */}
      <UserMenu />
    </aside>
  );
};
