import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  Users, UserCheck, Building2, TrendingUp, CheckSquare,
  AlertTriangle, DollarSign, Zap, ArrowUpRight, ArrowDownRight,
  Clock, CalendarCheck
} from 'lucide-react';
import api from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';

// ---- helpers ----
const fmt = (n: number, currency = 'INR') =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n);

const fmtCompact = (n: number) =>
  n >= 10_00_000
    ? `₹${(n / 10_00_000).toFixed(1)}L`
    : n >= 1000
    ? `₹${(n / 1000).toFixed(0)}K`
    : `₹${n}`;

const STAGE_COLORS: Record<string, string> = {
  PROSPECTING: '#64748b', QUALIFICATION: '#3b82f6', NEEDS_ANALYSIS: '#8b5cf6',
  VALUE_PROPOSITION: '#06b6d4', DECISION_MAKERS: '#f59e0b',
  PROPOSAL: '#f97316', NEGOTIATION: '#ef4444',
  CLOSED_WON: '#10b981', CLOSED_LOST: '#6b7280',
};

const STATUS_COLORS: Record<string, string> = {
  NEW: '#3b82f6', CONTACTED: '#8b5cf6', QUALIFIED: '#10b981',
  UNQUALIFIED: '#94a3b8', CONVERTED: '#f59e0b',
};

const PIE_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#f97316', '#64748b'];

// ---- Sub-components ----
function StatCard({ icon: Icon, label, value, change, changeLabel, color }: any) {
  const isUp = change >= 0;
  return (
    <div className="stat-card" style={{ '--accent-start': color, '--accent-end': color } as any}>
      <div className="stat-card-header">
        <div className="stat-icon" style={{ background: `${color}20` }}>
          <Icon size={20} color={color} />
        </div>
        {change !== undefined && (
          <div className={`stat-change ${isUp ? 'up' : 'down'}`}>
            {isUp ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
            {Math.abs(change)}%
          </div>
        )}
      </div>
      <div>
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
        {changeLabel && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{changeLabel}</div>}
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>
      {children}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 8, padding: '10px 14px', fontSize: 12 }}>
      <div style={{ fontWeight: 600, marginBottom: 4, color: 'var(--text-primary)' }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} style={{ color: p.color, display: 'flex', gap: 8 }}>
          <span>{p.name}:</span>
          <span style={{ fontWeight: 600 }}>{typeof p.value === 'number' && p.value > 1000 ? fmtCompact(p.value) : p.value}</span>
        </div>
      ))}
    </div>
  );
};

function LeadStatusBadge({ status }: { status: string }) {
  const statusMap: Record<string, string> = {
    NEW: 'badge-blue', CONTACTED: 'badge-purple', QUALIFIED: 'badge-green',
    UNQUALIFIED: 'badge-gray', CONVERTED: 'badge-yellow',
  };
  return <span className={`badge ${statusMap[status] || 'badge-gray'}`}>{status}</span>;
}

