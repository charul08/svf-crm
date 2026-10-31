import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Plus, TrendingUp, Edit2, Trash2, X, MoreVertical, Kanban, List } from 'lucide-react';
import api from '../../lib/api';
import { useToast } from '../../contexts/ToastContext';

const STAGES = [
  { key: 'PROSPECTING',       label: 'Prospecting',       color: '#64748b' },
  { key: 'QUALIFICATION',     label: 'Qualification',     color: '#3b82f6' },
  { key: 'NEEDS_ANALYSIS',    label: 'Needs Analysis',    color: '#8b5cf6' },
  { key: 'VALUE_PROPOSITION', label: 'Value Proposition', color: '#06b6d4' },
  { key: 'DECISION_MAKERS',   label: 'Decision Makers',   color: '#f59e0b' },
  { key: 'PROPOSAL',          label: 'Proposal',          color: '#f97316' },
  { key: 'NEGOTIATION',       label: 'Negotiation',       color: '#ef4444' },
  { key: 'CLOSED_WON',        label: 'Closed Won',        color: '#10b981' },
  { key: 'CLOSED_LOST',       label: 'Closed Lost',       color: '#6b7280' },
];

const fmtCurrency = (n: number) => n >= 10_00_000 ? `₹${(n / 10_00_000).toFixed(1)}L` : n >= 1000 ? `₹${(n / 1000).toFixed(0)}K` : `₹${n}`;

