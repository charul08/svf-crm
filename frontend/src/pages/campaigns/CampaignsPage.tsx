import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Plus, Megaphone, Edit2, Trash2, X, MoreVertical } from 'lucide-react';
import api from '../../lib/api';
import { useToast } from '../../contexts/ToastContext';

const TYPES = ['EMAIL', 'SOCIAL_MEDIA', 'PAID_ADS', 'EVENT', 'WEBINAR', 'COLD_OUTREACH', 'OTHER'];
const STATUSES = ['PLANNING', 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED'];
const statusBadge: Record<string, string> = {
  PLANNING: 'badge-gray', ACTIVE: 'badge-green', PAUSED: 'badge-yellow',
  COMPLETED: 'badge-blue', CANCELLED: 'badge-red',
};

function CampaignModal({ campaign, onClose }: { campaign?: any; onClose: () => void }) {
  const qc = useQueryClient();
  const { success, error } = useToast();
  const { register, handleSubmit } = useForm({
    defaultValues: campaign ? {
      ...campaign,
      startDate: campaign.startDate?.slice(0, 10),
      endDate: campaign.endDate?.slice(0, 10),
    } : { status: 'PLANNING', type: 'EMAIL' },
  });

  const mutation = useMutation({
    mutationFn: (d: any) => campaign ? api.patch(`/campaigns/${campaign.id}`, d) : api.post('/campaigns', d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['campaigns'] }); success(campaign ? 'Campaign updated' : 'Campaign created'); onClose(); },
    onError: (err: any) => error('Failed', err?.response?.data?.message),
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{campaign ? 'Edit Campaign' : 'New Campaign'}</h2>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
            <div className="input-group" style={{ gridColumn: 'span 2' }}>
              <label className="input-label">Campaign Name *</label>
              <input {...register('name', { required: true })} className="input" placeholder="Q4 Product Launch Campaign" />
            </div>
            <div className="input-group">
              <label className="input-label">Type</label>
              <select {...register('type')} className="input">
                {TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">Status</label>
              <select {...register('status')} className="input">
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">Start Date</label>
              <input {...register('startDate')} type="date" className="input" />
            </div>
            <div className="input-group">
              <label className="input-label">End Date</label>
              <input {...register('endDate')} type="date" className="input" />
            </div>
            <div className="input-group">
              <label className="input-label">Budget (₹)</label>
              <input {...register('budget', { valueAsNumber: true })} type="number" className="input" placeholder="50000" />
            </div>
            <div className="input-group">
              <label className="input-label">Expected Revenue (₹)</label>
              <input {...register('expectedRevenue', { valueAsNumber: true })} type="number" className="input" placeholder="500000" />
            </div>
          </div>
          <div className="input-group" style={{ marginBottom: 20 }}>
            <label className="input-label">Description</label>
            <textarea {...register('description')} className="input" rows={3} placeholder="Campaign goals and strategy..." />
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving…' : campaign ? 'Update' : 'Create Campaign'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CampaignsPage() {
  const qc = useQueryClient();
  const { success, error } = useToast();
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [selected, setSelected] = useState<any>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['campaigns'],
    queryFn: async () => { const { data } = await api.get('/campaigns', { params: { limit: 50 } }); return data; },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/campaigns/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['campaigns'] }); success('Campaign deleted'); },
    onError: () => error('Failed to delete'),
  });

  const campaigns = data?.data || [];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Campaigns</h1>
          <p className="page-subtitle">{campaigns.length} campaigns</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal('create')}><Plus size={16} /> New Campaign</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card" style={{ height: 180 }}><div className="skeleton" style={{ height: '100%' }} /></div>
          ))
        ) : campaigns.length === 0 ? (
          <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
            <div className="empty-icon"><Megaphone size={22} /></div>
            <div style={{ fontWeight: 600 }}>No campaigns yet</div>
            <button className="btn btn-primary btn-sm" onClick={() => setModal('create')}><Plus size={14} /> Create Campaign</button>
          </div>
        ) : campaigns.map((c: any) => (
          <div key={c.id} className="card" style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', top: 14, right: 14 }}>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setOpenMenuId(openMenuId === c.id ? null : c.id)}><MoreVertical size={15} /></button>
              {openMenuId === c.id && (
                <div className="dropdown">
                  <button className="dropdown-item" onClick={() => { setSelected(c); setModal('edit'); setOpenMenuId(null); }}><Edit2 size={14} /> Edit</button>
                  <div className="dropdown-divider" />
                  <button className="dropdown-item danger" onClick={() => { deleteMutation.mutate(c.id); setOpenMenuId(null); }}><Trash2 size={14} /> Delete</button>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 12 }}>
              <div className="avatar avatar-md" style={{ background: '#8b5cf620', color: '#8b5cf6', borderRadius: 'var(--radius-md)' }}>
                <Megaphone size={18} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, paddingRight: 32 }}>{c.name}</div>
                <span className="badge badge-purple" style={{ marginTop: 4 }}>{c.type?.replace(/_/g, ' ')}</span>
              </div>
            </div>
            <span className={`badge ${statusBadge[c.status] || 'badge-gray'}`}>{c.status}</span>
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {c.budget && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Budget</span>
                  <span style={{ fontWeight: 600 }}>₹{Number(c.budget).toLocaleString('en-IN')}</span>
                </div>
              )}
              {c.expectedRevenue && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Expected Revenue</span>
                  <span style={{ fontWeight: 600, color: '#10b981' }}>₹{Number(c.expectedRevenue).toLocaleString('en-IN')}</span>
                </div>
              )}
              {c.startDate && (
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                  {new Date(c.startDate).toLocaleDateString('en-IN')}
                  {c.endDate && ` → ${new Date(c.endDate).toLocaleDateString('en-IN')}`}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {modal === 'create' && <CampaignModal onClose={() => setModal(null)} />}
      {modal === 'edit' && selected && <CampaignModal campaign={selected} onClose={() => { setModal(null); setSelected(null); }} />}
      {openMenuId && <div style={{ position: 'fixed', inset: 0, zIndex: 50 }} onClick={() => setOpenMenuId(null)} />}
    </div>
  );
}
