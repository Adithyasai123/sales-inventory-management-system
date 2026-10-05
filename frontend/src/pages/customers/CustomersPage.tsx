import React, { useState } from 'react';
import {
  useCustomers,
  useCreateCustomer,
  useUpdateCustomer,
  useDeleteCustomer,
} from '../../hooks/useCustomers';
import { Customer, CustomerInput } from '../../types/customer';
import { PageHeader } from '../../components/ui/PageHeader';
import { DataTable, Column } from '../../components/ui/DataTable';
import { Button } from '../../components/ui/Button';
import { FormField, Input } from '../../components/ui/FormField';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Plus, Edit3, Trash2, Mail, Phone, Building } from 'lucide-react';

export const CustomersPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const { data, isLoading } = useCustomers({
    page,
    page_size: 15,
    search: search || undefined,
  });

  const createCustomerMutation = useCreateCustomer();
  const updateCustomerMutation = useUpdateCustomer();
  const deleteCustomerMutation = useDeleteCustomer();

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [deletingCustomer, setDeletingCustomer] = useState<Customer | null>(null);

  const [formData, setFormData] = useState<CustomerInput>({
    name: '',
    email: '',
    phone: '',
    company: '',
    address: '',
    city: '',
    country: '',
  });

  const handleOpenCreate = () => {
    setEditingCustomer(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      company: '',
      address: '',
      city: '',
      country: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      email: customer.email,
      phone: customer.phone || '',
      company: customer.company || '',
      address: customer.address || '',
      city: customer.city || '',
      country: customer.country || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCustomer) {
      await updateCustomerMutation.mutateAsync({
        id: editingCustomer.id,
        payload: formData,
      });
    } else {
      await createCustomerMutation.mutateAsync(formData);
    }
    setIsModalOpen(false);
  };

  const columns: Column<Customer>[] = [
    {
      key: 'name',
      header: 'Customer',
      render: (c) => (
        <div>
          <span className="text-body block">{c.name}</span>
          {c.company && (
            <span className="text-caption flex items-center gap-1 mt-0.5">
              <Building className="w-3 h-3 text-muted/70" /> {c.company}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'email',
      header: 'Contact',
      render: (c) => (
        <div className="flex flex-col gap-0.5 text-caption">
          <span className="flex items-center gap-1 text-text">
            <Mail className="w-3 h-3 text-muted" /> {c.email}
          </span>
          {c.phone && (
            <span className="flex items-center gap-1 text-caption tabular-nums">
              <Phone className="w-3 h-3 text-muted/70" /> {c.phone}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'location',
      header: 'Location',
      render: (c) => (
        <span className="text-caption">
          {[c.city, c.country].filter(Boolean).join(', ') || '-'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (c) => (
        <span
          className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${
            c.is_active
              ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
              : 'bg-surfaceAlt text-muted border-border'
          }`}
        >
          {c.is_active ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (c) => (
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => handleOpenEdit(c)}
            className="p-1.5 rounded-full hover:bg-surfaceAlt text-muted hover:text-text transition-colors"
            title="Edit Customer"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setDeletingCustomer(c)}
            className="p-1.5 rounded-full hover:bg-dangerSoft text-muted hover:text-danger transition-colors"
            title="Delete Customer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6 w-full">
      <PageHeader
        title="Customer Directory"
        subtitle="Manage client contact records, billing entities, and order affiliations."
        action={
          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenCreate}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add Customer
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
        searchPlaceholder="Search by name, company, email, or phone..."
        searchValue={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
      />

      {/* Create / Edit Customer Modal */}
      <ConfirmDialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={() => {}}
        title={editingCustomer ? 'Edit Customer' : 'Add New Customer'}
        description="Enter customer profile details. Email address must be unique."
        confirmLabel=""
        cancelLabel="Close"
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5 mt-2">
          <FormField label="Full Name / Primary Contact" required>
            <Input
              placeholder="e.g. John Doe"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Email Address" required>
              <Input
                type="email"
                placeholder="client@company.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </FormField>
            <FormField label="Phone Number">
              <Input
                placeholder="+1 555-0100"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </FormField>
          </div>

          <FormField label="Company Name">
            <Input
              placeholder="e.g. Acme Corporation"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
            />
          </FormField>

          <FormField label="Street Address">
            <Input
              placeholder="123 Business Boulevard"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="City">
              <Input
                placeholder="Austin"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
            </FormField>
            <FormField label="Country">
              <Input
                placeholder="United States"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              />
            </FormField>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={createCustomerMutation.isPending || updateCustomerMutation.isPending}
            >
              {editingCustomer ? 'Save Changes' : 'Create Customer'}
            </Button>
          </div>
        </form>
      </ConfirmDialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingCustomer}
        onClose={() => setDeletingCustomer(null)}
        onConfirm={async () => {
          if (deletingCustomer) {
            await deleteCustomerMutation.mutateAsync(deletingCustomer.id);
            setDeletingCustomer(null);
          }
        }}
        title="Delete Customer"
        description={`Are you sure you want to deactivate customer "${deletingCustomer?.name}"? Historical orders will remain intact.`}
        confirmLabel="Deactivate"
        variant="danger"
        isLoading={deleteCustomerMutation.isPending}
      />
    </div>
  );
};
