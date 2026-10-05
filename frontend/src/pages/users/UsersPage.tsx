import React, { useState } from 'react';
import { useUsers, useCreateUser, useDeleteUser } from '../../hooks/useUsers';
import { User, UserRole } from '../../types/auth';
import { PageHeader } from '../../components/ui/PageHeader';
import { DataTable, Column } from '../../components/ui/DataTable';
import { Button } from '../../components/ui/Button';
import { FormField, Input, Select } from '../../components/ui/FormField';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { formatDate } from '../../lib/utils';
import { Plus, Trash2, UserCheck, Shield } from 'lucide-react';

export const UsersPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');

  const { data, isLoading } = useUsers({
    page,
    page_size: 15,
    role: roleFilter || undefined,
    search: search || undefined,
  });

  const createUserMutation = useCreateUser();
  const deleteUserMutation = useDeleteUser();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'SALES' as UserRole,
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createUserMutation.mutateAsync(formData);
    setIsCreateOpen(false);
    setFormData({ email: '', password: '', full_name: '', role: 'SALES' });
  };

  const roleStyles: Record<string, string> = {
    ADMIN: 'bg-forest text-white border-forest',
    MANAGER: 'bg-mint-primary text-forest-dark border-mint',
    SALES: 'bg-forest-surface text-forest border-forest-border',
  };

  const columns: Column<User>[] = [
    {
      key: 'full_name',
      header: 'Name',
      render: (u) => <span className="font-medium text-forest">{u.full_name}</span>,
    },
    {
      key: 'email',
      header: 'Email Address',
      render: (u) => <span className="text-forest text-xs">{u.email}</span>,
    },
    {
      key: 'role',
      header: 'Assigned Role',
      render: (u) => (
        <span
          className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${
            roleStyles[u.role] || 'bg-forest-surface'
          }`}
        >
          {u.role}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (u) => (
        <span
          className={`px-2 py-0.5 rounded-full text-[11px] font-medium border ${
            u.is_active
              ? 'bg-mint-primary text-forest-dark border-mint'
              : 'bg-forest-surface text-forest-muted border-forest-border'
          }`}
        >
          {u.is_active ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (u) => (
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setDeletingUser(u)}
            className="p-1.5 rounded-full hover:bg-forest-surface text-forest-muted hover:text-forest transition-colors"
            title="Deactivate User"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="User Administration"
        subtitle="Manage user accounts, credential security, and role-based permissions (Admin exclusive)."
        action={
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsCreateOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add New User
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={data?.items}
        total={data?.total}
        page={page}
        pageSize={15}
        totalPages={data?.total_pages}
        isLoading={isLoading}
        onPageChange={setPage}
        searchPlaceholder="Search users by name or email..."
        searchValue={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        filters={
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 rounded-full text-xs font-medium border border-forest-border bg-white text-forest focus:outline-none"
          >
            <option value="">All Roles</option>
            <option value="ADMIN">ADMIN</option>
            <option value="MANAGER">MANAGER</option>
            <option value="SALES">SALES</option>
          </select>
        }
      />

      {/* Create User Modal */}
      <ConfirmDialog
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onConfirm={() => {}}
        title="Add New User"
        description="Create an account and assign a role within SIMS."
        confirmLabel=""
        cancelLabel="Close"
      >
        <form onSubmit={handleCreate} className="flex flex-col gap-3.5 mt-2">
          <FormField label="Full Name" required>
            <Input
              placeholder="e.g. Alice Smith"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              required
            />
          </FormField>

          <FormField label="Email Address" required>
            <Input
              type="email"
              placeholder="alice@sims.local"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </FormField>

          <FormField label="Initial Password" required>
            <Input
              type="password"
              placeholder="Minimum 6 characters"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              minLength={6}
              required
            />
          </FormField>

          <FormField label="Role Assignment" required>
            <Select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
            >
              <option value="SALES">SALES — Can create orders and view catalog</option>
              <option value="MANAGER">MANAGER — Can review/approve orders and adjust stock</option>
              <option value="ADMIN">ADMIN — Full system administrative access</option>
            </Select>
          </FormField>

          <div className="flex justify-end gap-2 pt-3 border-t border-forest-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsCreateOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={createUserMutation.isPending}
            >
              Create Account
            </Button>
          </div>
        </form>
      </ConfirmDialog>

      {/* Deactivate User Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingUser}
        onClose={() => setDeletingUser(null)}
        onConfirm={async () => {
          if (deletingUser) {
            await deleteUserMutation.mutateAsync(deletingUser.id);
            setDeletingUser(null);
          }
        }}
        title="Deactivate User"
        description={`Are you sure you want to deactivate account "${deletingUser?.email}"? They will no longer be able to log in.`}
        confirmLabel="Deactivate Account"
        variant="danger"
        isLoading={deleteUserMutation.isPending}
      />
    </div>
  );
};
