import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart2, TrendingUp, Users, DollarSign } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import api from '../../lib/api';

const PIE_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#f97316', '#64748b'];
const fmtC = (n: number) => n >= 1000000 ? `₹${(n/1000000).toFixed(1)}M` : n >= 1000 ? `₹${(n/1000).toFixed(0)}K` : `₹${n}`;

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 8, padding: '10px 14px', fontSize: 12 }}>
      <div style={{ fontWeight: 600, marginBottom: 4 }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} style={{ color: p.color }}>{p.name}: <strong>{typeof p.value === 'number' && p.value > 1000 ? fmtC(p.value) : p.value}</strong></div>
      ))}
    </div>
  );
};

function ReportCard({ title, icon: Icon, color, children }: any) {
  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={18} color={color} />
        </div>
        <span style={{ fontWeight: 700, fontSize: 14 }}>{title}</span>
      </div>
      {children}
    </div>
  );
}

export default function ReportsPage() {
  const { data: leadsByStatus } = useQuery({ queryKey: ['report-leads-status'], queryFn: async () => { const { data } = await api.get('/reports/leads-by-status'); return data.data; } });
  const { data: leadsBySource } = useQuery({ queryKey: ['report-leads-source'], queryFn: async () => { const { data } = await api.get('/reports/leads-by-source'); return data.data; } });
  const { data: pipeline } = useQuery({ queryKey: ['report-pipeline'], queryFn: async () => { const { data } = await api.get('/reports/deals-pipeline'); return data.data; } });
  const { data: revenue } = useQuery({ queryKey: ['report-revenue'], queryFn: async () => { const { data } = await api.get('/reports/monthly-revenue'); return data.data; } });

  const statusData = (leadsByStatus || []).map((d: any) => ({ name: d.status, value: d._count }));
  const sourceData = (leadsBySource || []).map((d: any) => ({ name: (d.source || 'Unknown').replace(/_/g, ' '), value: d._count }));
  const pipelineData = (pipeline || []).map((d: any) => ({ stage: d.stage.replace(/_/g, ' '), count: d._count, value: Number(d._sum?.amount || 0) }));
  const revenueData = (revenue || []).map((d: any) => ({ month: d.month, revenue: Number(d.revenue), deals: Number(d.count) }));

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Reports & Analytics</h1>
          <p className="page-subtitle">Insights across your entire sales pipeline</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <ReportCard title="Monthly Revenue Trend" icon={DollarSign} color="#10b981">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={revenueData}>
              <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={fmtC} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="revenue" name="Revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ReportCard>

        <ReportCard title="Pipeline by Stage" icon={TrendingUp} color="#3b82f6">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={pipelineData} layout="vertical" barSize={12}>
              <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={fmtC} />
              <YAxis type="category" dataKey="stage" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} width={110} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" name="Value" fill="#3b82f6" radius={[0, 4, 4, 0]}>
                {pipelineData.map((_: any, i: number) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ReportCard>

        <ReportCard title="Leads by Status" icon={Users} color="#8b5cf6">
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" outerRadius={85} innerRadius={50} dataKey="value" nameKey="name" paddingAngle={3}>
                  {statusData.map((_: any, i: number) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend iconSize={10} iconType="circle" wrapperStyle={{ fontSize: 11, color: 'var(--text-secondary)' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state" style={{ padding: '40px 0' }}>No lead data</div>
          )}
        </ReportCard>

        <ReportCard title="Leads by Source" icon={BarChart2} color="#f59e0b">
          {sourceData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={sourceData}>
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" name="Leads" radius={[4, 4, 0, 0]}>
                  {sourceData.map((_: any, i: number) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state" style={{ padding: '40px 0' }}>No source data</div>
          )}
        </ReportCard>
      </div>
    </div>
  );
}
