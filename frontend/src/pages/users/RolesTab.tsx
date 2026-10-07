import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useRoles, useCreateRole, useDeleteRole } from '../../hooks/useRoles';
import { Role, RoleCreatePayload } from '../../types/auth';
import { Button } from '../../components/ui/Button';
import { SlideOver } from '../../components/ui/SlideOver';
import { FormField, Input } from '../../components/ui/FormField';
import { Toggle } from '../../components/ui/Toggle';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { EmptyState } from '../../components/ui/EmptyState';
import {
  Shield,
  Plus,
  Trash2,
  Lock,
  Layers,
  Activity,
  Briefcase,
  Users as UsersIcon,
  CheckCircle2,
  XCircle,
  Database,
  KeyRound,
  LayoutDashboard,
  ShoppingCart,
  Package,
  CheckSquare,
  Sliders,
  UserCheck,
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface RolesTabProps {
  isSuperAdmin?: boolean;
}

const AVAILABLE_SCREENS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'orders', label: 'Sales Orders', icon: ShoppingCart },
  { id: 'products', label: 'Products', icon: Package },
  { id: 'customers', label: 'Customers', icon: UsersIcon },
  { id: 'inventory', label: 'Inventory', icon: Layers },
  { id: 'approvals', label: 'Approvals', icon: CheckSquare },
  { id: 'settings', label: 'Settings', icon: Sliders },
  { id: 'users', label: 'User Admin', icon: UserCheck },
  { id: 'audit', label: 'Audit & Emails', icon: Activity },
];

