import React, { useState, useEffect, useCallback } from 'react';
import {
  Shield, Users, Tv, Clock, Trash2, UserCheck, ShieldAlert, RefreshCw,
  ArrowLeft, Search, Filter, Download, UserX, UserPlus, Calendar, Activity,
  BarChart3, PieChart, ChevronLeft, ChevronRight, CheckCircle2, XCircle, AlertTriangle, X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  fetchAdminStatsApi, fetchPaginatedAdminUsersApi, fetchParties,
  updateUserRoleApi, updateUserStatusApi, adminDeletePartyApi,
  fetchAdminActivityApi, exportAdminUsersCsvApi
} from '../services/api';
import { UserAvatar } from '../components/ui/UserAvatar';
import { StatCardSkeleton } from '../components/ui/LoadingSkeleton';

export function AdminDashboard({ onBackToLobby }) {
  const { token, user: currentUser } = useAuth();

  // Overview stats & activity state
  const [stats, setStats] = useState(null);
  const [activityFeed, setActivityFeed] = useState([]);
  const [partiesList, setPartiesList] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);

  // User management state (Pagination, Search, Filters)
  const [usersData, setUsersData] = useState({ users: [], total_users: 0, page: 1, page_size: 10, total_pages: 1 });
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [loadingUsers, setLoadingUsers] = useState(true);

  // Active section tab: 'users' | 'activity' | 'rooms'
  const [adminTab, setAdminTab] = useState('users');

  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState(null);
  const [actionMessage, setActionMessage] = useState('');

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const loadStatsAndParties = useCallback(async () => {
    setLoadingStats(true);
    try {
      if (token) {
        const [statsRes, activityRes, partiesRes] = await Promise.all([
          fetchAdminStatsApi(token).catch(() => null),
          fetchAdminActivityApi(token).catch(() => []),
          fetchParties().catch(() => [])
        ]);
        setStats(statsRes);
        setActivityFeed(activityRes);
        setPartiesList(partiesRes);
      }
    } catch (err) {
      console.error('Admin stats load error', err);
    } finally {
      setLoadingStats(false);
    }
  }, [token]);

  const loadUsersData = useCallback(async () => {
    setLoadingUsers(true);
    try {
      if (token) {
        const res = await fetchPaginatedAdminUsersApi(token, {
          page,
          pageSize,
          search: debouncedSearch,
          role: roleFilter,
          status: statusFilter,
          sortBy
        });
        setUsersData(res);
      }
    } catch (err) {
      console.error('Paginated users load error', err);
    } finally {
      setLoadingUsers(false);
    }
  }, [token, page, pageSize, debouncedSearch, roleFilter, statusFilter, sortBy]);

  useEffect(() => {
    loadStatsAndParties();
  }, [loadStatsAndParties]);

  useEffect(() => {
    loadUsersData();
  }, [loadUsersData]);

  // Execute Role Toggle
  const handleConfirmRoleToggle = async (targetUser) => {
    const newRole = targetUser.role === 'admin' ? 'user' : 'admin';
    try {
      const updated = await updateUserRoleApi(targetUser.id, newRole, token);
      setActionMessage(`Promoted/demoted ${updated.username} to ${updated.role.toUpperCase()}`);
      loadUsersData();
      loadStatsAndParties();
    } catch (err) {
      setActionMessage(`Role update failed: ${err.message}`);
    } finally {
      setConfirmModal(null);
    }
  };

  // Execute Status Toggle (Deactivate/Activate)
  const handleConfirmStatusToggle = async (targetUser) => {
    const newStatus = !targetUser.is_active;
    try {
      const updated = await updateUserStatusApi(targetUser.id, newStatus, token);
      const actionStr = updated.is_active ? 'Activated' : 'Deactivated';
      setActionMessage(`${actionStr} account for ${updated.username}`);
      loadUsersData();
      loadStatsAndParties();
    } catch (err) {
      setActionMessage(`Status update failed: ${err.message}`);
    } finally {
      setConfirmModal(null);
    }
  };

  // Execute Party Termination
  const handleConfirmTerminateParty = async (partyId, title) => {
    try {
      await adminDeletePartyApi(partyId, token);
      setActionMessage(`Terminated watch room "${title}"`);
      loadStatsAndParties();
    } catch (err) {
      setActionMessage(`Failed to terminate room: ${err.message}`);
    } finally {
      setConfirmModal(null);
    }
  };

  // CSV Export Trigger
  const handleExportCsv = async () => {
    try {
      await exportAdminUsersCsvApi(token);
      setActionMessage('User metrics report exported as CSV');
    } catch (err) {
      setActionMessage(`Export failed: ${err.message}`);
    }
  };

  const formatDuration = (secs) => {
    if (!secs) return '0h 0m';
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    return `${h}h ${m}m`;
  };

  const formatRelativeTime = (isoStr) => {
    if (!isoStr) return 'Never';
    const date = new Date(isoStr);
    const diffMin = Math.floor((new Date() - date) / 60000);
    if (diffMin < 2) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 30) return `${diffDays}d ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const STAT_CARDS = [
    { icon: Users, color: 'text-indigo-400', bg: 'bg-indigo-600/15 border-indigo-500/25', label: 'Registered Users', value: stats?.total_users ?? 0, sub: `+${stats?.new_users_7d ?? 0} last 7 days` },
    { icon: Activity, color: 'text-emerald-400', bg: 'bg-emerald-600/15 border-emerald-500/25', label: 'Active Users (7d)', value: stats?.active_users_7d ?? 0, sub: 'Active platforms users' },
    { icon: Clock, color: 'text-amber-400', bg: 'bg-amber-600/15 border-amber-500/25', label: 'Watch Hours', value: `${stats?.total_watch_hours ?? 0}h`, sub: `${stats?.total_sessions ?? 0} total sessions` },
    { icon: Tv, color: 'text-violet-400', bg: 'bg-violet-600/15 border-violet-500/25', label: 'Party Rooms', value: stats?.total_parties ?? 0, sub: `${stats?.active_parties_count ?? 0} live right now` },
    { icon: ShieldAlert, color: 'text-pink-400', bg: 'bg-pink-600/15 border-pink-500/25', label: 'System Admins', value: stats?.admin_users_count ?? 1, sub: 'Authorized moderators' },
  ];

  const maxChartCount = stats?.registration_chart ? Math.max(...stats.registration_chart.map(d => d.count), 1) : 1;

  return (
    <div className="space-y-8 page-enter pb-16">

      {/* ── HEADER BANNER ────────────────────────────────────────── */}
      <div className="relative glass-premium rounded-3xl border border-amber-500/20 p-6 lg:p-8 overflow-hidden">
        <div className="ambient-blob w-72 h-72 bg-amber-500/10 -top-24 -right-24" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/35 text-amber-400 flex items-center justify-center shadow-glow-gold shrink-0">
              <Shield className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-extrabold text-white">Admin LMS Control Center</h1>
                <span className="badge-gold">Platform Superuser</span>
              </div>
              <p className="text-xs text-slate-400">Persistent user governance, platform metrics & session auditing</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => { loadStatsAndParties(); loadUsersData(); }}
              className="btn-ghost text-xs py-2.5 px-3"
              title="Refresh All Data"
            >
              <RefreshCw className={`w-4 h-4 ${loadingUsers || loadingStats ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={handleExportCsv} className="btn-primary text-xs py-2.5 px-4">
              <Download className="w-4 h-4" /> Export Users CSV
            </button>
            <button onClick={onBackToLobby} className="btn-ghost text-xs py-2.5 px-4">
              <ArrowLeft className="w-4 h-4" /> Exit LMS
            </button>
          </div>
        </div>
      </div>

      {/* Action Toast Notification */}
      {actionMessage && (
        <div className="p-4 rounded-2xl bg-indigo-600/15 border border-indigo-500/35 text-indigo-200 text-sm flex items-center justify-between animate-slide-down shadow-glow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{actionMessage}</span>
          </div>
          <button onClick={() => setActionMessage('')} className="text-indigo-400 hover:text-white text-xs font-bold ml-4">
            Dismiss
          </button>
        </div>
      )}

      {/* ── STATS METRICS GRID ──────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {loadingStats ? (
          [1,2,3,4,5].map(i => <StatCardSkeleton key={i} />)
        ) : (
          STAT_CARDS.map(({ icon: Icon, color, bg, label, value, sub }) => (
            <div key={label} className="glass-card rounded-2xl p-5 flex items-center gap-4 hover:border-slate-700">
              <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 ${bg}`}>
                <Icon className={`w-6 h-6 ${color}`} />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500">{label}</p>
                <p className={`text-2xl font-black mt-0.5 ${color}`}>{value}</p>
                <p className="text-[10px] text-slate-600">{sub}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ── VISUAL ANALYTICS CHARTS SECTION ──────────────────────── */}
      {stats?.registration_chart && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Registrations Bar Chart (7 days) */}
          <div className="lg:col-span-2 glass-premium rounded-3xl border border-slate-800/60 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">User Registrations (Last 7 Days)</h3>
              </div>
              <span className="text-xs text-slate-500 font-mono">Daily Signup Trend</span>
            </div>

            {/* Native SVG/CSS Bar Chart */}
            <div className="h-40 flex items-end justify-between gap-3 pt-6 px-2 border-b border-slate-800/60 pb-3">
              {stats.registration_chart.map((d, idx) => {
                const heightPct = Math.max(12, Math.round((d.count / maxChartCount) * 100));
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                    <div className="text-[10px] font-mono font-bold text-indigo-300 opacity-0 group-hover:opacity-100 transition-opacity">
                      {d.count}
                    </div>
                    <div
                      className="w-full bg-gradient-to-t from-indigo-600 to-violet-500 rounded-t-lg transition-all duration-300 group-hover:from-indigo-500 group-hover:to-violet-400 shadow-glow-sm"
                      style={{ height: `${heightPct}%` }}
                    />
                    <span className="text-[10px] font-mono text-slate-500 truncate max-w-full">{d.date.split(' ')[0]}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* User Distribution Ratio */}
          <div className="glass-premium rounded-3xl border border-slate-800/60 p-6 flex flex-col justify-between space-y-4">
            <div className="flex items-center gap-2">
              <PieChart className="w-5 h-5 text-violet-400" />
              <h3 className="text-sm font-bold text-white">Role Distribution</h3>
            </div>

            <div className="space-y-3 my-auto">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-300">Regular Viewers</span>
                  <span className="font-mono text-indigo-400">{(stats.total_users - stats.admin_users_count)} accounts</span>
                </div>
                <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full"
                    style={{ width: `${stats.total_users > 0 ? Math.round(((stats.total_users - stats.admin_users_count) / stats.total_users) * 100) : 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-300">Administrators</span>
                  <span className="font-mono text-amber-400">{stats.admin_users_count} accounts</span>
                </div>
                <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full"
                    style={{ width: `${stats.total_users > 0 ? Math.round((stats.admin_users_count / stats.total_users) * 100) : 0}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500">
              <span>Platform Health</span>
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> 100% Operational
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── NAVIGATION TABS ─────────────────────────────────────── */}
      <div className="flex items-center gap-2 border-b border-slate-800/60 pb-3">
        {[
          { key: 'users', label: `User Management (${usersData.total_users})`, icon: Users },
          { key: 'activity', label: 'Real-Time Activity Feed', icon: Activity },
          { key: 'rooms', label: `Active Watch Parties (${partiesList.length})`, icon: Tv },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setAdminTab(key)}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${adminTab === key ? 'bg-indigo-600 text-white shadow-glow-sm' : 'bg-surface text-slate-400 hover:text-white border border-slate-800'}`}
          >
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {/* ── TAB 1: USER MANAGEMENT ─────────────────────────────── */}
      {adminTab === 'users' && (
        <div className="space-y-6">

          {/* Search, Filter & Sort Control Bar */}
          <div className="glass-premium rounded-2xl border border-slate-800/60 p-4 flex flex-col md:flex-row items-center justify-between gap-4">
            
            {/* Search Input */}
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search users by username or email…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="input-field pl-10 py-2.5 text-xs"
              />
              {searchInput && (
                <button
                  onClick={() => setSearchInput('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Dropdowns */}
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              
              {/* Role filter */}
              <div className="flex items-center gap-1.5 bg-surface px-3 py-1.5 rounded-xl border border-slate-800">
                <Filter className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-[11px] text-slate-500 font-semibold">Role:</span>
                <select
                  value={roleFilter}
                  onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
                  className="bg-transparent text-xs text-slate-200 focus:outline-none font-semibold cursor-pointer"
                >
                  <option value="all" className="bg-slate-900">All Roles</option>
                  <option value="user" className="bg-slate-900">User</option>
                  <option value="admin" className="bg-slate-900">Admin</option>
                </select>
              </div>

              {/* Status filter */}
              <div className="flex items-center gap-1.5 bg-surface px-3 py-1.5 rounded-xl border border-slate-800">
                <span className="text-[11px] text-slate-500 font-semibold">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                  className="bg-transparent text-xs text-slate-200 focus:outline-none font-semibold cursor-pointer"
                >
                  <option value="all" className="bg-slate-900">All Statuses</option>
                  <option value="active" className="bg-slate-900">Active</option>
                  <option value="inactive" className="bg-slate-900">Inactive</option>
                </select>
              </div>

              {/* Sort by */}
              <div className="flex items-center gap-1.5 bg-surface px-3 py-1.5 rounded-xl border border-slate-800">
                <span className="text-[11px] text-slate-500 font-semibold">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
                  className="bg-transparent text-xs text-slate-200 focus:outline-none font-semibold cursor-pointer"
                >
                  <option value="created_at" className="bg-slate-900">Newest Registered</option>
                  <option value="last_active" className="bg-slate-900">Recently Active</option>
                  <option value="oldest" className="bg-slate-900">Oldest Registered</option>
                </select>
              </div>
            </div>
          </div>

          {/* User Table Card */}
          <div className="glass-premium rounded-3xl border border-slate-800/60 overflow-hidden shadow-cinema">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-surface border-b border-slate-800/80 text-slate-400 uppercase tracking-wider text-[10px]">
                    <th className="px-4 py-3.5 font-bold">User Identity</th>
                    <th className="px-4 py-3.5 font-bold">Role</th>
                    <th className="px-4 py-3.5 font-bold">Status</th>
                    <th className="px-4 py-3.5 font-bold">Registered</th>
                    <th className="px-4 py-3.5 font-bold">Last Active</th>
                    <th className="px-4 py-3.5 font-bold">Parties</th>
                    <th className="px-4 py-3.5 font-bold">Watch Time</th>
                    <th className="px-4 py-3.5 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {loadingUsers ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-xs text-slate-500">
                        Loading user records from database…
                      </td>
                    </tr>
                  ) : usersData.users.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-xs text-slate-500">
                        No users found matching current query filters.
                      </td>
                    </tr>
                  ) : (
                    usersData.users.map((u) => (
                      <tr key={u.id} className="hover:bg-surface-hover/40 transition-colors group">
                        
                        {/* Avatar & Username */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <UserAvatar username={u.username} avatarUrl={u.avatar_url} size="sm" />
                            <div>
                              <p className="font-bold text-slate-100 group-hover:text-indigo-300 transition-colors">
                                {u.username}
                                {u.id === currentUser?.id && (
                                  <span className="ml-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                                    YOU
                                  </span>
                                )}
                              </p>
                              <p className="text-[10px] font-mono text-slate-500">{u.email}</p>
                            </div>
                          </div>
                        </td>

                        {/* Role */}
                        <td className="px-4 py-3.5">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${u.role === 'admin' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
                            {u.role}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3.5">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${u.is_active ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' : 'bg-red-500/15 text-red-300 border border-red-500/30'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${u.is_active ? 'bg-emerald-400' : 'bg-red-400'}`} />
                            {u.is_active ? 'Active' : 'Deactivated'}
                          </span>
                        </td>

                        {/* Registered */}
                        <td className="px-4 py-3.5 font-mono text-slate-400 text-[11px]">
                          {new Date(u.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>

                        {/* Last Active */}
                        <td className="px-4 py-3.5 text-slate-300 text-[11px]">
                          {formatRelativeTime(u.last_active_at)}
                        </td>

                        {/* Parties */}
                        <td className="px-4 py-3.5 font-mono text-indigo-400 font-semibold">
                          {u.party_count}
                        </td>

                        {/* Watch time */}
                        <td className="px-4 py-3.5 font-mono text-slate-300">
                          {formatDuration(u.total_watch_seconds)}
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            
                            {/* Role Toggle Button */}
                            <button
                              onClick={() => setConfirmModal({
                                type: 'role',
                                user: u,
                                title: u.role === 'admin' ? 'Demote User Role' : 'Promote User to Admin',
                                message: `Are you sure you want to change role for "${u.username}" to ${u.role === 'admin' ? 'USER' : 'ADMIN'}?`
                              })}
                              className="p-1.5 rounded-lg bg-indigo-600/15 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/25 transition-all"
                              title={u.role === 'admin' ? 'Demote to User' : 'Promote to Admin'}
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                            </button>

                            {/* Status Toggle Button */}
                            <button
                              onClick={() => setConfirmModal({
                                type: 'status',
                                user: u,
                                title: u.is_active ? 'Deactivate User Account' : 'Reactivate User Account',
                                message: `Are you sure you want to ${u.is_active ? 'DEACTIVATE' : 'REACTIVATE'} account for "${u.username}"?`
                              })}
                              disabled={u.id === currentUser?.id}
                              className={`p-1.5 rounded-lg transition-all border ${u.is_active ? 'bg-red-500/10 hover:bg-red-600 text-red-300 hover:text-white border-red-500/20' : 'bg-emerald-500/10 hover:bg-emerald-600 text-emerald-300 hover:text-white border-emerald-500/20'} disabled:opacity-30 disabled:cursor-not-allowed`}
                              title={u.is_active ? 'Deactivate Account' : 'Reactivate Account'}
                            >
                              {u.is_active ? <UserX className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls Footer */}
            <div className="px-6 py-4 border-t border-slate-800/80 bg-surface/60 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-mono">
                Showing {usersData.users.length > 0 ? (page - 1) * pageSize + 1 : 0}–
                {Math.min(page * pageSize, usersData.total_users)} of {usersData.total_users} users
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="px-3 py-1.5 rounded-lg bg-surface hover:bg-surface-light border border-slate-800 disabled:opacity-40 text-slate-300 flex items-center gap-1 transition-all"
                >
                  <ChevronLeft className="w-4 h-4" /> Previous
                </button>

                <span className="font-mono px-3 py-1 bg-surface-light rounded-lg border border-slate-700 text-slate-200">
                  {page} / {usersData.total_pages}
                </span>

                <button
                  onClick={() => setPage(p => Math.min(usersData.total_pages, p + 1))}
                  disabled={page >= usersData.total_pages}
                  className="px-3 py-1.5 rounded-lg bg-surface hover:bg-surface-light border border-slate-800 disabled:opacity-40 text-slate-300 flex items-center gap-1 transition-all"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: REAL-TIME ACTIVITY FEED ────────────────────── */}
      {adminTab === 'activity' && (
        <div className="glass-premium rounded-3xl border border-slate-800/60 p-6 space-y-4 shadow-cinema">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/60">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-400" />
              <h3 className="text-base font-bold text-white">Platform Activity Stream</h3>
            </div>
            <span className="text-xs text-slate-500 font-mono">Consolidated Event Log</span>
          </div>

          {activityFeed.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">No recent activity logged.</div>
          ) : (
            <div className="space-y-3">
              {activityFeed.map((act) => (
                <div key={act.id} className="flex items-start gap-3 p-3.5 rounded-2xl bg-surface border border-slate-800/60">
                  <UserAvatar username={act.username} avatarUrl={act.avatar_url} size="sm" className="mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-bold text-slate-200 truncate">
                        <span className="text-white">{act.username}</span>{' '}
                        <span className="font-normal text-slate-400">{act.details}</span>
                      </p>
                      <span className="text-[10px] font-mono text-slate-500 shrink-0">
                        {formatRelativeTime(act.timestamp)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 3: ACTIVE ROOMS ────────────────────────────────── */}
      {adminTab === 'rooms' && (
        <div className="glass-premium rounded-3xl border border-slate-800/60 p-6 space-y-4 shadow-cinema">
          <div className="flex items-center gap-2">
            <Tv className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-bold text-white">Active Watch Party Rooms</h3>
            <span className="badge-indigo ml-auto">{partiesList.length}</span>
          </div>

          {partiesList.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">No active party rooms found.</p>
          ) : (
            <div className="space-y-2">
              {partiesList.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-4 rounded-2xl bg-surface border border-slate-800/60">
                  <div>
                    <h4 className="text-sm font-bold text-slate-200">{p.title}</h4>
                    <p className="text-[10px] font-mono text-slate-500 mt-0.5">
                      Code: {p.invite_code} · {p.active_participants_count || 1} Viewers
                    </p>
                  </div>
                  <button
                    onClick={() => setConfirmModal({
                      type: 'terminate',
                      partyId: p.id,
                      title: p.title,
                      message: `Are you sure you want to terminate party room "${p.title}"?`
                    })}
                    className="btn-danger text-xs py-1.5 px-3"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Terminate Room
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── ACTION CONFIRMATION MODAL ──────────────────────────── */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center modal-overlay p-4">
          <div className="glass-premium rounded-3xl max-w-md w-full border border-slate-700/60 shadow-cinema p-6 relative animate-scale-in">
            <button onClick={() => setConfirmModal(null)} className="absolute top-4 right-4 p-1.5 rounded-xl hover:bg-surface text-slate-500 hover:text-white">
              <X className="w-4 h-4" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="text-base font-bold text-white mb-2">{confirmModal.title}</h3>
            <p className="text-xs text-slate-300 leading-relaxed mb-6">{confirmModal.message}</p>

            <div className="flex justify-end gap-3">
              <button onClick={() => setConfirmModal(null)} className="btn-ghost text-xs py-2 px-4">
                Cancel
              </button>

              {confirmModal.type === 'role' && (
                <button onClick={() => handleConfirmRoleToggle(confirmModal.user)} className="btn-primary text-xs py-2 px-5">
                  Confirm Role Change
                </button>
              )}

              {confirmModal.type === 'status' && (
                <button onClick={() => handleConfirmStatusToggle(confirmModal.user)} className="btn-danger text-xs py-2 px-5">
                  Confirm Status Change
                </button>
              )}

              {confirmModal.type === 'terminate' && (
                <button onClick={() => handleConfirmTerminateParty(confirmModal.partyId, confirmModal.title)} className="btn-danger text-xs py-2 px-5">
                  Confirm Termination
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