function DealModal({ deal, onClose }: { deal?: any; onClose: () => void }) {
  const qc = useQueryClient();
  const { success, error } = useToast();
  const { register, handleSubmit } = useForm({ defaultValues: deal ? { ...deal, amount: deal.amount?.toString() } : { stage: 'PROSPECTING', probability: 10 } });

  const mutation = useMutation({
    mutationFn: (d: any) => deal ? api.patch(`/deals/${deal.id}`, d) : api.post('/deals', d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['deals'] }); success(deal ? 'Deal updated' : 'Deal created'); onClose(); },
    onError: (err: any) => error('Failed', err?.response?.data?.message),
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{deal ? 'Edit Deal' : 'New Deal'}</h2>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div className="input-group" style={{ gridColumn: 'span 2' }}>
              <label className="input-label">Deal Name *</label>
              <input {...register('name', { required: true })} className="input" placeholder="Acme Corp - Enterprise License" />
            </div>
            <div className="input-group">
              <label className="input-label">Amount (₹)</label>
              <input {...register('amount', { valueAsNumber: true })} type="number" className="input" placeholder="500000" />
            </div>
            <div className="input-group">
              <label className="input-label">Stage</label>
              <select {...register('stage')} className="input">
                {STAGES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">Probability (%)</label>
              <input {...register('probability', { valueAsNumber: true })} type="number" min={0} max={100} className="input" placeholder="50" />
            </div>
            <div className="input-group">
              <label className="input-label">Expected Close Date</label>
              <input {...register('expectedCloseDate')} type="date" className="input" />
            </div>
            <div className="input-group">
              <label className="input-label">Lead Source</label>
              <select {...register('source')} className="input">
                <option value="">Select source</option>
                {['WEBSITE', 'REFERRAL', 'COLD_CALL', 'EMAIL_CAMPAIGN', 'SOCIAL_MEDIA'].map(s => (
                  <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">Currency</label>
              <select {...register('currency')} className="input">
                <option value="INR">INR (₹)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
              </select>
            </div>
          </div>
          <div className="input-group" style={{ marginBottom: 20 }}>
            <label className="input-label">Description</label>
            <textarea {...register('description')} className="input" rows={3} placeholder="Deal description..." />
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving…' : deal ? 'Update Deal' : 'Create Deal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function KanbanView({ data, onEdit, onDelete }: { data: any; onEdit: (d: any) => void; onDelete: (id: string) => void }) {
  const stageMap: Record<string, any[]> = {};
  STAGES.forEach(s => { stageMap[s.key] = []; });
  (data || []).forEach((d: any) => { if (stageMap[d.stage]) stageMap[d.stage].push(d); });

  return (
    <div className="kanban-board">
      {STAGES.map((stage) => {
        const cards = stageMap[stage.key];
        const totalValue = cards.reduce((sum: number, d: any) => sum + Number(d.amount || 0), 0);
        return (
          <div key={stage.key} className="kanban-column">
            <div className="kanban-column-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: stage.color }} />
                <span className="kanban-column-title">{stage.label}</span>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span className="kanban-column-count">{cards.length}</span>
                {totalValue > 0 && <span style={{ fontSize: 10, color: '#10b981', fontWeight: 600 }}>{fmtCurrency(totalValue)}</span>}
              </div>
            </div>
            <div className="kanban-cards">
              {cards.map((deal: any) => (
                <div key={deal.id} className="kanban-card" onClick={() => onEdit(deal)}>
                  <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6, color: 'var(--text-primary)' }}>{deal.name}</div>
                  {deal.amount && (
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#10b981', marginBottom: 6 }}>
                      {fmtCurrency(Number(deal.amount))}
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="progress-bar-wrapper" style={{ flex: 1, marginRight: 8 }}>
                      <div className="progress-bar" style={{ width: `${deal.probability || 0}%` }} />
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{deal.probability || 0}%</span>
                  </div>
                  {deal.expectedCloseDate && (
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
                      Close: {new Date(deal.expectedCloseDate).toLocaleDateString('en-IN')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function DealsPage() {
  const qc = useQueryClient();
  const { success, error } = useToast();
  const [view, setView] = useState<'kanban' | 'list'>('kanban');
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [selected, setSelected] = useState<any>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const { data: dealsData, isLoading } = useQuery({
    queryKey: ['deals'],
    queryFn: async () => {
      const { data } = await api.get('/deals', { params: { limit: 200 } });
      return data.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/deals/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['deals'] }); success('Deal deleted'); },
    onError: () => error('Failed to delete'),
  });

  const deals = dealsData || [];
  const totalValue = deals.reduce((sum: number, d: any) => sum + Number(d.amount || 0), 0);

  const handleEdit = (deal: any) => { setSelected(deal); setModal('edit'); };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Deals Pipeline</h1>
          <p className="page-subtitle">{deals.length} deals · Total value: {fmtCurrency(totalValue)}</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <div className="tabs">
            <button className={`tab ${view === 'kanban' ? 'active' : ''}`} onClick={() => setView('kanban')}><Kanban size={14} style={{ display: 'inline' }} /> Board</button>
            <button className={`tab ${view === 'list' ? 'active' : ''}`} onClick={() => setView('list')}><List size={14} style={{ display: 'inline' }} /> List</button>
          </div>
          <button className="btn btn-primary" onClick={() => setModal('create')}><Plus size={16} /> New Deal</button>
        </div>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', gap: 16 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} style={{ flexShrink: 0, width: 280 }}>
              <div className="skeleton" style={{ height: 48, marginBottom: 10 }} />
              {Array.from({ length: 3 }).map((_, j) => <div key={j} className="skeleton" style={{ height: 80, marginBottom: 8 }} />)}
            </div>
          ))}
        </div>
      ) : view === 'kanban' ? (
        <KanbanView data={deals} onEdit={handleEdit} onDelete={(id) => deleteMutation.mutate(id)} />
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr><th>Deal Name</th><th>Amount</th><th>Stage</th><th>Probability</th><th>Close Date</th><th>Source</th><th style={{ width: 40 }}></th></tr>
            </thead>
            <tbody>
              {deals.length === 0 ? (
                <tr><td colSpan={7}>
                  <div className="empty-state">
                    <div className="empty-icon"><TrendingUp size={22} /></div>
                    <div style={{ fontWeight: 600 }}>No deals found</div>
                    <button className="btn btn-primary btn-sm" onClick={() => setModal('create')}><Plus size={14} /> Add Deal</button>
                  </div>
                </td></tr>
              ) : deals.map((deal: any) => {
                const stage = STAGES.find(s => s.key === deal.stage);
                return (
                  <tr key={deal.id}>
                    <td style={{ fontWeight: 600 }}>{deal.name}</td>
                    <td style={{ fontWeight: 700, color: '#10b981' }}>{deal.amount ? fmtCurrency(Number(deal.amount)) : '—'}</td>
                    <td><span className="badge" style={{ background: `${stage?.color}20`, color: stage?.color }}>{stage?.label}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <div className="progress-bar-wrapper" style={{ width: 80 }}>
                          <div className="progress-bar" style={{ width: `${deal.probability || 0}%` }} />
                        </div>
                        <span style={{ fontSize: 12 }}>{deal.probability || 0}%</span>
                      </div>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{deal.expectedCloseDate ? new Date(deal.expectedCloseDate).toLocaleDateString('en-IN') : '—'}</td>
                    <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{deal.source?.replace(/_/g, ' ') || '—'}</td>
                    <td>
                      <div style={{ position: 'relative' }}>
                        <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setOpenMenuId(openMenuId === deal.id ? null : deal.id)}><MoreVertical size={15} /></button>
                        {openMenuId === deal.id && (
                          <div className="dropdown">
                            <button className="dropdown-item" onClick={() => { handleEdit(deal); setOpenMenuId(null); }}><Edit2 size={14} /> Edit</button>
                            <div className="dropdown-divider" />
                            <button className="dropdown-item danger" onClick={() => { deleteMutation.mutate(deal.id); setOpenMenuId(null); }}><Trash2 size={14} /> Delete</button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {modal === 'create' && <DealModal onClose={() => setModal(null)} />}
      {modal === 'edit' && selected && <DealModal deal={selected} onClose={() => { setModal(null); setSelected(null); }} />}
      {openMenuId && <div style={{ position: 'fixed', inset: 0, zIndex: 50 }} onClick={() => setOpenMenuId(null)} />}
    </div>
  );
}
