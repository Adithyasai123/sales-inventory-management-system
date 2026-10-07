import React, { useState, useMemo } from 'react';
import { useUserHierarchy } from '../../hooks/useUsers';
import { UserHierarchyNode } from '../../types/auth';
import { Skeleton } from '../../components/ui/Skeleton';
import {
  Users,
  Building2,
  MapPin,
  Shield,
  Briefcase,
  ChevronDown,
  ChevronRight,
  Search,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  GitFork,
  ArrowRight,
  Maximize2,
  Minimize2,
  Sparkles,
  ShoppingBag,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import toast from 'react-hot-toast';

interface OrgHierarchyTabProps {
  isSuperAdmin?: boolean;
}

export const OrgHierarchyTab: React.FC<OrgHierarchyTabProps> = ({ isSuperAdmin }) => {
  const { data: hierarchyNodes = [], isLoading } = useUserHierarchy();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCircle, setSelectedCircle] = useState<string>('ALL');
  const [collapsedNodeIds, setCollapsedNodeIds] = useState<Record<number, boolean>>({});
  const [selectedUser, setSelectedUser] = useState<UserHierarchyNode | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  // Toggle node collapse
  const toggleCollapse = (id: number) => {
    setCollapsedNodeIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const collapseAll = () => {
    const allIds: Record<number, boolean> = {};
    const traverse = (nodes: UserHierarchyNode[]) => {
      nodes.forEach((n) => {
        allIds[n.id] = true;
        if (n.direct_reports?.length) traverse(n.direct_reports);
      });
    };
    traverse(hierarchyNodes);
    setCollapsedNodeIds(allIds);
  };

  const expandAll = () => {
    setCollapsedNodeIds({});
  };

  const copyEmail = (email: string, id: number) => {
    navigator.clipboard.writeText(email);
    setCopiedId(id);
    toast.success('Email copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Extract all unique circles
  const circles = useMemo(() => {
    const set = new Set<string>();
    const traverse = (nodes: UserHierarchyNode[]) => {
      nodes.forEach((n) => {
        if (n.branch) set.add(n.branch);
        if (n.direct_reports?.length) traverse(n.direct_reports);
      });
    };
    traverse(hierarchyNodes);
    return Array.from(set);
  }, [hierarchyNodes]);

  // Total user count across hierarchy
  const totalUsers = useMemo(() => {
    let count = 0;
    const traverse = (nodes: UserHierarchyNode[]) => {
      nodes.forEach((n) => {
        count++;
        if (n.direct_reports?.length) traverse(n.direct_reports);
      });
    };
    traverse(hierarchyNodes);
    return count;
  }, [hierarchyNodes]);

  // Total managers count
  const totalManagers = useMemo(() => {
    let count = 0;
    const traverse = (nodes: UserHierarchyNode[]) => {
      nodes.forEach((n) => {
        if (n.role === 'MANAGER' || n.is_super_admin) count++;
        if (n.direct_reports?.length) traverse(n.direct_reports);
      });
    };
    traverse(hierarchyNodes);
    return count;
  }, [hierarchyNodes]);

  // Helper to determine if a node or any of its descendants matches search
  const matchesSearch = (node: UserHierarchyNode, term: string): boolean => {
    if (!term) return true;
    const t = term.toLowerCase();
    const selfMatch =
      node.full_name.toLowerCase().includes(t) ||
      node.email.toLowerCase().includes(t) ||
      (node.branch && node.branch.toLowerCase().includes(t)) ||
      node.role.toLowerCase().includes(t);
    if (selfMatch) return true;
    return (node.direct_reports || []).some((child) => matchesSearch(child, term));
  };

  const matchesCircle = (node: UserHierarchyNode, circle: string): boolean => {
    if (circle === 'ALL') return true;
    if (node.is_super_admin) return true; // Super admin matches all circles
    const selfCircleMatch = node.branch?.toLowerCase() === circle.toLowerCase();
    if (selfCircleMatch) return true;
    return (node.direct_reports || []).some((child) => matchesCircle(child, circle));
  };

  const getInitials = (name: string) => {
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return (parts[0]?.slice(0, 2) || 'U').toUpperCase();
  };

  const getRoleBadgeStyle = (role: string, isSuper?: boolean) => {
    if (isSuper) {
      return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';
    }
    switch (role) {
      case 'MANAGER':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
      case 'ADMIN':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      case 'SALES':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      case 'WAREHOUSE':
        return 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20';
      case 'FINANCE':
        return 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20';
      default:
        return 'bg-surfaceAlt text-text border-border';
    }
  };

  // Recursive Tree Node Renderer
  const renderTreeNode = (node: UserHierarchyNode, level = 0, isLast = false) => {
    const hasChildren = (node.direct_reports || []).length > 0;
    const isCollapsed = collapsedNodeIds[node.id] ?? false;
    const isSelected = selectedUser?.id === node.id;
    const nodeMatches = matchesSearch(node, searchTerm) && matchesCircle(node, selectedCircle);

    if (!nodeMatches) return null;

    return (
      <div key={node.id} className="relative flex flex-col">
        {/* Connection guide line from parent */}
        {level > 0 && (
          <div
            className="absolute -left-6 top-6 w-6 h-0.5 border-t-2 border-border"
            aria-hidden="true"
          />
        )}

        {/* Node Card */}
        <div
          onClick={() => setSelectedUser(node)}
          className={cn(
            'group relative flex items-center justify-between gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer shadow-xs my-1',
            isSelected
              ? 'border-accent bg-accent/5 ring-2 ring-accent/20'
              : 'border-border bg-surface hover:bg-surfaceAlt/60 hover:border-borderHover',
            node.is_super_admin && 'ring-1 ring-purple-500/30'
          )}
        >
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {/* Collapse toggle button */}
            {hasChildren ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleCollapse(node.id);
                }}
                className="w-6 h-6 rounded-lg bg-surfaceAlt border border-border flex items-center justify-center text-muted hover:text-text hover:bg-border transition-colors shrink-0"
                title={isCollapsed ? 'Expand reportees' : 'Collapse reportees'}
              >
                {isCollapsed ? (
                  <ChevronRight className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>
            ) : (
              <div className="w-6 h-6 flex items-center justify-center shrink-0">
                <span className="w-2 h-2 rounded-full bg-border" />
              </div>
            )}

            {/* Avatar */}
            <div className="relative shrink-0">
              <div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shadow-card',
                  node.is_super_admin
                    ? 'bg-purple-600 text-white ring-2 ring-purple-400/40'
                    : node.role === 'MANAGER'
                    ? 'bg-primary text-primaryText ring-2 ring-border'
                    : 'bg-surfaceAlt text-text border border-border'
                )}
              >
                {getInitials(node.full_name)}
              </div>
              <span
                className={cn(
                  'absolute bottom-0 right-0 w-3 h-3 rounded-full ring-2 ring-surface',
                  node.is_active ? 'bg-emerald-500' : 'bg-zinc-400'
                )}
              />
            </div>

            {/* User Info */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-bold text-text truncate leading-tight">
                  {node.full_name}
                </span>

                <span
                  className={cn(
                    'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border shrink-0',
                    getRoleBadgeStyle(node.role, node.is_super_admin)
                  )}
                >
                  {node.is_super_admin ? 'Super Admin' : node.role}
                </span>

                {node.branch && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-surfaceAlt text-text border border-border shrink-0">
                    <MapPin className="w-2.5 h-2.5 text-primary" />
                    {node.branch} Circle
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 mt-1 text-caption text-muted flex-wrap">
                <span className="truncate">{node.email}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    copyEmail(node.email, node.id);
                  }}
                  className="hover:text-text p-0.5 rounded"
                  title="Copy email"
                >
                  {copiedId === node.id ? (
                    <Check className="w-3 h-3 text-emerald-500" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </button>

                {node.manager_name && (
                  <span className="text-muted/80 text-[10px]">
                    • Reports to: <strong className="text-text">{node.manager_name}</strong>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right Metrics & Badges */}
          <div className="flex items-center gap-2 shrink-0">
            {hasChildren && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-xs font-semibold">
                <Users className="w-3.5 h-3.5" />
                <span>{node.direct_reports.length} reportees</span>
              </span>
            )}

            {node.orders_count !== undefined && node.orders_count > 0 && (
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-surfaceAlt text-muted text-[11px] border border-border">
                <ShoppingBag className="w-3 h-3" />
                <span>{node.orders_count} orders</span>
              </span>
            )}
          </div>
        </div>

        {/* Recursive Children Container */}
        {hasChildren && !isCollapsed && (
          <div className="relative pl-6 ml-4 border-l-2 border-border/80 flex flex-col space-y-1 my-1">
            {node.direct_reports.map((child, idx) =>
              renderTreeNode(child, level + 1, idx === node.direct_reports.length - 1)
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6 w-full select-none">
      {/* Top Banner & Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-surface border border-border shadow-xs">
          <div className="flex items-center justify-between text-caption text-muted">
            <span>Total Organization Users</span>
            <Users className="w-4 h-4 text-accent" />
          </div>
          <div className="text-2xl font-bold text-text mt-1.5">
            {isLoading ? <Skeleton className="h-8 w-16" /> : totalUsers}
          </div>
          <p className="text-[11px] text-muted mt-1">Super Admin, Managers &amp; Employees</p>
        </div>

        <div className="p-4 rounded-2xl bg-surface border border-border shadow-xs">
          <div className="flex items-center justify-between text-caption text-muted">
            <span>Regional Circle Managers</span>
            <Briefcase className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1.5">
            {isLoading ? <Skeleton className="h-8 w-16" /> : totalManagers}
          </div>
          <p className="text-[11px] text-muted mt-1">Designated Circle Approval Authorities</p>
        </div>

        <div className="p-4 rounded-2xl bg-surface border border-border shadow-xs">
          <div className="flex items-center justify-between text-caption text-muted">
            <span>Operating Circles</span>
            <Building2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1.5">
            {isLoading ? <Skeleton className="h-8 w-16" /> : `${circles.length} Circles`}
          </div>
          <p className="text-[11px] text-muted mt-1">Hyderabad, Bangalore, Mumbai, Delhi</p>
        </div>
      </div>

      {/* Control Toolbar: Search, Circle Filter, Expand/Collapse */}
      <div className="p-4 rounded-2xl bg-surface border border-border shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, email, or role..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-surfaceAlt/60 border border-border text-text placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>

        {/* Circle filter pills */}
        <div className="flex items-center gap-1.5 flex-wrap w-full md:w-auto">
          <button
            type="button"
            onClick={() => setSelectedCircle('ALL')}
            className={cn(
              'px-3 py-1.5 rounded-xl text-xs font-semibold transition-all',
              selectedCircle === 'ALL'
                ? 'bg-accent text-accentText shadow-xs'
                : 'bg-surfaceAlt text-muted hover:text-text'
            )}
          >
            All Circles
          </button>
          {circles.map((circle) => (
            <button
              key={circle}
              type="button"
              onClick={() => setSelectedCircle(circle)}
              className={cn(
                'px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1',
                selectedCircle === circle
                  ? 'bg-accent text-accentText font-semibold shadow-xs'
                  : 'bg-surfaceAlt text-muted hover:text-text'
              )}
            >
              <MapPin className="w-3 h-3" />
              <span>{circle}</span>
            </button>
          ))}
        </div>

        {/* Expand / Collapse All buttons */}
        <div className="flex items-center gap-1.5 shrink-0 self-end md:self-auto">
          <button
            type="button"
            onClick={expandAll}
            className="p-1.5 px-2.5 rounded-xl border border-border bg-surface hover:bg-surfaceAlt text-muted hover:text-text text-xs font-medium flex items-center gap-1.5 transition-colors shadow-xs"
            title="Expand All Nodes"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Expand All</span>
          </button>
          <button
            type="button"
            onClick={collapseAll}
            className="p-1.5 px-2.5 rounded-xl border border-border bg-surface hover:bg-surfaceAlt text-muted hover:text-text text-xs font-medium flex items-center gap-1.5 transition-colors shadow-xs"
            title="Collapse All Nodes"
          >
            <Minimize2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Collapse All</span>
          </button>
        </div>
      </div>

      {/* Main Hierarchy Tree Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tree Canvas */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-surface border border-border shadow-xs min-h-[500px]">
          <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
            <div className="flex items-center gap-2">
              <GitFork className="w-4 h-4 text-accent" />
              <h3 className="text-sm font-bold text-text">Reporting Structure Tree</h3>
            </div>
            <span className="text-[11px] text-muted">
              Click any user card to inspect full reporting chain
            </span>
          </div>

          {isLoading ? (
            <div className="space-y-4 p-2">
              <Skeleton className="h-16 w-full rounded-2xl" />
              <div className="pl-6 space-y-3">
                <Skeleton className="h-14 w-full rounded-2xl" />
                <Skeleton className="h-14 w-full rounded-2xl" />
              </div>
            </div>
          ) : hierarchyNodes.length === 0 ? (
            <div className="text-center py-12 text-muted text-sm">
              No organization hierarchy data available.
            </div>
          ) : (
            <div className="space-y-2">
              {hierarchyNodes.map((node, index) =>
                renderTreeNode(node, 0, index === hierarchyNodes.length - 1)
              )}
            </div>
          )}
        </div>

        {/* Selected User Inspector Panel */}
        <div className="p-5 rounded-2xl bg-surface border border-border shadow-xs flex flex-col h-fit sticky top-6">
          <div className="flex items-center gap-2 pb-3 border-b border-border">
            <Sparkles className="w-4 h-4 text-accent" />
            <h4 className="text-sm font-bold text-text">Reporting Chain Inspector</h4>
          </div>

          {selectedUser ? (
            <div className="mt-4 space-y-4">
              {/* User Avatar & Title */}
              <div className="flex items-center gap-3 p-3.5 rounded-xl bg-surfaceAlt/50 border border-border">
                <div className="w-12 h-12 rounded-full bg-primary text-primaryText ring-2 ring-border flex items-center justify-center font-bold text-base shrink-0 shadow-card">
                  {getInitials(selectedUser.full_name)}
                </div>
                <div className="min-w-0 flex-1">
                  <h5 className="text-sm font-bold text-text truncate">
                    {selectedUser.full_name}
                  </h5>
                  <p className="text-caption text-muted truncate">{selectedUser.email}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span
                      className={cn(
                        'px-2 py-0.2 rounded-full text-[10px] font-bold uppercase tracking-wider border',
                        getRoleBadgeStyle(selectedUser.role, selectedUser.is_super_admin)
                      )}
                    >
                      {selectedUser.is_super_admin ? 'Super Admin' : selectedUser.role}
                    </span>
                    {selectedUser.branch && (
                      <span className="text-[10px] text-muted">
                        {selectedUser.branch} Circle
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Chain Visualization */}
              <div className="p-4 rounded-xl border border-border bg-surfaceAlt/30 space-y-3">
                <span className="text-xs font-bold text-muted uppercase tracking-wider block">
                  Reporting Relationship
                </span>

                <div className="space-y-2.5">
                  {/* Reporting Manager */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted w-24 shrink-0">Reports To:</span>
                    <span className="text-xs font-semibold text-text truncate">
                      {selectedUser.manager_name ||
                        (selectedUser.is_super_admin
                          ? 'N/A (Sole Super Admin)'
                          : 'Adithya (Hyderabad RM)')}
                    </span>
                  </div>

                  {/* Circle / Branch */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted w-24 shrink-0">Working Circle:</span>
                    <span className="text-xs font-semibold text-text flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-primary" />
                      {selectedUser.branch || 'Hyderabad'} Circle
                    </span>
                  </div>

                  {/* Approval Authority Rule */}
                  <div className="flex items-start gap-2 pt-2 border-t border-border">
                    <span className="text-xs text-muted w-24 shrink-0">Approval Policy:</span>
                    <p className="text-xs text-text leading-relaxed">
                      {selectedUser.is_super_admin ? (
                        'Full company-wide authorization across all operating circles.'
                      ) : selectedUser.role === 'MANAGER' ? (
                        <span>
                          Direct authority to approve all orders in{' '}
                          <strong className="text-primary">{selectedUser.branch} Circle</strong>.
                        </span>
                      ) : (
                        <span>
                          Orders above ₹75,000 threshold require approval from{' '}
                          <strong>{selectedUser.manager_name || 'Adithya'}</strong>.
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Direct Reportees List */}
              {selectedUser.direct_reports?.length > 0 && (
                <div className="p-4 rounded-xl border border-border bg-surface space-y-2.5">
                  <span className="text-xs font-bold text-muted uppercase tracking-wider block">
                    Direct Reportees ({selectedUser.direct_reports.length})
                  </span>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {selectedUser.direct_reports.map((dr) => (
                      <div
                        key={dr.id}
                        onClick={() => setSelectedUser(dr)}
                        className="flex items-center justify-between p-2 rounded-lg bg-surfaceAlt/60 hover:bg-surfaceAlt cursor-pointer text-xs transition-colors"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                          <span className="font-medium text-text truncate">{dr.full_name}</span>
                        </div>
                        <span className="text-[10px] text-muted shrink-0">{dr.role}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="py-12 text-center text-muted text-xs space-y-2">
              <Users className="w-8 h-8 text-muted/50 mx-auto" />
              <p>Select any user in the hierarchy tree to inspect their reporting chain and team.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
