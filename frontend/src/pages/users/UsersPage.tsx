import React, { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser } from '../../hooks/useUsers';
import { useRoles } from '../../hooks/useRoles';
import { useAuth } from '../../context/AuthContext';
import { User, UserRole, Role } from '../../types/auth';
import { RolesTab } from './RolesTab';
import { PageHeader } from '../../components/ui/PageHeader';
import { DataTable, Column } from '../../components/ui/DataTable';
import { Button } from '../../components/ui/Button';
import { FormField, Input } from '../../components/ui/FormField';
import { Toggle } from '../../components/ui/Toggle';
import { SlideOver } from '../../components/ui/SlideOver';
import { SearchableSelect, SelectOption } from '../../components/ui/SearchableSelect';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import {
  Plus,
  Trash2,
  Shield,
  Edit2,
  Users as UsersIcon,
  CheckCircle2,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  LayoutDashboard,
  ShoppingCart,
  Package,
  Layers,
  CheckSquare,
  Sliders,
  UserCheck,
  Mail,
  User as UserIcon,
  Briefcase,
  UserPlus,
  Activity,
  Database,
} from 'lucide-react';
import { cn } from '../../lib/utils';

const AVAILABLE_SCREENS = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    desc: 'Real-time sales telemetry, executive KPIs & inventory velocity metrics',
  },
  {
    id: 'orders',
    label: 'Sales Orders',
    icon: ShoppingCart,
    desc: 'Create, review, and dispatch sales orders & invoice fulfillment',
  },
  {
    id: 'products',
    label: 'Products',
    icon: Package,
    desc: 'Product cataloging, SKU classification, retail pricing & margins',
  },
  {
    id: 'customers',
    label: 'Customers',
    icon: UsersIcon,
    desc: 'Corporate client directory, company profiles, credit lines & contacts',
  },
  {
    id: 'inventory',
    label: 'Inventory',
    icon: Layers,
    desc: 'Stock velocity, multi-warehouse movements & ledger audit trails',
  },
  {
    id: 'approvals',
    label: 'Approvals',
    icon: CheckSquare,
    desc: 'Manager approval routing for sales orders exceeding policy threshold',
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Sliders,
    desc: 'System thresholds, company profile rules & currency locale standards',
  },
  {
    id: 'users',
    label: 'User Admin',
    icon: UserCheck,
    desc: 'Account security, role definitions, password resets & screen access',
  },
  {
    id: 'audit',
    label: 'Audit & Emails',
    icon: Activity,
    desc: 'Audit trail and transaction email delivery logs',
  },
];

const DEFAULT_SALES_SCREENS = ['dashboard', 'orders', 'products', 'customers', 'inventory'];
const DEFAULT_WAREHOUSE_SCREENS = ['dashboard', 'products', 'inventory', 'orders'];
const DEFAULT_FINANCE_SCREENS = ['dashboard', 'orders', 'customers', 'inventory', 'audit'];
const ALL_SCREENS = AVAILABLE_SCREENS.map((s) => s.id);

const getDefaultScreensForRole = (role: UserRole) => {
  if (role === 'MANAGER' || role === 'ADMIN') return ALL_SCREENS;
  if (role === 'WAREHOUSE') return DEFAULT_WAREHOUSE_SCREENS;
  if (role === 'FINANCE') return DEFAULT_FINANCE_SCREENS;
  return DEFAULT_SALES_SCREENS;
};

