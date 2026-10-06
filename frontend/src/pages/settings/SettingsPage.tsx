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
    <div className="flex flex-col gap-6 w-full">
      <PageHeader
        title="System Settings"
        subtitle="Configure business rules, monetary approval thresholds, and enterprise parameters."
      />

      {/* Approval Threshold Card */}
      <div className="bg-surface rounded-card p-6 border border-border shadow-card flex flex-col gap-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-text" />
              <h2 className="text-title">
                Order Approval Threshold
              </h2>
            </div>
            <p className="text-caption mt-1 leading-relaxed max-w-xl">
              Sales orders with a total monetary amount exceeding this threshold will automatically
              enter <strong>PENDING_APPROVAL</strong> status. A manager must explicitly approve
              the order before warehouse inventory is deducted and the order completed.
            </p>
          </div>

          <div className="text-right p-3 rounded-card bg-surfaceAlt border border-border shrink-0">
            <span className="text-overline block">
              Current Active Threshold
            </span>
            <span className="text-title tabular-nums block mt-0.5">
              {isLoading ? '...' : formatCurrency(thresholdSetting?.value || 1000)}
            </span>
          </div>
        </div>

        <form
          onSubmit={handleSaveThreshold}
          className="p-4 rounded-input bg-surfaceAlt/50 border border-border flex flex-col sm:flex-row items-end gap-3"
        >
          <div className="w-full sm:w-72">
            <FormField label="New Monetary Threshold" required>
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
      <div className="bg-surface rounded-card p-6 border border-border shadow-card flex flex-col gap-4">
        <h2 className="text-title">All Configuration Parameters</h2>

        <div className="border border-border rounded-input overflow-hidden">
          <table className="w-full text-left text-caption text-text">
            <thead className="bg-surfaceAlt border-b border-border text-[11px] text-muted uppercase">
              <tr>
                <th className="px-4 py-2.5">Key</th>
                <th className="px-4 py-2.5">Value</th>
                <th className="px-4 py-2.5">Description</th>
                <th className="px-4 py-2.5 text-right">Last Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-forest-border/40">
              {settings?.map((s) => (
                <tr key={s.id} className="hover:bg-surfaceAlt/40">
                  <td className="px-4 py-3 font-mono text-body">{s.key}</td>
                  <td className="px-4 py-3 text-body tabular-nums">
                    {s.key === 'approval_threshold' ? formatCurrency(s.value) : s.value}
                  </td>
                  <td className="px-4 py-3 text-muted">{s.description || '-'}</td>
                  <td className="px-4 py-3 text-right text-muted tabular-nums">
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