export const RolesTab: React.FC<RolesTabProps> = ({ isSuperAdmin }) => {
  const { data: roles, isLoading } = useRoles();
  const createRoleMutation = useCreateRole();
  const deleteRoleMutation = useDeleteRole();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deletingRole, setDeletingRole] = useState<Role | null>(null);

  const [form, setForm] = useState<RoleCreatePayload>({
    name: '',
    display_name: '',
    description: '',
    allowed_screens: ['dashboard', 'orders', 'products', 'customers', 'inventory'],
    can_create_orders: true,
    can_approve_orders: false,
    can_adjust_stock: false,
    can_manage_products: false,
    can_manage_customers: true,
    can_manage_users: false,
    can_manage_settings: false,
    can_view_audit: false,
  });

  const handleOpenCreate = () => {
    setForm({
      name: '',
      display_name: '',
      description: '',
      allowed_screens: ['dashboard', 'orders', 'products', 'customers', 'inventory'],
      can_create_orders: true,
      can_approve_orders: false,
      can_adjust_stock: false,
      can_manage_products: false,
      can_manage_customers: true,
      can_manage_users: false,
      can_manage_settings: false,
      can_view_audit: false,
    });
    setIsCreateOpen(true);
  };

  const toggleScreen = (screenId: string) => {
    const current = form.allowed_screens || [];
    const updated = current.includes(screenId)
      ? current.filter((s) => s !== screenId)
      : [...current, screenId];
    setForm({ ...form, allowed_screens: updated });
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = form.name.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_');
    if (!cleanName) {
      toast.error('Please enter a valid role code name (e.g. DISPATCH, AUDITOR).');
      return;
    }
    if (!form.display_name.trim()) {
      toast.error('Please enter a role display name.');
      return;
    }

    await createRoleMutation.mutateAsync({
      ...form,
      name: cleanName,
      display_name: form.display_name.trim(),
      description: form.description?.trim(),
    });

    setIsCreateOpen(false);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingRole) return;
    await deleteRoleMutation.mutateAsync(deletingRole.id);
    setDeletingRole(null);
  };

  const roleIconMap: Record<string, any> = {
    ADMIN: Shield,
    MANAGER: Briefcase,
    SALES: UsersIcon,
    WAREHOUSE: Layers,
    FINANCE: Activity,
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Top Banner explaining Database dynamic RBAC */}
      <div className="p-4 sm:p-5 rounded-2xl bg-surface border border-border shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-accent/10 text-accent shrink-0 mt-0.5">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text flex items-center gap-2">
              Dynamic SQL RBAC Architecture
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                Database Managed
              </span>
            </h3>
            <p className="text-caption text-muted mt-1 leading-relaxed max-w-2xl">
              User roles and granular capability flags are stored directly in the SQL database table{' '}
              <code className="text-[11px] px-1 py-0.5 rounded bg-surfaceAlt text-accent font-mono">roles</code>.
              System roles provide protected foundation workflows, while custom dynamic roles can be defined with fine-grained screen permissions and operational abilities.
            </p>
          </div>
        </div>

        {isSuperAdmin && (
          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenCreate}
            leftIcon={<Plus className="w-4 h-4" />}
            className="shrink-0"
          >
            Create Dynamic Role
          </Button>
        )}
      </div>

      {/* Roles Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-64 rounded-2xl bg-surface border border-border animate-pulse p-6" />
          ))}
        </div>
      ) : !roles || roles.length === 0 ? (
        <EmptyState
          title="No Roles Found"
          description="No roles are currently configured in the database."
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {roles.map((r) => {
            const Icon = roleIconMap[r.name] || KeyRound;
            return (
              <div
                key={r.id}
                className="p-5 rounded-2xl bg-surface border border-border shadow-sm hover:border-accent/30 transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3 pb-3 border-b border-border">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-accent/10 text-accent shrink-0">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-body font-bold text-text">{r.display_name}</h4>
                          <span
                            className={cn(
                              'px-2 py-0.5 rounded-full text-[10px] font-semibold border uppercase tracking-wider',
                              r.is_system
                                ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20'
                                : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
                            )}
                          >
                            {r.is_system ? 'System' : 'Custom'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <code className="text-[11px] font-mono text-muted bg-surfaceAlt px-1.5 py-0.5 rounded">
                            CODE: {r.name}
                          </code>
                          <span className="text-[11px] text-muted">
                            • {r.users_count} {r.users_count === 1 ? 'user' : 'users'} assigned
                          </span>
                        </div>
                      </div>
                    </div>

                    {!r.is_system && isSuperAdmin && (
                      <button
                        onClick={() => setDeletingRole(r)}
                        className="p-1.5 rounded-lg hover:bg-dangerSoft text-muted hover:text-danger transition-colors"
                        title="Delete Role"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-caption text-muted mt-3 min-h-[32px] line-clamp-2">
                    {r.description || 'Custom role with tailored access and operational rules.'}
                  </p>

                  {/* Allowed Screens */}
                  <div className="mt-4">
                    <span className="text-[11px] font-bold text-muted uppercase tracking-wider block mb-2">
                      Authorized Screens ({r.allowed_screens.length})
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {r.allowed_screens.length === 0 ? (
                        <span className="text-xs text-muted italic">No screens assigned</span>
                      ) : (
                        r.allowed_screens.map((screen) => (
                          <span
                            key={screen}
                            className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-surfaceAlt text-text border border-border capitalize"
                          >
                            {screen}
                          </span>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Granular Capabilities Matrix */}
                  <div className="mt-4 pt-3 border-t border-border">
                    <span className="text-[11px] font-bold text-muted uppercase tracking-wider block mb-2">
                      Core System Capabilities
                    </span>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center gap-1.5 text-text">
                        {r.can_create_orders ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5 text-muted shrink-0 opacity-40" />
                        )}
                        <span className={cn(!r.can_create_orders && 'text-muted')}>Create Sales Orders</span>
                      </div>

                      <div className="flex items-center gap-1.5 text-text">
                        {r.can_approve_orders ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5 text-muted shrink-0 opacity-40" />
                        )}
                        <span className={cn(!r.can_approve_orders && 'text-muted')}>Approve Orders</span>
                      </div>

                      <div className="flex items-center gap-1.5 text-text">
                        {r.can_adjust_stock ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5 text-muted shrink-0 opacity-40" />
                        )}
                        <span className={cn(!r.can_adjust_stock && 'text-muted')}>Stock Adjustments</span>
                      </div>

                      <div className="flex items-center gap-1.5 text-text">
                        {r.can_manage_products ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5 text-muted shrink-0 opacity-40" />
                        )}
                        <span className={cn(!r.can_manage_products && 'text-muted')}>Manage Products</span>
                      </div>

                      <div className="flex items-center gap-1.5 text-text">
                        {r.can_manage_customers ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5 text-muted shrink-0 opacity-40" />
                        )}
                        <span className={cn(!r.can_manage_customers && 'text-muted')}>Manage Customers</span>
                      </div>

                      <div className="flex items-center gap-1.5 text-text">
                        {r.can_manage_users ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5 text-muted shrink-0 opacity-40" />
                        )}
                        <span className={cn(!r.can_manage_users && 'text-muted')}>User Admin</span>
                      </div>

                      <div className="flex items-center gap-1.5 text-text">
                        {r.can_manage_settings ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5 text-muted shrink-0 opacity-40" />
                        )}
                        <span className={cn(!r.can_manage_settings && 'text-muted')}>Manage Settings</span>
                      </div>

                      <div className="flex items-center gap-1.5 text-text">
                        {r.can_view_audit ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5 text-muted shrink-0 opacity-40" />
                        )}
                        <span className={cn(!r.can_view_audit && 'text-muted')}>Audit &amp; Email Logs</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-[11px] text-muted">
                  <span>Record ID: #{r.id}</span>
                  <span>{r.is_system ? 'Core System Protected' : 'Dynamic SQL Record'}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE DYNAMIC ROLE SLIDEOVER */}
      <SlideOver
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create Dynamic Database Role"
        subtitle="Configure a new role in SQL with customized screen access and system authority flags."
        width="2xl"
      >
        <form onSubmit={handleCreateSubmit} className="flex flex-col gap-6 pb-10">
          <div className="p-5 rounded-2xl bg-surfaceAlt/40 border border-border space-y-4">
            <h4 className="text-xs font-bold text-text uppercase tracking-wider">Identity &amp; Metadata</h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Role Display Name" required description="e.g. Purchasing Coordinator">
                <Input
                  placeholder="Purchasing Coordinator"
                  value={form.display_name}
                  onChange={(e) => setForm({ ...form, display_name: e.target.value })}
                  required
                />
              </FormField>

              <FormField label="Role Code (Unique Uppercase)" required description="e.g. PURCHASING">
                <Input
                  placeholder="PURCHASING"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value.toUpperCase() })}
                  required
                />
              </FormField>
            </div>

            <FormField label="Description" description="Describe role responsibilities and scope.">
              <Input
                placeholder="Handles supplier procurement, warehouse requisitions, and inventory."
                value={form.description || ''}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </FormField>
          </div>

          {/* Screen Access Checklist */}
          <div className="p-5 rounded-2xl bg-surfaceAlt/40 border border-border space-y-4">
            <h4 className="text-xs font-bold text-text uppercase tracking-wider">Authorized Screens</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {AVAILABLE_SCREENS.map((screen) => {
                const ScreenIcon = screen.icon;
                const isSelected = form.allowed_screens?.includes(screen.id);
                return (
                  <div
                    key={screen.id}
                    onClick={() => toggleScreen(screen.id)}
                    className={cn(
                      'p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-colors',
                      isSelected
                        ? 'bg-accent/10 border-accent/40 text-text'
                        : 'bg-surface border-border text-muted hover:border-accent/20'
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <ScreenIcon className={cn('w-4 h-4', isSelected ? 'text-accent' : 'text-muted')} />
                      <span className="text-xs font-medium">{screen.label}</span>
                    </div>
                    <Toggle checked={!!isSelected} onChange={() => toggleScreen(screen.id)} />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Granular Capabilities */}
          <div className="p-5 rounded-2xl bg-surfaceAlt/40 border border-border space-y-4">
            <h4 className="text-xs font-bold text-text uppercase tracking-wider">Granular Capabilities</h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { key: 'can_create_orders', label: 'Create Sales Orders', desc: 'Can submit new customer orders' },
                { key: 'can_approve_orders', label: 'Approve Sales Orders', desc: 'Can approve high-value transactions' },
                { key: 'can_adjust_stock', label: 'Adjust Inventory', desc: 'Stock receipts and cycle counts' },
                { key: 'can_manage_products', label: 'Manage Products', desc: 'Create, update, and manage SKUs' },
                { key: 'can_manage_customers', label: 'Manage Customers', desc: 'Create and update customer profiles' },
                { key: 'can_manage_users', label: 'User Administration', desc: 'Provision users and reset passwords' },
                { key: 'can_manage_settings', label: 'System Settings', desc: 'Modify system thresholds and policy' },
                { key: 'can_view_audit', label: 'View Audit Logs', desc: 'Inspect email dispatch & movements logs' },
              ].map((cap) => {
                const val = !!form[cap.key as keyof RoleCreatePayload];
                return (
                  <div
                    key={cap.key}
                    onClick={() => setForm({ ...form, [cap.key]: !val })}
                    className="p-3 rounded-xl bg-surface border border-border flex items-center justify-between cursor-pointer hover:border-accent/30 transition-colors"
                  >
                    <div>
                      <div className="text-xs font-medium text-text">{cap.label}</div>
                      <div className="text-[10px] text-muted">{cap.desc}</div>
                    </div>
                    <Toggle checked={val} onChange={() => setForm({ ...form, [cap.key]: !val })} />
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={createRoleMutation.isPending}>
              Create Database Role
            </Button>
          </div>
        </form>
      </SlideOver>

      {/* DELETE ROLE CONFIRMATION */}
      <ConfirmDialog
        isOpen={!!deletingRole}
        onClose={() => setDeletingRole(null)}
        onConfirm={handleDeleteConfirm}
        title={`Delete Role: ${deletingRole?.display_name || ''}`}
        description="Are you sure you want to delete this custom role from the SQL database? This action cannot be undone. Any active users assigned to this role must be reassigned first."
        confirmLabel="Delete Role"
        variant="danger"
        isLoading={deleteRoleMutation.isPending}
      />
    </div>
  );
};