export const UsersPage: React.FC = () => {
  const { user: currentUser, isSuperAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<'users' | 'roles'>('users');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');

  const { data: rolesData } = useRoles();

  const { data, isLoading } = useUsers({
    page,
    page_size: 20,
    role: roleFilter && roleFilter !== 'ALL' ? roleFilter : undefined,
    search: search || undefined,
  });

  const createUserMutation = useCreateUser();
  const updateUserMutation = useUpdateUser();
  const deleteUserMutation = useDeleteUser();

  // Create Drawer State
  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);
  const [createShowPassword, setCreateShowPassword] = useState(false);
  const [createForm, setCreateForm] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'SALES' as UserRole,
    role_id: undefined as number | undefined,
    manager_id: undefined as number | undefined,
    is_active: true,
    allowed_screens: [...DEFAULT_SALES_SCREENS],
  });

  // Edit Drawer State
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editShowPassword, setEditShowPassword] = useState(false);
  const [editForm, setEditForm] = useState({
    email: '',
    full_name: '',
    role: 'SALES' as UserRole,
    role_id: undefined as number | undefined,
    manager_id: undefined as number | undefined,
    password: '', // optional password update
    is_active: true,
    allowed_screens: [] as string[],
  });

  // Delete Dialog State
  const [deletingUser, setDeletingUser] = useState<User | null>(null);

  // Status Toggle Dialog State
  const [confirmStatusUser, setConfirmStatusUser] = useState<{
    user: User;
    newStatus: boolean;
  } | null>(null);

  // Available Managers for Super Admin assignment
  const managerOptions = useMemo<SelectOption[]>(() => {
    if (!data?.items) return [];
    const mgrs = data.items.filter((u) => u.role === 'MANAGER' || u.is_super_admin);
    return mgrs.map((m) => ({
      value: m.id,
      label: m.full_name,
      description: m.is_super_admin ? 'Super Admin' : `Manager • ${m.email}`,
      badge: m.is_super_admin ? 'Super Admin' : 'Manager',
      badgeColor: m.is_super_admin ? 'bg-purple-500/10 text-purple-600' : 'bg-blue-500/10 text-blue-600',
      icon: Briefcase,
    }));
  }, [data?.items]);

  // Role select options dynamically populated from SQL database
  const roleSelectOptions = useMemo<SelectOption[]>(() => {
    const roleIconMap: Record<string, any> = {
      ADMIN: Shield,
      MANAGER: Briefcase,
      SALES: UsersIcon,
      WAREHOUSE: Layers,
      FINANCE: Activity,
    };

    if (rolesData && rolesData.length > 0) {
      return rolesData
        .filter((r) => isSuperAdmin || (!['MANAGER', 'ADMIN'].includes(r.name) && !r.is_system))
        .map((r) => ({
          value: r.name,
          label: r.display_name,
          description: r.description || `Authorized Screens: ${r.allowed_screens.join(', ') || 'None'}`,
          badge: r.display_name,
          icon: roleIconMap[r.name] || Shield,
        }));
    }

    const operationalRoles = [
      {
        value: 'SALES',
        label: 'Sales Representative',
        description: 'Frontline order creation, client relationships & catalog view',
        badge: 'Sales',
        icon: UsersIcon,
      },
      {
        value: 'WAREHOUSE',
        label: 'Warehouse Specialist',
        description: 'Physical inventory management, cycle counts & stock adjustments',
        badge: 'Warehouse',
        icon: Layers,
      },
      {
        value: 'FINANCE',
        label: 'Finance & Auditor',
        description: 'Audit transactional email trails, invoice records & compliance logs',
        badge: 'Finance',
        icon: Activity,
      },
    ];

    if (isSuperAdmin) {
      return [
        ...operationalRoles,
        {
          value: 'MANAGER',
          label: 'Regional Manager',
          description: 'Can create and manage their own team employees & order approvals',
          badge: 'Manager',
          icon: Briefcase,
        },
        {
          value: 'ADMIN',
          label: 'System Administrator',
          description: 'System-level operational configurations & full access',
          badge: 'Admin',
          icon: Shield,
        },
      ];
    }
    return operationalRoles;
  }, [rolesData, isSuperAdmin]);

  // Role filter options for the table toolbar (from DB)
  const roleFilterOptions = useMemo<SelectOption[]>(() => {
    const base: SelectOption[] = [{ value: 'ALL', label: 'All Roles' }];
    if (rolesData && rolesData.length > 0) {
      return [
        ...base,
        ...rolesData.map((r) => ({
          value: r.name,
          label: r.display_name,
          badge: r.display_name,
        })),
      ];
    }
    return [
      ...base,
      { value: 'MANAGER', label: 'Managers', badge: 'Manager' },
      { value: 'SALES', label: 'Sales Reps', badge: 'Sales' },
      { value: 'WAREHOUSE', label: 'Warehouse', badge: 'Warehouse' },
      { value: 'FINANCE', label: 'Finance', badge: 'Finance' },
      { value: 'ADMIN', label: 'Administrators', badge: 'Admin' },
    ];
  }, [rolesData]);

  // Non-SuperAdmin managers can never assign the 'users' screen to any user
  const assignableScreens = useMemo(() => {
    return isSuperAdmin
      ? AVAILABLE_SCREENS
      : AVAILABLE_SCREENS.filter((s) => s.id !== 'users');
  }, [isSuperAdmin]);

  const allAssignableIds = useMemo(() => {
    return assignableScreens.map((s) => s.id);
  }, [assignableScreens]);

  const handleOpenCreate = () => {
    const salesDbRole = rolesData?.find((r) => r.name === 'SALES');
    setCreateForm({
      email: '',
      password: '',
      full_name: '',
      role: 'SALES',
      role_id: salesDbRole?.id,
      manager_id: isSuperAdmin ? undefined : currentUser?.id,
      is_active: true,
      allowed_screens: salesDbRole?.allowed_screens?.length ? [...salesDbRole.allowed_screens] : [...DEFAULT_SALES_SCREENS],
    });
    setCreateShowPassword(false);
    setIsCreateDrawerOpen(true);
  };

  const handleOpenEdit = (u: User) => {
    setEditingUser(u);
    const dbRole = rolesData?.find((r) => r.id === u.role_id || r.name === u.role);
    setEditForm({
      email: u.email,
      full_name: u.full_name,
      role: u.role,
      role_id: u.role_id || dbRole?.id,
      manager_id: u.manager_id || undefined,
      password: '',
      is_active: u.is_active,
      allowed_screens:
        u.is_super_admin || u.role === 'MANAGER'
          ? (isSuperAdmin ? [...ALL_SCREENS] : [...allAssignableIds])
          : u.allowed_screens && u.allowed_screens.length > 0
          ? u.allowed_screens.filter((s) => isSuperAdmin ? true : s !== 'users')
          : dbRole?.allowed_screens?.length
          ? [...dbRole.allowed_screens]
          : [...DEFAULT_SALES_SCREENS],
    });
    setEditShowPassword(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = createForm.email.trim().toLowerCase();
    if (!cleanEmail.includes('@')) {
      toast.error('Please enter a valid email address.');
      return;
    }
    if (data?.items?.some((u) => u.email.toLowerCase() === cleanEmail)) {
      toast.error(`Email "${cleanEmail}" is already registered to an existing user.`);
      return;
    }
    const finalScreens = (createForm.role === 'MANAGER' ? allAssignableIds : createForm.allowed_screens)
      .filter((s) => (isSuperAdmin ? true : s !== 'users'));

    const dbRole = rolesData?.find((r) => r.name === createForm.role || r.id === createForm.role_id);

    await createUserMutation.mutateAsync({
      email: cleanEmail,
      password: createForm.password,
      full_name: createForm.full_name.trim(),
      role: createForm.role,
      role_id: createForm.role_id || dbRole?.id,
      manager_id: createForm.manager_id || currentUser?.id,
      is_active: createForm.is_active,
      allowed_screens: finalScreens,
    });
    setIsCreateDrawerOpen(false);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    const cleanEmail = editForm.email.trim().toLowerCase();
    if (!cleanEmail.includes('@')) {
      toast.error('Please enter a valid email address.');
      return;
    }
    if (data?.items?.some((u) => u.id !== editingUser.id && u.email.toLowerCase() === cleanEmail)) {
      toast.error(`Email "${cleanEmail}" is already registered to another user.`);
      return;
    }

    const finalScreens = (editForm.role === 'MANAGER' ? allAssignableIds : editForm.allowed_screens)
      .filter((s) => (isSuperAdmin ? true : s !== 'users'));

    const dbRole = rolesData?.find((r) => r.name === editForm.role || r.id === editForm.role_id);

    const payload: any = {
      email: cleanEmail,
      full_name: editForm.full_name.trim(),
      role: editForm.role,
      role_id: editForm.role_id || dbRole?.id,
      manager_id: isSuperAdmin ? editForm.manager_id : editingUser.manager_id,
      is_active: editForm.is_active,
      allowed_screens: finalScreens,
    };
    if (editForm.password && editForm.password.trim().length >= 6) {
      payload.password = editForm.password.trim();
    }

    await updateUserMutation.mutateAsync({
      id: editingUser.id,
      payload,
    });
    setEditingUser(null);
  };

  const toggleScreenAccess = (screenId: string, isEdit: boolean = false) => {
    if (!isSuperAdmin && screenId === 'users') {
      toast.error('Managers cannot grant or modify access to User Administration.');
      return;
    }
    if (isEdit) {
      const current = editForm.allowed_screens;
      const updated = current.includes(screenId)
        ? current.filter((id) => id !== screenId)
        : [...current, screenId];
      setEditForm({ ...editForm, allowed_screens: updated });
    } else {
      const current = createForm.allowed_screens;
      const updated = current.includes(screenId)
        ? current.filter((id) => id !== screenId)
        : [...current, screenId];
      setCreateForm({ ...createForm, allowed_screens: updated });
    }
  };

  const roleStyles: Record<string, string> = {
    MANAGER: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30 font-semibold',
    ADMIN: 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30 font-semibold',
    SALES: 'bg-surfaceAlt text-text border-border font-medium',
    WAREHOUSE: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 font-medium',
    FINANCE: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 font-medium',
  };

  const columns: Column<User>[] = [
    {
      key: 'full_name',
      header: 'User & Email',
      width: '280px',
      render: (u) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-accent/15 text-accent font-bold text-xs flex items-center justify-center shrink-0">
            {u.full_name.charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-body font-medium">{u.full_name}</span>
              {u.is_super_admin && (
                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30">
                  Super Admin
                </span>
              )}
            </div>
            <span className="text-[11px] text-muted">{u.email}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Assigned Role',
      width: '150px',
      render: (u) => {
        const dbRole = rolesData?.find((r) => r.id === u.role_id || r.name === u.role);
        const displayName =
          dbRole?.display_name ||
          (u.is_super_admin
            ? 'Super Admin'
            : u.role === 'MANAGER'
            ? 'Manager'
            : u.role === 'ADMIN'
            ? 'Admin'
            : u.role === 'WAREHOUSE'
            ? 'Warehouse'
            : u.role === 'FINANCE'
            ? 'Finance'
            : u.role === 'SALES'
            ? 'Sales Rep'
            : u.role);

        return (
          <span
            className={cn(
              'px-2.5 py-0.5 rounded-full text-[11px] border inline-flex items-center gap-1',
              roleStyles[u.role] || 'bg-surfaceAlt text-text border-border'
            )}
          >
            {u.is_super_admin ? (
              <Sparkles className="w-3 h-3 text-purple-500 shrink-0" />
            ) : u.role === 'MANAGER' ? (
              <Shield className="w-3 h-3 text-blue-500 shrink-0" />
            ) : u.role === 'ADMIN' ? (
              <Shield className="w-3 h-3 text-purple-500 shrink-0" />
            ) : u.role === 'WAREHOUSE' ? (
              <Layers className="w-3 h-3 text-amber-500 shrink-0" />
            ) : u.role === 'FINANCE' ? (
              <Activity className="w-3 h-3 text-emerald-500 shrink-0" />
            ) : (
              <UsersIcon className="w-3 h-3 text-muted shrink-0" />
            )}
            {displayName}
          </span>
        );
      },
    },
    {
      key: 'allowed_screens',
      header: 'Screen Permissions',
      width: '300px',
      render: (u) => {
        if (u.is_super_admin || u.role === 'MANAGER') {
          return (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-surfaceAlt text-text border border-border">
                <Shield className="w-3 h-3 text-accent" />
                All Modules ({u.is_super_admin ? 'Super Admin' : 'Manager'})
              </span>
              <span className="text-[10px] text-muted font-medium">8/8 screens</span>
            </div>
          );
        }
        const screens =
          u.allowed_screens && u.allowed_screens.length > 0
            ? u.allowed_screens
            : DEFAULT_SALES_SCREENS;
        const allScreenLabels = screens
          .map((screenId) => AVAILABLE_SCREENS.find((s) => s.id === screenId)?.label || screenId)
          .join(', ');

        return (
          <div className="flex items-center gap-2" title={`Allowed screens: ${allScreenLabels}`}>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-surfaceAlt text-text border border-border shrink-0">
              <Layers className="w-3 h-3 text-accent" />
              <span className="font-semibold text-accent">{screens.length}</span>/8 Screens
            </span>
            <div className="flex items-center gap-1 overflow-hidden">
              {screens.slice(0, 3).map((screenId) => {
                const item = AVAILABLE_SCREENS.find((s) => s.id === screenId);
                return (
                  <span
                    key={screenId}
                    className="px-2 py-0.5 rounded text-[10px] font-medium bg-surfaceAlt/60 text-muted border border-border/80 whitespace-nowrap"
                  >
                    {item ? item.label : screenId}
                  </span>
                );
              })}
              {screens.length > 3 && (
                <span
                  className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-surfaceAlt text-muted border border-border shrink-0 cursor-default"
                  title={allScreenLabels}
                >
                  +{screens.length - 3} more
                </span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Active Status',
      width: '140px',
      render: (u) => {
        // Prevent deactivating the only super admin
        const isSelfSuperAdmin = u.is_super_admin;
        return (
          <div
            className="flex items-center gap-2"
            onClick={(e) => e.stopPropagation()}
          >
            <Toggle
              size="sm"
              checked={u.is_active}
              disabled={isSelfSuperAdmin || updateUserMutation.isPending}
              onChange={() => {
                if (!isSelfSuperAdmin && !updateUserMutation.isPending) {
                  setConfirmStatusUser({
                    user: u,
                    newStatus: !u.is_active,
                  });
                }
              }}
            />
            <span
              className={cn(
                'text-[11px] font-medium transition-colors select-none',
                isSelfSuperAdmin ? 'cursor-default' : 'cursor-pointer hover:underline',
                u.is_active ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted'
              )}
              onClick={(e) => {
                e.stopPropagation();
                if (!isSelfSuperAdmin && !updateUserMutation.isPending) {
                  setConfirmStatusUser({
                    user: u,
                    newStatus: !u.is_active,
                  });
                }
              }}
            >
              {u.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
        );
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      width: '100px',
      render: (u) => {
        return (
          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => handleOpenEdit(u)}
              className="p-1.5 rounded-lg hover:bg-surfaceAlt text-muted hover:text-text transition-colors"
              title="Edit User in Drawer"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            {!u.is_super_admin && (
              <button
                onClick={() => setDeletingUser(u)}
                className="p-1.5 rounded-lg hover:bg-dangerSoft text-muted hover:text-danger transition-colors"
                title="Deactivate User"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="flex flex-col gap-6 w-full">
      <PageHeader
        title={isSuperAdmin ? 'User & Access Administration' : 'My Team & Access Management'}
        subtitle={
          isSuperAdmin
            ? 'Enterprise RBAC: Provision team members, configure granular screen authorization, and manage dynamic SQL database roles.'
            : 'Manage direct sales employees, configure screen permissions, and inspect assigned database capabilities.'
        }
        action={
          activeTab === 'users' ? (
            <Button
              variant="primary"
              size="sm"
              onClick={handleOpenCreate}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              {isSuperAdmin ? 'Add New User' : 'Add Team Member'}
            </Button>
          ) : undefined
        }
      />

      {/* Primary Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-border pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('users')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-all',
            activeTab === 'users'
              ? 'bg-accent text-white shadow-sm'
              : 'text-muted hover:text-text hover:bg-surfaceAlt'
          )}
        >
          <UsersIcon className="w-4 h-4" />
          <span>User Directory</span>
          <span
            className={cn(
              'ml-1 px-1.5 py-0.2 rounded-full text-[10px]',
              activeTab === 'users' ? 'bg-white/20 text-white' : 'bg-surfaceAlt text-muted'
            )}
          >
            {data?.total ?? 0}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('roles')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-all',
            activeTab === 'roles'
              ? 'bg-accent text-white shadow-sm'
              : 'text-muted hover:text-text hover:bg-surfaceAlt'
          )}
        >
          <Database className="w-4 h-4" />
          <span>Dynamic SQL Roles &amp; RBAC</span>
          <span
            className={cn(
              'ml-1 px-1.5 py-0.2 rounded-full text-[10px]',
              activeTab === 'roles' ? 'bg-white/20 text-white' : 'bg-surfaceAlt text-muted'
            )}
          >
            {rolesData?.length ?? 5}
          </span>
        </button>
      </div>

      {activeTab === 'roles' ? (
        <RolesTab isSuperAdmin={isSuperAdmin} />
      ) : (
        <>
          {/* Summary KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-surface border border-border shadow-sm">
              <div className="text-caption text-muted font-medium flex items-center justify-between">
                <span>{isSuperAdmin ? 'Total System Accounts' : 'My Team Members'}</span>
                <UsersIcon className="w-4 h-4 text-accent" />
              </div>
              <div className="text-2xl font-bold text-text mt-1.5">
                {data?.total ?? 0}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-surface border border-border shadow-sm">
              <div className="text-caption text-muted font-medium flex items-center justify-between">
                <span>Active Users</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1.5">
                {data?.items.filter((u) => u.is_active).length ?? 0}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-surface border border-border shadow-sm">
              <div className="text-caption text-muted font-medium flex items-center justify-between">
                <span>Sales Employees</span>
                <UsersIcon className="w-4 h-4 text-blue-500" />
              </div>
              <div className="text-2xl font-bold text-text mt-1.5">
                {data?.items.filter((u) => u.role === 'SALES').length ?? 0}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-surface border border-border shadow-sm">
              <div className="text-caption text-muted font-medium flex items-center justify-between">
                <span>{isSuperAdmin ? 'Super Admins & Managers' : 'Inactive Members'}</span>
                <Shield className="w-4 h-4 text-purple-500" />
              </div>
              <div className="text-2xl font-bold text-text mt-1.5">
                {isSuperAdmin
                  ? data?.items.filter((u) => u.role === 'MANAGER' || u.is_super_admin).length ?? 0
                  : data?.items.filter((u) => !u.is_active).length ?? 0}
              </div>
            </div>
          </div>

          <DataTable
            columns={columns}
            data={data?.items}
            total={data?.total}
            page={page}
            pageSize={20}
            totalPages={data?.total_pages}
            isLoading={isLoading}
            onPageChange={setPage}
            searchPlaceholder={
              isSuperAdmin
                ? 'Search all system users by name or email...'
                : 'Search your team members by name or email...'
            }
            searchValue={search}
            onSearchChange={(val) => {
              setSearch(val);
              setPage(1);
            }}
            filters={
              <div className="w-48">
                <SearchableSelect
                  value={roleFilter}
                  onChange={(val) => {
                    setRoleFilter(val);
                    setPage(1);
                  }}
                  options={roleFilterOptions}
                  placeholder="Filter by Role"
                  minSearchCount={10}
                />
              </div>
            }
          />
        </>
      )}

      {/* CREATE USER DRAWER (EXPACIOUS SLIDEOVER) */}
      <SlideOver
        isOpen={isCreateDrawerOpen}
        onClose={() => setIsCreateDrawerOpen(false)}
        title={isSuperAdmin ? 'Create User Account' : 'Add Team Member'}
        subtitle={
          isSuperAdmin
            ? 'Provision new Managers, Administrators, or Sales Representatives.'
            : 'Add a new sales employee to your team with customized screen access.'
        }
        width="2xl"
      >
        <form onSubmit={handleCreate} className="flex flex-col gap-8 pb-10">
          {/* Section 1: Profile & Identity */}
          <div className="p-6 rounded-2xl bg-surfaceAlt/40 border border-border space-y-5">
            <div className="flex items-center gap-2 pb-2 border-b border-border">
              <UserIcon className="w-4 h-4 text-accent" />
              <h3 className="text-xs font-bold text-text uppercase tracking-wider">
                Profile &amp; Identity
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <FormField label="Full Name" required>
                <Input
                  placeholder="e.g. Rahul Deshmukh"
                  value={createForm.full_name}
                  onChange={(e) => setCreateForm({ ...createForm, full_name: e.target.value })}
                  required
                  className="py-2.5 px-3.5 text-sm"
                />
              </FormField>

              <FormField label="Email Address (@sims.in)" required>
                <div className="relative">
                  <Input
                    type="email"
                    placeholder="rahul@sims.in"
                    value={createForm.email}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                    required
                    className="py-2.5 pl-9 pr-3.5 text-sm"
                  />
                  <Mail className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </FormField>
            </div>

            {/* Role & Reporting Structure */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
              <div>
                <SearchableSelect
                  label="Role Assignment"
                  required
                  value={createForm.role}
                  onChange={(val) => {
                    const role = val as UserRole;
                    const dbRole = rolesData?.find((r) => r.name === role);
                    setCreateForm({
                      ...createForm,
                      role,
                      role_id: dbRole?.id,
                      allowed_screens: dbRole?.allowed_screens?.length
                        ? [...dbRole.allowed_screens]
                        : getDefaultScreensForRole(role),
                    });
                  }}
                  options={roleSelectOptions}
                  minSearchCount={10}
                />
              </div>

              {isSuperAdmin && ['SALES', 'WAREHOUSE', 'FINANCE'].includes(createForm.role) && (
                <div>
                  <SearchableSelect
                    label="Assign to Regional Manager"
                    description="Allocate this employee to a specific Manager's team"
                    value={createForm.manager_id}
                    onChange={(val) => setCreateForm({ ...createForm, manager_id: val })}
                    options={managerOptions}
                    placeholder="Select Manager..."
                    searchPlaceholder="Search managers by name..."
                    minSearchCount={2}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Security Credentials */}
          <div className="p-6 rounded-2xl bg-surfaceAlt/40 border border-border space-y-5">
            <div className="flex items-center gap-2 pb-2 border-b border-border">
              <Lock className="w-4 h-4 text-accent" />
              <h3 className="text-xs font-bold text-text uppercase tracking-wider">
                Security Credentials
              </h3>
            </div>

            <FormField label="Initial Password" required description="Must be at least 6 characters long">
              <div className="relative">
                <Input
                  type={createShowPassword ? 'text' : 'password'}
                  placeholder="Minimum 6 characters"
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  minLength={6}
                  required
                  className="py-2.5 pl-9 pr-10 text-sm"
                />
                <Lock className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <button
                  type="button"
                  onClick={() => setCreateShowPassword(!createShowPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-text p-1 transition-colors"
                >
                  {createShowPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </FormField>
          </div>

          {/* Section 3: Status Toggle Card */}
          <div
            className="p-6 rounded-2xl bg-surfaceAlt/40 border border-border flex items-center justify-between cursor-pointer hover:border-accent/40 transition-colors"
            onClick={() => setCreateForm({ ...createForm, is_active: !createForm.is_active })}
          >
            <div className="space-y-1 pr-4">
              <div className="text-sm font-semibold text-text flex items-center gap-2">
                <span>Account Status</span>
                <span
                  className={cn(
                    'px-2.5 py-0.5 rounded-full text-[11px] font-medium border',
                    createForm.is_active
                      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                      : 'bg-surface text-muted border-border'
                  )}
                >
                  {createForm.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <p className="text-xs text-muted leading-relaxed">
                Active users can sign into SIMS immediately with their assigned credentials.
              </p>
            </div>
            <div onClick={(e) => e.stopPropagation()}>
              <Toggle
                size="lg"
                checked={createForm.is_active}
                onChange={(val) => setCreateForm({ ...createForm, is_active: val })}
              />
            </div>
          </div>

          {/* Section 4: Screen Access Permissions */}
          <div className="p-6 rounded-2xl bg-surfaceAlt/40 border border-border space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-2 border-b border-border">
              <div>
                <h3 className="text-xs font-bold text-text uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-accent" />
                  Screen Access Permissions
                </h3>
                <p className="text-xs text-muted mt-0.5">
                  {createForm.role === 'MANAGER'
                    ? 'Manager has unrestricted access to all screens across their team.'
                    : 'Choose which screens this user is authorized to access in navigation.'}
                </p>
              </div>

              {createForm.role !== 'MANAGER' && (
                <div className="flex items-center gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => setCreateForm({ ...createForm, allowed_screens: [...allAssignableIds] })}
                    className="text-xs text-accent hover:underline font-medium"
                  >
                    Select All
                  </button>
                  <span className="text-border text-xs">|</span>
                  <button
                    type="button"
                    onClick={() => setCreateForm({ ...createForm, allowed_screens: [...DEFAULT_SALES_SCREENS] })}
                    className="text-xs text-muted hover:text-text font-medium"
                  >
                    Default Sales
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
              {assignableScreens.map((screen) => {
                const Icon = screen.icon;
                const isSelected =
                  createForm.role === 'MANAGER' ||
                  createForm.allowed_screens.includes(screen.id);
                return (
                  <div
                    key={screen.id}
                    onClick={() => {
                      if (createForm.role !== 'MANAGER') {
                        toggleScreenAccess(screen.id, false);
                      }
                    }}
                    className={cn(
                      'flex items-center justify-between p-4 rounded-xl border text-left transition-all',
                      createForm.role === 'MANAGER'
                        ? 'opacity-85 cursor-default bg-surface border-border'
                        : 'cursor-pointer hover:border-accent/40 shadow-sm',
                      isSelected
                        ? 'bg-accent/5 border-accent/35 ring-1 ring-accent/20'
                        : 'bg-surface border-border'
                    )}
                  >
                    <div className="flex items-start gap-3 pr-3">
                      <div
                        className={cn(
                          'p-2 rounded-lg shrink-0 mt-0.5',
                          isSelected
                            ? 'bg-accent text-accentText'
                            : 'bg-surfaceAlt text-muted'
                        )}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-text">{screen.label}</span>
                        <span className="text-[11px] text-muted line-clamp-2 mt-0.5 leading-normal">
                          {screen.desc}
                        </span>
                      </div>
                    </div>
                    <div onClick={(e) => e.stopPropagation()}>
                      <Toggle
                        size="md"
                        checked={isSelected}
                        disabled={createForm.role === 'MANAGER'}
                        onChange={() => toggleScreenAccess(screen.id, false)}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="sticky bottom-0 bg-surface/95 backdrop-blur-md p-4 -mx-6 -mb-6 border-t border-border flex justify-end gap-3 z-10">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => setIsCreateDrawerOpen(false)}
              className="px-5 font-medium"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={createUserMutation.isPending}
              className="px-6 font-medium"
            >
              Create Account
            </Button>
          </div>
        </form>
      </SlideOver>

      {/* EDIT USER DRAWER (EXPACIOUS SLIDEOVER) */}
      <SlideOver
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        title={`Edit User: ${editingUser?.full_name}`}
        subtitle="Manage credentials, reporting manager, active state, and screen access permissions."
        width="2xl"
      >
        <form onSubmit={handleUpdate} className="flex flex-col gap-8 pb-10">
          {/* Section 1: Profile Details */}
          <div className="p-6 rounded-2xl bg-surfaceAlt/40 border border-border space-y-5">
            <div className="flex items-center gap-2 pb-2 border-b border-border">
              <UserIcon className="w-4 h-4 text-accent" />
              <h3 className="text-xs font-bold text-text uppercase tracking-wider">
                Profile Information
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <FormField label="Full Name" required>
                <Input
                  value={editForm.full_name}
                  onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                  required
                  className="py-2.5 px-3.5 text-sm"
                />
              </FormField>

              <FormField label="Email Address (@sims.in)" required>
                <div className="relative">
                  <Input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    required
                    className="py-2.5 pl-9 pr-3.5 text-sm"
                  />
                  <Mail className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </FormField>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
              <div>
                <SearchableSelect
                  label="Role Assignment"
                  required
                  disabled={!isSuperAdmin && editingUser?.role !== 'SALES'}
                  value={editForm.role}
                  onChange={(val) => {
                    const role = val as UserRole;
                    const dbRole = rolesData?.find((r) => r.name === role);
                    setEditForm({
                      ...editForm,
                      role,
                      role_id: dbRole?.id,
                      allowed_screens:
                        role === 'MANAGER'
                          ? ALL_SCREENS
                          : dbRole?.allowed_screens?.length
                          ? [...dbRole.allowed_screens]
                          : editForm.allowed_screens,
                    });
                  }}
                  options={roleSelectOptions}
                  minSearchCount={10}
                />
              </div>

              {isSuperAdmin && ['SALES', 'WAREHOUSE', 'FINANCE'].includes(editForm.role) && (
                <div>
                  <SearchableSelect
                    label="Assigned Regional Manager"
                    value={editForm.manager_id}
                    onChange={(val) => setEditForm({ ...editForm, manager_id: val })}
                    options={managerOptions}
                    placeholder="Select Manager..."
                    searchPlaceholder="Search managers by name..."
                    minSearchCount={2}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Password Reset */}
          <div className="p-6 rounded-2xl bg-surfaceAlt/40 border border-border space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-border">
              <Lock className="w-4 h-4 text-accent" />
              <h3 className="text-xs font-bold text-text uppercase tracking-wider">
                Reset Password
              </h3>
            </div>

            <FormField
              label="New Password"
              description="Leave blank if you wish to keep the user's current password unchanged."
            >
              <div className="relative">
                <Input
                  type={editShowPassword ? 'text' : 'password'}
                  placeholder="Enter new password (min. 6 characters)"
                  value={editForm.password}
                  onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                  minLength={6}
                  className="py-2.5 pl-9 pr-10 text-sm"
                />
                <Lock className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <button
                  type="button"
                  onClick={() => setEditShowPassword(!editShowPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-text p-1 transition-colors"
                >
                  {editShowPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </FormField>
          </div>

          {/* Section 3: Status Toggle Card */}
          <div
            className={cn(
              'p-6 rounded-2xl bg-surfaceAlt/40 border border-border flex items-center justify-between transition-colors',
              editingUser?.is_super_admin ? 'cursor-default' : 'cursor-pointer hover:border-accent/40'
            )}
            onClick={() => {
              if (!editingUser?.is_super_admin) {
                setEditForm({ ...editForm, is_active: !editForm.is_active });
              }
            }}
          >
            <div className="space-y-1 pr-4">
              <div className="text-sm font-semibold text-text flex items-center gap-2">
                <span>Account Status</span>
                <span
                  className={cn(
                    'px-2.5 py-0.5 rounded-full text-[11px] font-medium border',
                    editForm.is_active
                      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                      : 'bg-surface text-muted border-border'
                  )}
                >
                  {editForm.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <p className="text-xs text-muted leading-relaxed">
                Active accounts are permitted to authenticate and access authorized SIMS features.
              </p>
            </div>
            <div onClick={(e) => e.stopPropagation()}>
              <Toggle
                size="lg"
                disabled={editingUser?.is_super_admin}
                checked={editForm.is_active}
                onChange={(val) => setEditForm({ ...editForm, is_active: val })}
              />
            </div>
          </div>

          {/* Section 4: Screen Access Permissions */}
          <div className="p-6 rounded-2xl bg-surfaceAlt/40 border border-border space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-2 border-b border-border">
              <div>
                <h3 className="text-xs font-bold text-text uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-accent" />
                  Screen Access Permissions
                </h3>
                <p className="text-xs text-muted mt-0.5">
                  {editForm.role === 'MANAGER'
                    ? 'Manager has unrestricted access to all screens across their team.'
                    : 'Grant or revoke access to specific SIMS navigation modules.'}
                </p>
              </div>

              {editForm.role !== 'MANAGER' && (
                <div className="flex items-center gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => setEditForm({ ...editForm, allowed_screens: [...allAssignableIds] })}
                    className="text-xs text-accent hover:underline font-medium"
                  >
                    Select All
                  </button>
                  <span className="text-border text-xs">|</span>
                  <button
                    type="button"
                    onClick={() => setEditForm({ ...editForm, allowed_screens: [...DEFAULT_SALES_SCREENS] })}
                    className="text-xs text-muted hover:text-text font-medium"
                  >
                    Default Sales
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
              {assignableScreens.map((screen) => {
                const Icon = screen.icon;
                const isSelected =
                  editForm.role === 'MANAGER' ||
                  editForm.allowed_screens.includes(screen.id);
                return (
                  <div
                    key={screen.id}
                    onClick={() => {
                      if (editForm.role !== 'MANAGER') {
                        toggleScreenAccess(screen.id, true);
                      }
                    }}
                    className={cn(
                      'flex items-center justify-between p-4 rounded-xl border text-left transition-all',
                      editForm.role === 'MANAGER'
                        ? 'opacity-85 cursor-default bg-surface border-border'
                        : 'cursor-pointer hover:border-accent/40 shadow-sm',
                      isSelected
                        ? 'bg-accent/5 border-accent/35 ring-1 ring-accent/20'
                        : 'bg-surface border-border'
                    )}
                  >
                    <div className="flex items-start gap-3 pr-3">
                      <div
                        className={cn(
                          'p-2 rounded-lg shrink-0 mt-0.5',
                          isSelected
                            ? 'bg-accent text-accentText'
                            : 'bg-surfaceAlt text-muted'
                        )}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-text">{screen.label}</span>
                        <span className="text-[11px] text-muted line-clamp-2 mt-0.5 leading-normal">
                          {screen.desc}
                        </span>
                      </div>
                    </div>
                    <div onClick={(e) => e.stopPropagation()}>
                      <Toggle
                        size="md"
                        checked={isSelected}
                        disabled={editForm.role === 'MANAGER'}
                        onChange={() => toggleScreenAccess(screen.id, true)}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="sticky bottom-0 bg-surface/95 backdrop-blur-md p-4 -mx-6 -mb-6 border-t border-border flex justify-end gap-3 z-10">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => setEditingUser(null)}
              className="px-5 font-medium"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={updateUserMutation.isPending}
              className="px-6 font-medium"
            >
              Save Changes
            </Button>
          </div>
        </form>
      </SlideOver>

      {/* DEACTIVATE CONFIRMATION DIALOG */}
      <ConfirmDialog
        isOpen={!!deletingUser}
        onClose={() => setDeletingUser(null)}
        onConfirm={async () => {
          if (deletingUser) {
            await deleteUserMutation.mutateAsync(deletingUser.id);
            setDeletingUser(null);
          }
        }}
        title="Deactivate Account"
        description={`Are you sure you want to deactivate account "${deletingUser?.email}"? They will no longer be able to log in.`}
        confirmLabel="Deactivate Account"
        variant="danger"
        isLoading={deleteUserMutation.isPending}
      />

      {/* STATUS TOGGLE CONFIRMATION DIALOG */}
      <ConfirmDialog
        isOpen={!!confirmStatusUser}
        onClose={() => setConfirmStatusUser(null)}
        onConfirm={async () => {
          if (confirmStatusUser) {
            await updateUserMutation.mutateAsync({
              id: confirmStatusUser.user.id,
              payload: { is_active: confirmStatusUser.newStatus },
            });
            setConfirmStatusUser(null);
          }
        }}
        title={confirmStatusUser?.newStatus ? 'Activate User Account' : 'Deactivate User Account'}
        description={
          confirmStatusUser?.newStatus
            ? `Are you sure you want to activate the account for "${confirmStatusUser?.user.full_name || confirmStatusUser?.user.email}"? They will regain access to SIMS.`
            : `Are you sure you want to deactivate the account for "${confirmStatusUser?.user.full_name || confirmStatusUser?.user.email}"? Their active session will be invalidated and they will no longer be able to log in.`
        }
        confirmLabel={confirmStatusUser?.newStatus ? 'Activate Account' : 'Deactivate Account'}
        variant={confirmStatusUser?.newStatus ? 'primary' : 'danger'}
        isLoading={updateUserMutation.isPending}
      />
    </div>
  );
};
