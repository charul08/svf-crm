import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Plus, Activity, Edit2, Trash2, X, MoreVertical, CheckCircle } from 'lucide-react';
import api from '../../lib/api';
import { useToast } from '../../contexts/ToastContext';

const TYPES = ['CALL', 'EMAIL', 'MEETING', 'FOLLOW_UP', 'DEMO', 'PRESENTATION', 'NOTE', 'OTHER'];

const typeBadge: Record<string, string> = {
  CALL: 'badge-blue', EMAIL: 'badge-purple', MEETING: 'badge-green',
  FOLLOW_UP: 'badge-yellow', DEMO: 'badge-cyan', PRESENTATION: 'badge-orange',
  NOTE: 'badge-gray', OTHER: 'badge-gray',
};

function ActivityModal({ activity, onClose }: { activity?: any; onClose: () => void }) {
  const qc = useQueryClient();
  const { success, error } = useToast();
  const { register, handleSubmit } = useForm({
    defaultValues: activity ? { ...activity, scheduledAt: activity.scheduledAt?.slice(0, 16) } : { type: 'CALL' }
  });

  const mutation = useMutation({
    mutationFn: (d: any) => activity ? api.patch(`/activities/${activity.id}`, d) : api.post('/activities', d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['activities'] }); success(activity ? 'Activity updated' : 'Activity created'); onClose(); },
    onError: (err: any) => error('Failed', err?.response?.data?.message),
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{activity ? 'Edit Activity' : 'Log Activity'}</h2>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
            <div className="input-group">
              <label className="input-label">Title *</label>
              <input {...register('title', { required: true })} className="input" placeholder="Call with client" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div className="input-group">
                <label className="input-label">Type</label>
                <select {...register('type')} className="input">
                  {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="input-group">
                <label className="input-label">Scheduled At</label>
                <input {...register('scheduledAt')} type="datetime-local" className="input" />
              </div>
              <div className="input-group">
                <label className="input-label">Duration (min)</label>
                <input {...register('duration', { valueAsNumber: true })} type="number" className="input" placeholder="30" />
              </div>
            </div>
            <div className="input-group">
              <label className="input-label">Description</label>
              <textarea {...register('description')} className="input" rows={3} placeholder="Activity details..." />
            </div>
            <div className="input-group">
              <label className="input-label">Outcome</label>
              <textarea {...register('outcome')} className="input" rows={2} placeholder="Result of this activity..." />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving…' : activity ? 'Update' : 'Log Activity'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ActivitiesPage() {
  const qc = useQueryClient();
  const { success, error } = useToast();
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [selected, setSelected] = useState<any>(null);
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['activities', page, typeFilter],
    queryFn: async () => {
      const { data } = await api.get('/activities', { params: { page, limit: 20, type: typeFilter || undefined } });
      return data;
    },
  });

  const completeMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/activities/${id}`, { completedAt: new Date().toISOString() }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['activities'] }); success('Activity marked complete'); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/activities/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['activities'] }); success('Deleted'); },
  });

  const activities = data?.data || [];
  const total = data?.meta?.total || 0;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Activities</h1>
          <p className="page-subtitle">{total} total activities</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal('create')}><Plus size={16} /> Log Activity</button>
      </div>

      <div className="filters-bar">
        <select className="input" value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }} style={{ width: 160 }}>
          <option value="">All Types</option>
          {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => <div key={i} className="card" style={{ height: 80 }}><div className="skeleton" style={{ height: '100%' }} /></div>)
        ) : activities.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><Activity size={22} /></div>
            <div style={{ fontWeight: 600 }}>No activities logged yet</div>
            <button className="btn btn-primary btn-sm" onClick={() => setModal('create')}><Plus size={14} /> Log Activity</button>
          </div>
        ) : activities.map((act: any) => (
          <div key={act.id} className="card" style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 14 }}>
            <div style={{ marginTop: 2 }}>
              <span className={`badge ${typeBadge[act.type] || 'badge-gray'}`}>{act.type}</span>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{act.title}</div>
              {act.description && <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>{act.description}</div>}
              {act.outcome && <div style={{ fontSize: 12, color: '#10b981', marginTop: 4, fontStyle: 'italic' }}>Outcome: {act.outcome}</div>}
              <div style={{ display: 'flex', gap: 16, marginTop: 6, fontSize: 11, color: 'var(--text-muted)' }}>
                {act.scheduledAt && <span>📅 {new Date(act.scheduledAt).toLocaleString('en-IN')}</span>}
                {act.duration && <span>⏱ {act.duration} min</span>}
                {act.completedAt && <span style={{ color: '#10b981' }}>✅ Completed</span>}
              </div>
            </div>
            <div style={{ position: 'relative' }}>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setOpenMenuId(openMenuId === act.id ? null : act.id)}><MoreVertical size={15} /></button>
              {openMenuId === act.id && (
                <div className="dropdown">
                  {!act.completedAt && (
                    <button className="dropdown-item" onClick={() => { completeMutation.mutate(act.id); setOpenMenuId(null); }}><CheckCircle size={14} /> Mark Complete</button>
                  )}
                  <button className="dropdown-item" onClick={() => { setSelected(act); setModal('edit'); setOpenMenuId(null); }}><Edit2 size={14} /> Edit</button>
                  <div className="dropdown-divider" />
                  <button className="dropdown-item danger" onClick={() => { deleteMutation.mutate(act.id); setOpenMenuId(null); }}><Trash2 size={14} /> Delete</button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {modal === 'create' && <ActivityModal onClose={() => setModal(null)} />}
      {modal === 'edit' && selected && <ActivityModal activity={selected} onClose={() => { setModal(null); setSelected(null); }} />}
      {openMenuId && <div style={{ position: 'fixed', inset: 0, zIndex: 50 }} onClick={() => setOpenMenuId(null)} />}
    </div>
  );
}
