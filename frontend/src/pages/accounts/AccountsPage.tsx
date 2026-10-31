import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Plus, Search, MoreVertical, Building2, Edit2, Trash2, X } from 'lucide-react';
import api from '../../lib/api';
import { useToast } from '../../contexts/ToastContext';

const INDUSTRIES = ['Technology', 'Manufacturing', 'Financial Services', 'Healthcare', 'Retail', 'Real Estate', 'Education', 'Media', 'Automotive', 'Energy', 'Other'];
const SIZES = ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'];

function AccountModal({ account, onClose }: { account?: any; onClose: () => void }) {
  const qc = useQueryClient();
  const { success, error } = useToast();
  const { register, handleSubmit } = useForm({ defaultValues: account || {} });

  const mutation = useMutation({
    mutationFn: (d: any) => account ? api.patch(`/accounts/${account.id}`, d) : api.post('/accounts', d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['accounts'] }); success(account ? 'Account updated' : 'Account created'); onClose(); },
    onError: (err: any) => error('Failed', err?.response?.data?.message),
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{account ? 'Edit Account' : 'New Account'}</h2>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div className="input-group" style={{ gridColumn: 'span 2' }}>
              <label className="input-label">Account / Company Name *</label>
              <input {...register('name', { required: true })} className="input" placeholder="Acme Corporation" />
            </div>
            <div className="input-group">
              <label className="input-label">Email</label>
              <input {...register('email')} type="email" className="input" placeholder="info@acme.com" />
            </div>
            <div className="input-group">
              <label className="input-label">Phone</label>
              <input {...register('phone')} className="input" placeholder="+91 44 2345 6789" />
            </div>
            <div className="input-group">
              <label className="input-label">Website</label>
              <input {...register('website')} className="input" placeholder="https://acme.com" />
            </div>
            <div className="input-group">
              <label className="input-label">Industry</label>
              <select {...register('industry')} className="input">
                <option value="">Select Industry</option>
                {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">Company Size</label>
              <select {...register('companySize')} className="input">
                <option value="">Select Size</option>
                {SIZES.map(s => <option key={s} value={s}>{s} employees</option>)}
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">Annual Revenue (₹)</label>
              <input {...register('annualRevenue', { valueAsNumber: true })} type="number" className="input" placeholder="5000000" />
            </div>
            <div className="input-group" style={{ gridColumn: 'span 2' }}>
              <label className="input-label">Billing Address</label>
              <input {...register('billingAddress')} className="input" placeholder="123 Business Park, City" />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving…' : account ? 'Update' : 'Create Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const fmtCurrency = (n: number) => n >= 10_00_000 ? `₹${(n / 10_00_000).toFixed(1)}L` : n >= 1000 ? `₹${(n / 1000).toFixed(0)}K` : `₹${n}`;

export default function AccountsPage() {
  const qc = useQueryClient();
  const { success, error } = useToast();
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [selected, setSelected] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['accounts', page, search],
    queryFn: async () => {
      const { data } = await api.get('/accounts', { params: { page, limit: 20, search: search || undefined } });
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/accounts/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['accounts'] }); success('Account deleted'); },
    onError: () => error('Failed to delete'),
  });

  const accounts = data?.data || [];
  const total = data?.meta?.total || 0;
  const totalPages = data?.meta?.totalPages || 1;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Accounts</h1>
          <p className="page-subtitle">{total} total accounts</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal('create')}><Plus size={16} /> New Account</button>
      </div>

      <div className="filters-bar">
        <div className="search-wrapper">
          <Search size={14} className="search-icon" />
          <input className="search-input" placeholder="Search accounts..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} style={{ width: 220 }} />
        </div>
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr><th>Account</th><th>Industry</th><th>Email</th><th>Phone</th><th>Size</th><th>Revenue</th><th>Created</th><th style={{ width: 40 }}></th></tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => <tr key={i}>{Array.from({ length: 8 }).map((_, j) => <td key={j}><div className="skeleton" style={{ height: 14, width: 80 }} /></td>)}</tr>)
            ) : accounts.length === 0 ? (
              <tr><td colSpan={8}>
                <div className="empty-state">
                  <div className="empty-icon"><Building2 size={22} /></div>
                  <div style={{ fontWeight: 600 }}>No accounts found</div>
                  <button className="btn btn-primary btn-sm" onClick={() => setModal('create')}><Plus size={14} /> Add Account</button>
                </div>
              </td></tr>
            ) : accounts.map((acc: any) => (
              <tr key={acc.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div className="avatar avatar-sm" style={{ background: '#06b6d420', color: '#06b6d4' }}>
                      {acc.name?.[0]?.toUpperCase()}
                    </div>
                    <span style={{ fontWeight: 600 }}>{acc.name}</span>
                  </div>
                </td>
                <td><span className="badge badge-cyan">{acc.industry || '—'}</span></td>
                <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{acc.email || '—'}</td>
                <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{acc.phone || '—'}</td>
                <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{acc.companySize || '—'}</td>
                <td style={{ fontWeight: 600, color: '#10b981' }}>{acc.annualRevenue ? fmtCurrency(Number(acc.annualRevenue)) : '—'}</td>
                <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(acc.createdAt).toLocaleDateString('en-IN')}</td>
                <td>
                  <div style={{ position: 'relative' }}>
                    <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setOpenMenuId(openMenuId === acc.id ? null : acc.id)}><MoreVertical size={15} /></button>
                    {openMenuId === acc.id && (
                      <div className="dropdown">
                        <button className="dropdown-item" onClick={() => { setSelected(acc); setModal('edit'); setOpenMenuId(null); }}><Edit2 size={14} /> Edit</button>
                        <div className="dropdown-divider" />
                        <button className="dropdown-item danger" onClick={() => { deleteMutation.mutate(acc.id); setOpenMenuId(null); }}><Trash2 size={14} /> Delete</button>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal === 'create' && <AccountModal onClose={() => setModal(null)} />}
      {modal === 'edit' && selected && <AccountModal account={selected} onClose={() => { setModal(null); setSelected(null); }} />}
      {openMenuId && <div style={{ position: 'fixed', inset: 0, zIndex: 50 }} onClick={() => setOpenMenuId(null)} />}
    </div>
  );
}
