import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { authApi } from '../../api';
import { useUserHierarchy } from '../../hooks/useUsers';
import { UserHierarchyNode } from '../../types/auth';
import { PageHeader } from '../../components/ui/PageHeader';
import { Skeleton } from '../../components/ui/Skeleton';
import {
  ArrowLeft,
  Mail,
  Shield,
  MapPin,
  UserCheck,
  Users,
  Calendar,
  Lock,
  CheckCircle2,
  Building2,
  Copy,
  Check,
  Sparkles,
  GitFork,
  Search,
  Maximize2,
  Minimize2,
  ShoppingBag,
  ChevronDown,
  ChevronRight,
  User as UserIcon,
  Crown,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import toast from 'react-hot-toast';

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user: authUser, isSuperAdmin } = useAuth();
  const [copied, setCopied] = useState(false);
  const [copiedNodeId, setCopiedNodeId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [collapsedNodes, setCollapsedNodes] = useState<Record<number, boolean>>({});
  const [selectedTreeNode, setSelectedTreeNode] = useState<UserHierarchyNode | null>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, []);

  // Fetch freshest profile details
  const { data: userProfile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ['user-me-profile-page'],
    queryFn: () => authApi.getMe(),
    staleTime: 1000 * 60 * 2,
  });

  // Fetch organizational hierarchy
  const { data: hierarchyNodes = [], isLoading: isLoadingHierarchy } = useUserHierarchy();

  const profile = userProfile || authUser;

  const cleanName = (profile?.full_name || 'User').replace(/\s*\([^)]*\)/g, '').trim();

  const getInitials = (name: string) => {
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return (parts[0]?.slice(0, 2) || 'U').toUpperCase();
  };

  const handleCopyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    setCopied(true);
    toast.success('Email copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const copyNodeEmail = (email: string, id: number) => {
    navigator.clipboard.writeText(email);
    setCopiedNodeId(id);
    toast.success('Email copied to clipboard');
    setTimeout(() => setCopiedNodeId(null), 2000);
  };

  const toggleCollapse = (id: number) => {
    setCollapsedNodes((prev) => ({
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
    traverse(relevantTreeNodes);
    setCollapsedNodes(allIds);
  };

  const expandAll = () => {
    setCollapsedNodes({});
  };

  // Find relevant tree nodes for the current logged-in user:
  // 1. If Super Admin: show entire hierarchy.
  // 2. If Manager (e.g. Adithya): find the manager node and show them + their reportees!
  // 3. If standard employee: find their manager node and show the manager + all team members.
  const relevantTreeNodes = useMemo(() => {
    if (!profile) return hierarchyNodes;
    if (isSuperAdmin || profile.is_super_admin) return hierarchyNodes;

    // Search for the user node in the hierarchy
    const findNodeAndParent = (
      nodes: UserHierarchyNode[],
      targetId: number,
      parent: UserHierarchyNode | null = null
    ): { node: UserHierarchyNode | null; parent: UserHierarchyNode | null } => {
      for (const n of nodes) {
        if (n.id === targetId) return { node: n, parent };
        if (n.direct_reports?.length) {
          const found = findNodeAndParent(n.direct_reports, targetId, n);
          if (found.node) return found;
        }
      }
      return { node: null, parent: null };
    };

    const { node: userNode, parent: userParent } = findNodeAndParent(hierarchyNodes, profile.id);

    // If the user has direct reports (is manager), show them as root of this tree
    if (userNode && userNode.direct_reports?.length > 0) {
      return [userNode];
    }

    // If the user is an employee under a manager, show their manager's branch
    if (userParent) {
      return [userParent];
    }

    if (userNode) {
      return [userNode];
    }

    return hierarchyNodes;
  }, [hierarchyNodes, profile, isSuperAdmin]);

  // Search filtering in tree
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

  // Tree Node Renderer
  const renderTreeNode = (node: UserHierarchyNode, level = 0) => {
    const hasChildren = (node.direct_reports || []).length > 0;
    const isCollapsed = collapsedNodes[node.id] ?? false;
    const isCurrentUser = node.id === profile?.id;
    const isSelected = selectedTreeNode?.id === node.id;
    const nodeMatches = matchesSearch(node, searchTerm);

    if (!nodeMatches) return null;

    return (
      <div key={node.id} className="relative flex flex-col">
        {level > 0 && (
          <div
            className="absolute -left-6 top-6 w-6 h-0.5 border-t-2 border-border"
            aria-hidden="true"
          />
        )}

        <div
          onClick={() => setSelectedTreeNode(node)}
          className={cn(
            'group relative flex items-center justify-between gap-3 p-4 rounded-2xl border transition-all cursor-pointer shadow-xs my-1.5',
            isCurrentUser
              ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
              : isSelected
              ? 'border-accent bg-accent/5 ring-2 ring-accent/20'
              : 'border-border bg-surface hover:bg-surfaceAlt/60 hover:border-borderHover',
            node.is_super_admin && 'ring-1 ring-purple-500/30'
          )}
        >
          <div className="flex items-center gap-3.5 min-w-0 flex-1">
            {hasChildren ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleCollapse(node.id);
                }}
                className="w-7 h-7 rounded-xl bg-surfaceAlt border border-border flex items-center justify-center text-muted hover:text-text hover:bg-border transition-colors shrink-0"
                title={isCollapsed ? 'Expand reportees' : 'Collapse reportees'}
              >
                {isCollapsed ? (
                  <ChevronRight className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
            ) : (
              <div className="w-7 h-7 flex items-center justify-center shrink-0">
                <span className="w-2.5 h-2.5 rounded-full bg-border" />
              </div>
            )}

            <div className="relative shrink-0">
              <div
                className={cn(
                  'w-11 h-11 rounded-full flex items-center justify-center font-bold text-xs shadow-card',
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
                  'absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full ring-2 ring-surface',
                  node.is_active ? 'bg-emerald-500' : 'bg-zinc-400'
                )}
              />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-bold text-text truncate">
                  {node.full_name}
                </span>

                {isCurrentUser && (
                  <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-primary text-primaryText shadow-xs">
                    You
                  </span>
                )}

                <span
                  className={cn(
                    'px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border shrink-0',
                    getRoleBadgeStyle(node.role, node.is_super_admin)
                  )}
                >
                  {node.is_super_admin ? 'Super Admin' : node.role}
                </span>

                {node.branch && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-surfaceAlt text-text border border-border shrink-0">
                    <MapPin className="w-3 h-3 text-primary" />
                    {node.branch} Circle
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2.5 mt-1 text-xs text-muted flex-wrap">
                <span className="truncate">{node.email}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    copyNodeEmail(node.email, node.id);
                  }}
                  className="hover:text-text p-0.5 rounded"
                  title="Copy email"
                >
                  {copiedNodeId === node.id ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>

                {node.manager_name && (
                  <span className="text-muted/80 text-[11px]">
                    • Reports to: <strong className="text-text">{node.manager_name}</strong>
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {hasChildren && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-xs font-semibold">
                <Users className="w-3.5 h-3.5" />
                <span>{node.direct_reports.length} reportees</span>
              </span>
            )}

            {node.orders_count !== undefined && node.orders_count > 0 && (
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surfaceAlt text-muted text-xs border border-border">
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>{node.orders_count} orders</span>
              </span>
            )}
          </div>
        </div>

        {hasChildren && !isCollapsed && (
          <div className="relative pl-7 ml-5 border-l-2 border-border/80 flex flex-col space-y-1.5 my-1.5">
            {node.direct_reports.map((child) => renderTreeNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const branchName = profile?.branch || 'Hyderabad';
  const roleName = profile?.role || 'USER';
  const rmName =
    profile?.manager_name ||
    (isSuperAdmin ? 'Top Level Executive (Board)' : 'System Administrator');
  const directReports = profile?.direct_reports_count ?? 0;
  const createdDate = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : 'Active';

  return (
    <div className="flex flex-col w-full select-none xl:h-[calc(100dvh-5.5rem)] xl:max-h-[calc(100dvh-5.5rem)]">
      {/* Top Header - Fixed & always visible at top */}
      <div className="shrink-0 mb-3">
        <PageHeader
          title="Employee Profile &amp; Reporting Tree"
          subtitle="Full-screen organizational view of your employment details, circle authority, and direct team reporting tree."
          action={
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-surface hover:bg-surfaceAlt text-text text-xs font-semibold transition-colors shadow-xs"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          }
        />
      </div>

      {/* Main Grid: Left Column Profile Details (Read Only) & Right Column Employee Tree */}
      <div className="flex-1 min-h-0 grid grid-cols-1 xl:grid-cols-12 gap-5 items-stretch pb-1">
        {/* LEFT COLUMN: Profile Cards (5 cols) */}
        <div className="xl:col-span-5 h-full flex flex-col min-h-0">
          {isLoadingProfile ? (
            /* Skeleton Loading State */
            <div className="p-6 rounded-3xl bg-surface border border-border space-y-6 h-full">
              <div className="flex items-center gap-4">
                <Skeleton className="w-20 h-20 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-6 w-48 rounded-md" />
                  <Skeleton className="h-4 w-36 rounded-md" />
                  <Skeleton className="h-5 w-24 rounded-full" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 rounded-xl" />
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* Hero Profile Card */}
              <div className="h-full flex flex-col overflow-y-auto p-5 sm:p-6 rounded-3xl bg-surface border border-border shadow-xs space-y-5 custom-scrollbar">
                <div className="flex items-start gap-4">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full bg-primary text-primaryText ring-4 ring-border flex items-center justify-center text-2xl font-bold shadow-md">
                      {getInitials(cleanName)}
                    </div>
                    <span
                      className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-emerald-500 ring-4 ring-surface"
                      title="Online & Active"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold text-text truncate">{cleanName}</h2>
                      {isSuperAdmin && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20 uppercase">
                          Super Admin
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-1 text-xs text-muted">
                      <Mail className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{profile?.email}</span>
                      <button
                        type="button"
                        onClick={() => profile?.email && handleCopyEmail(profile.email)}
                        className="p-1 hover:text-text rounded transition-colors"
                        title="Copy email"
                      >
                        {copied ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-accent/10 text-accent border border-accent/20">
                        <Shield className="w-3.5 h-3.5" />
                        {roleName}
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-surfaceAlt text-text border border-border">
                        <MapPin className="w-3.5 h-3.5 text-primary" />
                        {branchName} Circle
                      </span>
                    </div>
                  </div>
                </div>

                {/* Key Employment Attributes (Strictly Read-Only) */}
                <div className="space-y-3 pt-2">
                  <h3 className="text-xs font-bold text-muted uppercase tracking-wider">
                    Employment &amp; Organization Details
                  </h3>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-2xl border border-border bg-surfaceAlt/40">
                      <div className="flex items-center gap-1.5 text-muted text-caption">
                        <Building2 className="w-3.5 h-3.5 text-primary" />
                        <span>Working Area</span>
                      </div>
                      <p className="text-sm font-semibold text-text mt-1">
                        {branchName} Circle
                      </p>
                    </div>

                    <div className="p-3.5 rounded-2xl border border-border bg-surfaceAlt/40">
                      <div className="flex items-center gap-1.5 text-muted text-caption">
                        <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Reporting RM</span>
                      </div>
                      <p className="text-sm font-semibold text-text mt-1 truncate" title={rmName}>
                        {rmName}
                      </p>
                    </div>

                    <div className="p-3.5 rounded-2xl border border-border bg-surfaceAlt/40">
                      <div className="flex items-center gap-1.5 text-muted text-caption">
                        <Users className="w-3.5 h-3.5 text-blue-500" />
                        <span>Direct Team Size</span>
                      </div>
                      <p className="text-sm font-semibold text-text mt-1">
                        {roleName === 'MANAGER' || isSuperAdmin
                          ? `${directReports} Direct Employees`
                          : 'Individual Contributor'}
                      </p>
                    </div>

                    <div className="p-3.5 rounded-2xl border border-border bg-surfaceAlt/40">
                      <div className="flex items-center gap-1.5 text-muted text-caption">
                        <UserIcon className="w-3.5 h-3.5 text-amber-500" />
                        <span>Employee ID</span>
                      </div>
                      <p className="text-sm font-mono font-semibold text-text mt-1">
                        #{profile?.id ?? '60000'}
                      </p>
                    </div>

                    <div className="p-3.5 rounded-2xl border border-border bg-surfaceAlt/40">
                      <div className="flex items-center gap-1.5 text-muted text-caption">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Account Status</span>
                      </div>
                      <p className="text-sm font-semibold text-emerald-500 mt-1 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        Active &amp; Verified
                      </p>
                    </div>

                    <div className="p-3.5 rounded-2xl border border-border bg-surfaceAlt/40">
                      <div className="flex items-center gap-1.5 text-muted text-caption">
                        <Calendar className="w-3.5 h-3.5 text-purple-500" />
                        <span>Member Since</span>
                      </div>
                      <p className="text-sm font-semibold text-text mt-1">
                        {createdDate}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Circle Approval Authority */}
                <div className="p-4 rounded-2xl border border-border bg-surfaceAlt/30 space-y-2">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-primary shrink-0" />
                    <h4 className="text-xs font-bold text-text uppercase tracking-wide">
                      Approval Authority
                    </h4>
                  </div>
                  <p className="text-xs text-muted leading-relaxed">
                    {isSuperAdmin ? (
                      <span className="text-text font-medium">
                        All-Circles Authority: Universal administrative override authority across all operational circles.
                      </span>
                    ) : roleName === 'MANAGER' ? (
                      <span className="text-text font-medium">
                        Circle Approval Authority: Authorized to review and approve sales orders originating from <strong className="text-primary">{branchName} Circle</strong> and your direct reporting employees.
                      </span>
                    ) : (
                      <span className="text-text font-medium">
                        Order Creator: Orders exceeding ₹75,000 threshold automatically route to your Regional Manager ({rmName}) for approval.
                      </span>
                    )}
                  </p>
                </div>

                {/* Allowed Screens */}
                <div className="space-y-2.5">
                  <h4 className="text-xs font-bold text-muted uppercase tracking-wider">
                    Authorized Workspace Screens
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {(profile?.allowed_screens && profile.allowed_screens.length > 0
                      ? profile.allowed_screens
                      : ['dashboard', 'orders', 'products', 'inventory']
                    ).map((screen) => (
                      <span
                        key={screen}
                        className="px-2.5 py-1 rounded-xl text-xs font-medium bg-surfaceAlt text-text border border-border/80 capitalize"
                      >
                        {screen.replace('_', ' ')}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Read-Only Non-Editable Banner */}
                <div className="flex items-start gap-2.5 p-3.5 rounded-2xl border border-border/80 bg-surfaceAlt/20 text-muted">
                  <Lock className="w-4 h-4 text-muted shrink-0 mt-0.5" />
                  <p className="text-xs leading-relaxed">
                    Organization-Managed Account. Reporting relationships, circle boundaries, and permissions are governed by the System Administrator and cannot be edited.
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* RIGHT COLUMN: Organizational Tree of Employees (7 cols) */}
        <div className="xl:col-span-7 h-full flex flex-col min-h-0">
          <div className="h-full flex flex-col overflow-hidden p-5 sm:p-6 rounded-3xl bg-surface border border-border shadow-xs">
            {/* Tree Header */}
            <div className="shrink-0 flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-border gap-2">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-accent/10 text-accent">
                  <GitFork className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-text">
                    {roleName === 'MANAGER'
                      ? `Team Tree: ${cleanName}'s Reportees`
                      : isSuperAdmin
                      ? 'Enterprise Organizational Hierarchy'
                      : `Team & Reporting Structure`}
                  </h3>
                  <p className="text-xs text-muted">
                    {roleName === 'MANAGER'
                      ? `${directReports} employees reporting directly under ${cleanName} in ${branchName} Circle`
                      : 'Interactive organizational tree mapping who reports to whom'}
                  </p>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={expandAll}
                  className="px-3 py-1.5 rounded-xl border border-border bg-surface hover:bg-surfaceAlt text-muted hover:text-text text-xs font-medium flex items-center gap-1.5 transition-colors shadow-xs"
                  title="Expand All Nodes"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Expand All</span>
                </button>
                <button
                  type="button"
                  onClick={collapseAll}
                  className="px-3 py-1.5 rounded-xl border border-border bg-surface hover:bg-surfaceAlt text-muted hover:text-text text-xs font-medium flex items-center gap-1.5 transition-colors shadow-xs"
                  title="Collapse All Nodes"
                >
                  <Minimize2 className="w-3.5 h-3.5" />
                  <span>Collapse All</span>
                </button>
              </div>
            </div>

            {/* Tree Search Bar */}
            <div className="shrink-0 pt-3 pb-1.5">
              <div className="relative">
                <Search className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search employees in tree by name, email, or role..."
                  className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-surfaceAlt/60 border border-border text-text placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
            </div>

            {/* Tree Content: scrollable container with custom-scrollbar */}
            <div className="flex-1 min-h-0 overflow-y-auto pr-2 custom-scrollbar my-2 space-y-1">
              {isLoadingHierarchy ? (
                <div className="space-y-4 p-2">
                  <Skeleton className="h-16 w-full rounded-2xl" />
                  <div className="pl-6 space-y-3">
                    <Skeleton className="h-14 w-full rounded-2xl" />
                    <Skeleton className="h-14 w-full rounded-2xl" />
                    <Skeleton className="h-14 w-full rounded-2xl" />
                  </div>
                </div>
              ) : relevantTreeNodes.length === 0 ? (
                <div className="text-center py-16 text-muted text-sm">
                  No hierarchy nodes found.
                </div>
              ) : (
                <div className="space-y-1">
                  {relevantTreeNodes.map((node) => renderTreeNode(node, 0))}
                </div>
              )}
            </div>

            {/* Selected Node Mini Inspector */}
            {selectedTreeNode && (
              <div className="shrink-0 pt-3 border-t border-border mt-auto bg-surfaceAlt/40 p-4 rounded-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-accent" />
                    <span className="text-xs font-bold text-text">Selected Employee Details</span>
                  </div>
                  <span className="text-[11px] font-mono text-muted">ID: #{selectedTreeNode.id}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                  <div className="text-xs">
                    <span className="text-muted block text-[11px]">Full Name</span>
                    <strong className="text-text">{selectedTreeNode.full_name}</strong>
                  </div>
                  <div className="text-xs">
                    <span className="text-muted block text-[11px]">Assigned Role</span>
                    <strong className="text-text">{selectedTreeNode.role}</strong>
                  </div>
                  <div className="text-xs">
                    <span className="text-muted block text-[11px]">Circle Territory</span>
                    <strong className="text-text">{selectedTreeNode.branch || 'Hyderabad'} Circle</strong>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