function DealStageBadge({ stage }: { stage: string }) {
  const stageMap: Record<string, string> = {
    CLOSED_WON: 'badge-green', CLOSED_LOST: 'badge-gray', NEGOTIATION: 'badge-red',
    PROPOSAL: 'badge-orange', QUALIFICATION: 'badge-blue', NEEDS_ANALYSIS: 'badge-purple',
  };
  return <span className={`badge ${stageMap[stage] || 'badge-gray'}`}>{stage.replace(/_/g, ' ')}</span>;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const orgCurrency = user?.membership?.organization?.currency || 'INR';

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const { data } = await api.get('/dashboard');
      return data.data;
    },
  });

  if (isLoading) {
    return (
      <div>
        <div className="page-header">
          <div><div className="page-title">Dashboard</div></div>
        </div>
        <div className="stats-grid">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="card" style={{ height: 120 }}>
              <div className="skeleton" style={{ height: 40, width: 40, borderRadius: 10, marginBottom: 12 }} />
              <div className="skeleton" style={{ height: 28, width: '60%', marginBottom: 6 }} />
              <div className="skeleton" style={{ height: 12, width: '80%' }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const { kpis, charts, widgets } = data || { kpis: {}, charts: {}, widgets: {} };

  // Format monthly revenue for chart
  const revenueData = (charts?.monthlyRevenue || []).map((r: any) => ({
    month: r.month,
    revenue: Number(r.revenue),
    deals: Number(r.count),
  }));

  // Pipeline data
  const pipelineData = (charts?.dealsByStage || []).map((d: any) => ({
    stage: d.stage.replace(/_/g, ' '),
    count: d._count,
    value: Number(d._sum?.amount || 0),
  }));

  // Lead status pie
  const leadStatusData = (charts?.leadsByStatus || []).map((d: any) => ({
    name: d.status,
    value: d._count,
  }));

  // Lead source data
  const leadSourceData = (charts?.leadsBySource || []).map((d: any) => ({
    name: d.source?.replace(/_/g, ' ') || 'Unknown',
    value: d._count,
  }));

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div style={{ maxWidth: 1600 }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <div className="page-title">{greeting}, {user?.fullName?.split(' ')[0]} 👋</div>
          <div className="page-subtitle">
            {user?.membership?.organization?.name} · Here's what's happening today
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ padding: '6px 12px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', fontSize: 12, color: 'var(--text-secondary)' }}>
            <CalendarCheck size={13} style={{ display: 'inline', marginRight: 6 }} />
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}>
        <StatCard icon={Zap}         label="Total Leads"     value={kpis?.totalLeads ?? 0}    color="#3b82f6" change={12} />
        <StatCard icon={UserCheck}   label="Contacts"         value={kpis?.totalContacts ?? 0} color="#8b5cf6" change={8} />
        <StatCard icon={Building2}   label="Accounts"         value={kpis?.totalAccounts ?? 0} color="#06b6d4" change={5} />
        <StatCard icon={TrendingUp}  label="Open Deals"       value={kpis?.openDeals ?? 0}     color="#f59e0b" change={-2} />
        <StatCard icon={Users}       label="Won Deals"        value={kpis?.wonDeals ?? 0}      color="#10b981" change={18} />
        <StatCard icon={DollarSign}  label="Total Revenue"    value={fmtCompact(kpis?.totalRevenue ?? 0)} color="#10b981" change={22} />
        <StatCard icon={CheckSquare} label="Pending Tasks"    value={kpis?.pendingTasks ?? 0}  color="#f97316" />
        <StatCard icon={AlertTriangle} label="Overdue Tasks"  value={kpis?.overdueTasks ?? 0}  color="#ef4444" />
      </div>

      {/* Charts Row 1 */}
      <div className="charts-grid" style={{ gridTemplateColumns: '2fr 1fr' }}>
        {/* Revenue trend */}
        <div className="card">
          <SectionTitle>Monthly Revenue (Last 6 Months)</SectionTitle>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => fmtCompact(v)} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#3b82f6" fill="url(#revGrad)" strokeWidth={2} dot={{ fill: '#3b82f6', r: 3 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Lead Status Pie */}
        <div className="card">
          <SectionTitle>Leads by Status</SectionTitle>
          {leadStatusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={leadStatusData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value" nameKey="name">
                  {leadStatusData.map((_: any, i: number) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: any, n: any) => [v, n]} contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 8, fontSize: 12 }} />
                <Legend iconSize={10} iconType="circle" wrapperStyle={{ fontSize: 11, color: 'var(--text-secondary)' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state" style={{ padding: '40px 0' }}>
              <Zap size={32} color="var(--text-muted)" />
              <div>No lead data yet</div>
            </div>
          )}
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="charts-grid" style={{ marginBottom: 24 }}>
        {/* Pipeline bar */}
        <div className="card">
          <SectionTitle>Deal Pipeline by Stage</SectionTitle>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={pipelineData} layout="vertical" barSize={14}>
              <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => fmtCompact(v)} />
              <YAxis type="category" dataKey="stage" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} width={110} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" name="Value" radius={[0, 4, 4, 0]}>
                {pipelineData.map((d: any, i: number) => (
                  <Cell key={i} fill={STAGE_COLORS[d.stage.replace(/ /g, '_')] || '#3b82f6'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Lead Sources */}
        <div className="card">
          <SectionTitle>Leads by Source</SectionTitle>
          {leadSourceData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={leadSourceData} barSize={16}>
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" name="Count" fill="#8b5cf6" radius={[4, 4, 0, 0]}>
                  {leadSourceData.map((_: any, i: number) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state" style={{ padding: '40px 0' }}>No source data yet</div>
          )}
        </div>
      </div>

      {/* Bottom Widgets */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
        {/* Recent Leads */}
        <div className="card">
          <SectionTitle>Recent Leads</SectionTitle>
          {widgets?.recentLeads?.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {widgets.recentLeads.map((lead: any) => (
                <div key={lead.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                  <div className="avatar avatar-sm" style={{ background: '#3b82f620', color: '#3b82f6' }}>
                    {lead.firstName?.[0]}{lead.lastName?.[0]}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {lead.firstName} {lead.lastName}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{lead.company}</div>
                  </div>
                  <LeadStatusBadge status={lead.status} />
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state" style={{ padding: '20px 0' }}>No leads yet</div>
          )}
        </div>

        {/* Recent Deals */}
        <div className="card">
          <SectionTitle>Recent Deals</SectionTitle>
          {widgets?.recentDeals?.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {widgets.recentDeals.map((deal: any) => (
                <div key={deal.id} style={{ padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{deal.name}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#10b981', whiteSpace: 'nowrap' }}>{fmtCompact(Number(deal.amount || 0))}</div>
                  </div>
                  <div style={{ marginTop: 4 }}>
                    <DealStageBadge stage={deal.stage} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state" style={{ padding: '20px 0' }}>No deals yet</div>
          )}
        </div>

        {/* Overdue Tasks */}
        <div className="card">
          <SectionTitle>
            <span style={{ color: '#f87171' }}>
              <AlertTriangle size={14} style={{ display: 'inline', marginRight: 6 }} />
              Overdue Tasks
            </span>
          </SectionTitle>
          {widgets?.overdueTasksList?.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {widgets.overdueTasksList.map((task: any) => (
                <div key={task.id} style={{ padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{task.title}</div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 4, alignItems: 'center' }}>
                    <Clock size={11} color="#f87171" />
                    <span style={{ fontSize: 11, color: '#f87171' }}>
                      Due {new Date(task.dueDate).toLocaleDateString('en-IN')}
                    </span>
                    <span className={`badge ${task.priority === 'URGENT' ? 'badge-red' : task.priority === 'HIGH' ? 'badge-orange' : 'badge-gray'}`}>
                      {task.priority}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state" style={{ padding: '20px 0' }}>
              <div style={{ fontSize: 24 }}>✅</div>
              <div>All tasks are on time!</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
