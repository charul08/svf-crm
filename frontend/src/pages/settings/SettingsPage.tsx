import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Settings, Building2, Users, Save } from 'lucide-react';
import api from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

const TIMEZONES = ['Asia/Kolkata', 'America/New_York', 'America/Los_Angeles', 'Europe/London', 'Europe/Paris', 'Asia/Singapore', 'Australia/Sydney'];
const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'SGD', 'AUD'];

function OrgSettings() {
  const { success, error } = useToast();
  const qc = useQueryClient();

  const { data: org } = useQuery({
    queryKey: ['organization'],
    queryFn: async () => { const { data } = await api.get('/organization'); return data.data; },
  });

  const { register, handleSubmit, reset } = useForm({
    values: org || {},
  });

  const mutation = useMutation({
    mutationFn: (d: any) => api.patch('/organization', d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['organization'] }); success('Organization updated'); },
    onError: (err: any) => error('Failed', err?.response?.data?.message),
  });

  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
        <div className="input-group" style={{ gridColumn: 'span 2' }}>
          <label className="input-label">Organization Name</label>
          <input {...register('name')} className="input" placeholder="Your Company" />
        </div>
        <div className="input-group">
          <label className="input-label">Timezone</label>
          <select {...register('timezone')} className="input">
            {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
          </select>
        </div>
        <div className="input-group">
          <label className="input-label">Currency</label>
          <select {...register('currency')} className="input">
            {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>
      <button type="submit" className="btn btn-primary" disabled={mutation.isPending}>
        <Save size={15} /> {mutation.isPending ? 'Saving…' : 'Save Changes'}
      </button>
    </form>
  );
}

function TeamSettings() {
  const { data: members, isLoading } = useQuery({
    queryKey: ['team'],
    queryFn: async () => { const { data } = await api.get('/team'); return data.data; },
  });

  const ROLES = ['ORG_ADMIN', 'SALES_MANAGER', 'SALES_REP', 'READ_ONLY'];
  const roleBadge: Record<string, string> = {
    ORG_ADMIN: 'badge-red', SUPER_ADMIN: 'badge-purple',
    SALES_MANAGER: 'badge-orange', SALES_REP: 'badge-blue', READ_ONLY: 'badge-gray',
  };

  return (
    <div>
      {isLoading ? (
        Array.from({ length: 3 }).map((_, i) => (
          <div key={i} style={{ display: 'flex', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--border-subtle)' }}>
            <div className="skeleton" style={{ width: 36, height: 36, borderRadius: '50%' }} />
            <div style={{ flex: 1 }}><div className="skeleton" style={{ height: 14, width: 150, marginBottom: 6 }} /><div className="skeleton" style={{ height: 12, width: 120 }} /></div>
          </div>
        ))
      ) : (members || []).map((m: any) => (
        <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--border-subtle)' }}>
          <div className="avatar avatar-md" style={{ background: '#3b82f620', color: '#3b82f6' }}>
            {m.user?.fullName?.[0]?.toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 13 }}>{m.user?.fullName}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{m.user?.email}</div>
          </div>
          <span className={`badge ${roleBadge[m.role] || 'badge-gray'}`}>{m.role}</span>
          <span className={`badge ${m.isActive ? 'badge-green' : 'badge-red'}`}>{m.isActive ? 'Active' : 'Inactive'}</span>
        </div>
      ))}
    </div>
  );
}

function ProfileSettings() {
  const { user, refreshUser } = useAuth();
  const { success, error } = useToast();
  const { register, handleSubmit } = useForm({
    defaultValues: { fullName: user?.fullName, phone: user?.phone },
  });

  const mutation = useMutation({
    mutationFn: (d: any) => api.patch('/auth/profile', d),
    onSuccess: () => { refreshUser(); success('Profile updated'); },
    onError: (err: any) => error('Failed', err?.response?.data?.message),
  });

  const pwForm = useForm();
  const pwMutation = useMutation({
    mutationFn: (d: any) => api.patch('/auth/change-password', d),
    onSuccess: () => { pwForm.reset(); success('Password changed!'); },
    onError: (err: any) => error('Failed', err?.response?.data?.message),
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <form onSubmit={handleSubmit((d) => mutation.mutate(d))}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
          <div className="input-group" style={{ gridColumn: 'span 2' }}>
            <label className="input-label">Full Name</label>
            <input {...register('fullName')} className="input" />
          </div>
          <div className="input-group">
            <label className="input-label">Email</label>
            <input value={user?.email} className="input" disabled />
          </div>
          <div className="input-group">
            <label className="input-label">Phone</label>
            <input {...register('phone')} className="input" placeholder="+91 98765 43210" />
          </div>
        </div>
        <button type="submit" className="btn btn-primary" disabled={mutation.isPending}>
          <Save size={15} /> {mutation.isPending ? 'Saving…' : 'Update Profile'}
        </button>
      </form>

      <div className="divider" />

      <div>
        <div style={{ fontWeight: 700, marginBottom: 14 }}>Change Password</div>
        <form onSubmit={pwForm.handleSubmit((d) => pwMutation.mutate(d))}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
            <div className="input-group">
              <label className="input-label">Current Password</label>
              <input {...pwForm.register('currentPassword')} type="password" className="input" />
            </div>
            <div className="input-group">
              <label className="input-label">New Password</label>
              <input {...pwForm.register('newPassword')} type="password" className="input" />
            </div>
          </div>
          <button type="submit" className="btn btn-secondary" disabled={pwMutation.isPending}>
            <Save size={15} /> {pwMutation.isPending ? 'Updating…' : 'Change Password'}
          </button>
        </form>
      </div>
    </div>
  );
}

const TABS = [
  { id: 'profile', label: 'Profile', icon: Settings },
  { id: 'organization', label: 'Organization', icon: Building2 },
  { id: 'team', label: 'Team Members', icon: Users },
];

export default function SettingsPage() {
  const [tab, setTab] = useState('profile');

  return (
    <div style={{ maxWidth: 800 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Manage your account and organization</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 20 }}>
        {/* Sidebar nav */}
        <div className="card" style={{ padding: 8, alignSelf: 'start' }}>
          {TABS.map((t) => (
            <button
              key={t.id}
              className={`nav-item w-full ${tab === t.id ? 'active' : ''}`}
              onClick={() => setTab(t.id)}
              style={{ width: '100%' }}
            >
              <t.icon size={16} /> {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="card">
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 20, paddingBottom: 14, borderBottom: '1px solid var(--border-subtle)' }}>
            {TABS.find(t => t.id === tab)?.label}
          </div>
          {tab === 'profile' && <ProfileSettings />}
          {tab === 'organization' && <OrgSettings />}
          {tab === 'team' && <TeamSettings />}
        </div>
      </div>
    </div>
  );
}
