import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Plus, Search, Filter, MoreVertical, Zap, Edit2, Trash2, RefreshCw, X } from 'lucide-react';
import api from '../../lib/api';
import { useToast } from '../../contexts/ToastContext';

const SOURCES = ['WEBSITE', 'REFERRAL', 'SOCIAL_MEDIA', 'EMAIL_CAMPAIGN', 'COLD_CALL', 'ADVERTISEMENT', 'TRADE_SHOW', 'OTHER'];
const STATUSES = ['NEW', 'CONTACTED', 'QUALIFIED', 'UNQUALIFIED', 'CONVERTED'];
const RATINGS = ['HOT', 'WARM', 'COLD'];

const statusBadge: Record<string, string> = {
  NEW: 'badge-blue', CONTACTED: 'badge-purple', QUALIFIED: 'badge-green',
  UNQUALIFIED: 'badge-gray', CONVERTED: 'badge-yellow',
};
const ratingBadge: Record<string, string> = {
  HOT: 'badge-red', WARM: 'badge-orange', COLD: 'badge-cyan',
};

function LeadModal({ lead, onClose }: { lead?: any; onClose: () => void }) {
  const qc = useQueryClient();
  const { success, error } = useToast();
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: lead || { status: 'NEW', source: 'WEBSITE' },
  });

  const mutation = useMutation({
    mutationFn: (d: any) =>
      lead ? api.patch(`/leads/${lead.id}`, d) : api.post('/leads', d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leads'] });
      success(lead ? 'Lead updated' : 'Lead created');
      onClose();
    },
    onError: (err: any) => error('Failed', err?.response?.data?.message || 'Error'),
  });

  const onSubmit = (d: any) => mutation.mutate(d);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{lead ? 'Edit Lead' : 'New Lead'}</h2>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div className="input-group">
              <label className="input-label">First Name *</label>
              <input {...register('firstName', { required: true })} className={`input ${errors.firstName ? 'input-error' : ''}`} placeholder="John" />
            </div>
            <div className="input-group">
              <label className="input-label">Last Name *</label>
              <input {...register('lastName', { required: true })} className={`input ${errors.lastName ? 'input-error' : ''}`} placeholder="Doe" />
            </div>
            <div className="input-group">
              <label className="input-label">Email *</label>
              <input {...register('email', { required: true })} type="email" className={`input ${errors.email ? 'input-error' : ''}`} placeholder="john@company.com" />
            </div>
            <div className="input-group">
              <label className="input-label">Phone</label>
              <input {...register('phone')} className="input" placeholder="+91 98765 43210" />
            </div>
            <div className="input-group">
              <label className="input-label">Company</label>
              <input {...register('company')} className="input" placeholder="Acme Corp" />
            </div>
            <div className="input-group">
              <label className="input-label">Job Title</label>
              <input {...register('jobTitle')} className="input" placeholder="CEO" />
            </div>
            <div className="input-group">
              <label className="input-label">Status</label>
              <select {...register('status')} className="input">
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">Source</label>
              <select {...register('source')} className="input">
                {SOURCES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">Rating</label>
              <select {...register('rating')} className="input">
                <option value="">None</option>
                {RATINGS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">Industry</label>
              <input {...register('industry')} className="input" placeholder="Technology" />
            </div>
            <div className="input-group">
              <label className="input-label">Annual Revenue (₹)</label>
              <input {...register('annualRevenue', { valueAsNumber: true })} type="number" className="input" placeholder="1000000" />
            </div>
            <div className="input-group">
              <label className="input-label">Employees</label>
              <input {...register('numberOfEmployees', { valueAsNumber: true })} type="number" className="input" placeholder="50" />
            </div>
          </div>
          <div className="input-group" style={{ marginBottom: 20 }}>
            <label className="input-label">Description</label>
            <textarea {...register('description')} className="input" rows={3} placeholder="Notes about this lead..." />
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving…' : lead ? 'Update Lead' : 'Create Lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ConvertModal({ lead, onClose }: { lead: any; onClose: () => void }) {
  const qc = useQueryClient();
  const { success, error } = useToast();
  const { register, handleSubmit } = useForm({
    defaultValues: {
      contactFirstName: lead.firstName,
      contactLastName: lead.lastName,
      contactEmail: lead.email,
      accountName: lead.company || `${lead.firstName} ${lead.lastName}`,
      dealName: `${lead.firstName} ${lead.lastName} - Deal`,
      dealAmount: 0,
      dealStage: 'QUALIFICATION',
    },
  });

  const mutation = useMutation({
    mutationFn: (d: any) => api.post(`/leads/${lead.id}/convert`, d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leads'] });
      success('Lead converted!', 'Contact, Account and Deal created');
      onClose();
    },
    onError: (err: any) => error('Conversion failed', err?.response?.data?.message),
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Convert Lead</h2>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}><X size={16} /></button>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
          This will create a Contact, Account, and Deal from this lead.
        </p>
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))}>
          <div style={{ display: 'grid', gap: 14 }}>
            <div style={{ padding: 14, background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: 10 }}>Contact</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <input {...register('contactFirstName')} className="input" placeholder="First Name" />
                <input {...register('contactLastName')} className="input" placeholder="Last Name" />
                <input {...register('contactEmail')} type="email" className="input" placeholder="Email" style={{ gridColumn: 'span 2' }} />
              </div>
            </div>
            <div style={{ padding: 14, background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: 10 }}>Account</div>
              <input {...register('accountName')} className="input" placeholder="Company / Account Name" />
            </div>
            <div style={{ padding: 14, background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: 10 }}>Deal</div>
              <div style={{ display: 'grid', gap: 10 }}>
                <input {...register('dealName')} className="input" placeholder="Deal Name" />
                <input {...register('dealAmount', { valueAsNumber: true })} type="number" className="input" placeholder="Amount (₹)" />
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={mutation.isPending}>
              {mutation.isPending ? 'Converting…' : <><RefreshCw size={15} /> Convert Lead</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function LeadsPage() {
  const qc = useQueryClient();
  const { success, error } = useToast();
  const [modal, setModal] = useState<'create' | 'edit' | 'convert' | null>(null);
  const [selected, setSelected] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['leads', page, search, statusFilter],
    queryFn: async () => {
      const { data } = await api.get('/leads', { params: { page, limit: 20, search: search || undefined, status: statusFilter || undefined } });
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/leads/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['leads'] }); success('Lead deleted'); },
    onError: () => error('Failed to delete'),
  });

  const leads = data?.data || [];
  const total = data?.meta?.total || 0;
  const totalPages = data?.meta?.totalPages || 1;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Leads</h1>
          <p className="page-subtitle">{total} total leads</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal('create')}>
          <Plus size={16} /> New Lead
        </button>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-wrapper">
          <Search size={14} className="search-icon" />
          <input
            className="search-input"
            placeholder="Search leads..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            style={{ width: 220 }}
          />
        </div>
        <select className="input" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} style={{ width: 140 }}>
          <option value="">All Status</option>
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 'auto' }}>
          Showing {leads.length} of {total}
        </div>
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Company</th>
              <th>Status</th>
              <th>Rating</th>
              <th>Source</th>
              <th>Created</th>
              <th style={{ width: 40 }}></th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 8 }).map((_, j) => (
                    <td key={j}><div className="skeleton" style={{ height: 14, width: j === 0 ? 140 : 80 }} /></td>
                  ))}
                </tr>
              ))
            ) : leads.length === 0 ? (
              <tr><td colSpan={8}>
                <div className="empty-state">
                  <div className="empty-icon"><Zap size={22} /></div>
                  <div style={{ fontWeight: 600 }}>No leads found</div>
                  <div style={{ fontSize: 13 }}>Create your first lead to get started</div>
                  <button className="btn btn-primary btn-sm" onClick={() => setModal('create')}><Plus size={14} /> Add Lead</button>
                </div>
              </td></tr>
            ) : leads.map((lead: any) => (
              <tr key={lead.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div className="avatar avatar-sm" style={{ background: '#3b82f620', color: '#3b82f6' }}>
                      {lead.firstName?.[0]}{lead.lastName?.[0]}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600 }}>{lead.firstName} {lead.lastName}</div>
                      {lead.jobTitle && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{lead.jobTitle}</div>}
                    </div>
                  </div>
                </td>
                <td style={{ color: 'var(--text-secondary)' }}>{lead.email}</td>
                <td style={{ color: 'var(--text-secondary)' }}>{lead.company || '—'}</td>
                <td><span className={`badge ${statusBadge[lead.status] || 'badge-gray'}`}>{lead.status}</span></td>
                <td>{lead.rating ? <span className={`badge ${ratingBadge[lead.rating] || 'badge-gray'}`}>{lead.rating}</span> : '—'}</td>
                <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{lead.source?.replace(/_/g, ' ')}</td>
                <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(lead.createdAt).toLocaleDateString('en-IN')}</td>
                <td>
                  <div style={{ position: 'relative' }}>
                    <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setOpenMenuId(openMenuId === lead.id ? null : lead.id)}>
                      <MoreVertical size={15} />
                    </button>
                    {openMenuId === lead.id && (
                      <div className="dropdown" style={{ right: 0, top: '100%' }}>
                        <button className="dropdown-item" onClick={() => { setSelected(lead); setModal('edit'); setOpenMenuId(null); }}>
                          <Edit2 size={14} /> Edit
                        </button>
                        <button className="dropdown-item" onClick={() => { setSelected(lead); setModal('convert'); setOpenMenuId(null); }}>
                          <RefreshCw size={14} /> Convert
                        </button>
                        <div className="dropdown-divider" />
                        <button className="dropdown-item danger" onClick={() => { deleteMutation.mutate(lead.id); setOpenMenuId(null); }}>
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button className="page-btn" onClick={() => setPage(1)} disabled={page === 1}>«</button>
          <button className="page-btn" onClick={() => setPage(p => p - 1)} disabled={page === 1}>‹</button>
          {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
            const p = i + Math.max(1, page - 3);
            if (p > totalPages) return null;
            return (
              <button key={p} className={`page-btn ${page === p ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
            );
          })}
          <button className="page-btn" onClick={() => setPage(p => p + 1)} disabled={page === totalPages}>›</button>
          <button className="page-btn" onClick={() => setPage(totalPages)} disabled={page === totalPages}>»</button>
        </div>
      )}

      {/* Modals */}
      {modal === 'create' && <LeadModal onClose={() => setModal(null)} />}
      {modal === 'edit' && selected && <LeadModal lead={selected} onClose={() => { setModal(null); setSelected(null); }} />}
      {modal === 'convert' && selected && <ConvertModal lead={selected} onClose={() => { setModal(null); setSelected(null); }} />}

      {/* Close menu on outside click */}
      {openMenuId && <div style={{ position: 'fixed', inset: 0, zIndex: 50 }} onClick={() => setOpenMenuId(null)} />}
    </div>
  );
}
