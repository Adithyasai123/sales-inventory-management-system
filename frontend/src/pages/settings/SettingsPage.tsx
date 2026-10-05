import React, { useState, useEffect } from 'react';
import { useSettings, useUpdateThreshold } from '../../hooks/useSettings';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { FormField, Input } from '../../components/ui/FormField';
import { formatCurrency, formatDate } from '../../lib/utils';
import { Sliders, ShieldAlert, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

export const SettingsPage: React.FC = () => {
  const { data: settings, isLoading } = useSettings();
  const updateThresholdMutation = useUpdateThreshold();

  const thresholdSetting = settings?.find((s) => s.key === 'approval_threshold');
  const [thresholdInput, setThresholdInput] = useState<string>('');

  useEffect(() => {
    if (thresholdSetting && thresholdSetting.value) {
      setThresholdInput(thresholdSetting.value);
    }
  }, [thresholdSetting]);

  const handleSaveThreshold = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(thresholdInput);
    if (isNaN(val) || val <= 0) {
      toast.error('Please enter a valid positive monetary threshold.');
      return;
    }
    await updateThresholdMutation.mutateAsync({ threshold: val });
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <PageHeader
        title="System Settings"
        subtitle="Configure business rules, monetary approval thresholds, and enterprise parameters."
      />

      {/* Approval Threshold Card */}
      <div className="bg-white rounded-card p-6 border border-forest-border shadow-flat flex flex-col gap-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-forest" />
              <h2 className="font-serif text-lg font-medium text-forest">
                Order Approval Threshold
              </h2>
            </div>
            <p className="text-xs text-forest-muted mt-1 leading-relaxed max-w-xl">
              Sales orders with a total monetary amount exceeding this threshold will automatically
              enter <strong>PENDING_APPROVAL</strong> status. A manager must explicitly approve
              the order before warehouse inventory is deducted and the order completed.
            </p>
          </div>

          <div className="text-right p-3 rounded-card bg-forest-surface border border-forest-border shrink-0">
            <span className="text-[10px] uppercase font-bold text-forest-muted block">
              Current Active Threshold
            </span>
            <span className="font-serif text-xl font-medium text-forest-dark tabular-nums block mt-0.5">
              {isLoading ? '...' : formatCurrency(thresholdSetting?.value || 1000)}
            </span>
          </div>
        </div>

        <form
          onSubmit={handleSaveThreshold}
          className="p-4 rounded-input bg-forest-surface/50 border border-forest-border flex flex-col sm:flex-row items-end gap-3"
        >
          <div className="w-full sm:w-72">
            <FormField label="New Monetary Threshold ($)" required>
              <Input
                type="number"
                step="1"
                min="1"
                value={thresholdInput}
                onChange={(e) => setThresholdInput(e.target.value)}
                placeholder="1000"
                required
              />
            </FormField>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={updateThresholdMutation.isPending}
            className="w-full sm:w-auto"
          >
            Update Threshold
          </Button>
        </form>
      </div>

      {/* All Settings Table */}
      <div className="bg-white rounded-card p-6 border border-forest-border shadow-flat flex flex-col gap-4">
        <h2 className="font-serif text-lg font-medium text-forest">All Configuration Parameters</h2>

        <div className="border border-forest-border rounded-input overflow-hidden">
          <table className="w-full text-left text-xs text-forest">
            <thead className="bg-forest-surface border-b border-forest-border text-[11px] font-medium text-forest-muted uppercase">
              <tr>
                <th className="px-4 py-2.5">Key</th>
                <th className="px-4 py-2.5">Value</th>
                <th className="px-4 py-2.5">Description</th>
                <th className="px-4 py-2.5 text-right">Last Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-forest-border/40">
              {settings?.map((s) => (
                <tr key={s.id} className="hover:bg-forest-surface/30">
                  <td className="px-4 py-3 font-mono font-medium text-forest">{s.key}</td>
                  <td className="px-4 py-3 font-medium text-forest-dark tabular-nums">
                    {s.key === 'approval_threshold' ? formatCurrency(s.value) : s.value}
                  </td>
                  <td className="px-4 py-3 text-forest-muted">{s.description || '-'}</td>
                  <td className="px-4 py-3 text-right text-forest-muted tabular-nums">
                    {formatDate(s.updated_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
