import React, { useState } from 'react';
import { useEmailLogs, useAuditStats } from '../../hooks/useAudit';
import { PageHeader } from '../../components/ui/PageHeader';
import { DataTable, Column } from '../../components/ui/DataTable';
import { formatDate } from '../../lib/utils';
import { EmailLogEntry } from '../../api';
import { SlideOver } from '../../components/ui/SlideOver';
import { Mail, CheckCircle2, Clock, XCircle, ShieldCheck, Activity, RefreshCw } from 'lucide-react';

export const AuditLogsPage: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [search, setSearch] = useState('');
  const [selectedLog, setSelectedLog] = useState<EmailLogEntry | null>(null);

  const { data: logs, isLoading, refetch, isFetching } = useEmailLogs(statusFilter);
  const { data: stats } = useAuditStats();

  const filteredLogs = (logs || []).filter((log) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      log.recipient.toLowerCase().includes(q) ||
      log.subject.toLowerCase().includes(q) ||
      (log.body_preview && log.body_preview.toLowerCase().includes(q))
    );
  });

  const columns: Column<EmailLogEntry>[] = [
    {
      key: 'status',
      header: 'Delivery Status',
      width: '140px',
      render: (log) => {
        switch (log.status) {
          case 'SENT':
            return (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                <CheckCircle2 className="w-3 h-3" /> Delivered
              </span>
            );
          case 'PENDING':
            return (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                <Clock className="w-3 h-3" /> In Queue
              </span>
            );
          case 'FAILED':
            return (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-500 border border-rose-500/20">
                <XCircle className="w-3 h-3" /> Failed
              </span>
            );
          default:
            return <span>{log.status}</span>;
        }
      },
    },
    {
      key: 'recipient',
      header: 'Recipient',
      width: '240px',
      render: (log) => (
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-surfaceAlt border border-border flex items-center justify-center text-textMuted shrink-0">
            <Mail className="w-3 h-3" />
          </div>
          <span className="font-medium text-text text-sm">{log.recipient}</span>
        </div>
      ),
    },
    {
      key: 'subject',
      header: 'Subject & Preview',
      width: '380px',
      render: (log) => (
        <div className="flex flex-col max-w-[380px]">
          <span className="font-medium text-text text-sm truncate">{log.subject}</span>
          {log.body_preview && (
            <span className="text-caption text-textMuted truncate text-[11px]">{log.body_preview}</span>
          )}
        </div>
      ),
    },
    {
      key: 'created_at',
      header: 'Timestamp',
      width: '160px',
      className: 'text-textMuted text-[11px] tabular-nums',
      render: (log) => formatDate(log.created_at),
    },
    {
      key: 'actions',
      header: 'Inspect',
      width: '100px',
      render: (log) => (
        <button
          onClick={() => setSelectedLog(log)}
          className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-surfaceAlt hover:bg-surface border border-border text-text transition-colors"
        >
          View Log
        </button>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6 w-full">
      <PageHeader
        title="Audit & Transactional Notifications"
        subtitle="Real-time log of security events, manager approval requests, and automated dispatch receipts."
        action={
          <button
            onClick={() => refetch()}
            className="p-2 rounded-lg bg-surfaceAlt hover:bg-surface border border-border text-text transition-colors"
            title="Refresh Logs"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          </button>
        }
      />

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-card bg-surface border border-border shadow-card flex items-center justify-between">
          <div>
            <span className="text-caption text-textMuted uppercase font-semibold text-[11px]">Total Notifications</span>
            <p className="text-title text-2xl font-bold mt-1 tabular-nums">{stats?.total_emails ?? '...'}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-surfaceAlt flex items-center justify-center text-accent">
            <Mail className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-card bg-surface border border-border shadow-card flex items-center justify-between">
          <div>
            <span className="text-caption text-textMuted uppercase font-semibold text-[11px]">Delivered</span>
            <p className="text-title text-2xl font-bold mt-1 text-emerald-500 tabular-nums">{stats?.sent_emails ?? '...'}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-card bg-surface border border-border shadow-card flex items-center justify-between">
          <div>
            <span className="text-caption text-textMuted uppercase font-semibold text-[11px]">In Queue / Pending</span>
            <p className="text-title text-2xl font-bold mt-1 text-amber-500 tabular-nums">{stats?.pending_emails ?? '...'}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-card bg-surface border border-border shadow-card flex items-center justify-between">
          <div>
            <span className="text-caption text-textMuted uppercase font-semibold text-[11px]">Ledger Audit Entries</span>
            <p className="text-title text-2xl font-bold mt-1 text-accent tabular-nums">{stats?.recent_movements ?? '...'}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-surfaceAlt flex items-center justify-center text-accent">
            <Activity className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-card bg-surface border border-border">
        <div className="flex items-center gap-2">
          {['', 'SENT', 'PENDING', 'FAILED'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-caption font-semibold transition-colors ${
                statusFilter === s
                  ? 'bg-accent text-accentText'
                  : 'bg-surfaceAlt text-textMuted hover:text-text'
              }`}
            >
              {s === '' ? 'All Logs' : s}
            </button>
          ))}
        </div>

        <div className="w-72">
          <input
            type="text"
            placeholder="Search by recipient or subject..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-1.5 text-caption bg-surfaceAlt border border-border rounded-input text-text placeholder:text-textMuted focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>
      </div>

      {/* Logs Table */}
      <DataTable
        data={filteredLogs}
        columns={columns}
        isLoading={isLoading}
        emptyTitle="No audit notification records found."
      />

      {/* Inspect Log SlideOver */}
      <SlideOver
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title={selectedLog ? `Audit Record #${selectedLog.id}` : 'Log Details'}
        subtitle={selectedLog ? `Logged at ${formatDate(selectedLog.created_at)}` : ''}
        width="md"
      >
        {selectedLog && (
          <div className="flex flex-col gap-5 text-sm">
            <div className="p-4 rounded-xl bg-surfaceAlt/60 border border-border space-y-3">
              <div>
                <span className="text-overline text-textMuted block">Delivery Status</span>
                <span className="font-semibold text-text mt-0.5 block">{selectedLog.status}</span>
              </div>
              <div>
                <span className="text-overline text-textMuted block">Target Recipient</span>
                <span className="font-mono text-xs text-text mt-0.5 block">{selectedLog.recipient}</span>
              </div>
              <div>
                <span className="text-overline text-textMuted block">Subject Line</span>
                <span className="font-medium text-text mt-0.5 block">{selectedLog.subject}</span>
              </div>
              {selectedLog.sent_at && (
                <div>
                  <span className="text-overline text-textMuted block">Dispatched At</span>
                  <span className="text-xs text-textMuted mt-0.5 block tabular-nums">{formatDate(selectedLog.sent_at)}</span>
                </div>
              )}
            </div>

            {selectedLog.error_message && (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400">
                <span className="text-overline uppercase font-bold block mb-1">Error Diagnostic</span>
                <p className="font-mono text-xs whitespace-pre-wrap">{selectedLog.error_message}</p>
              </div>
            )}

            <div>
              <span className="text-overline uppercase font-bold block mb-2">Message Body Preview</span>
              <div className="p-4 rounded-xl bg-surface border border-border text-xs font-mono text-textMuted whitespace-pre-wrap leading-relaxed">
                {selectedLog.body_preview || 'No preview stored for this event.'}
              </div>
            </div>
          </div>
        )}
      </SlideOver>
    </div>
  );
};

export default AuditLogsPage;
