import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Plus, Search, MoreVertical, UserCheck, Edit2, Trash2, X } from 'lucide-react';
import api from '../../lib/api';
import { useToast } from '../../contexts/ToastContext';

function ContactModal({ contact, onClose }: { contact?: any; onClose: () => void }) {
  const qc = useQueryClient();
  const { success, error } = useToast();
  const { register, handleSubmit, formState: { errors } } = useForm({ defaultValues: contact || {} });

  const mutation = useMutation({
    mutationFn: (d: any) => contact ? api.patch(`/contacts/${contact.id}`, d) : api.post('/contacts', d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['contacts'] }); success(contact ? 'Contact updated' : 'Contact created'); onClose(); },
    onError: (err: any) => error('Failed', err?.response?.data?.message),
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{contact ? 'Edit Contact' : 'New Contact'}</h2>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))}>
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
              <input {...register('email', { required: true })} type="email" className="input" placeholder="john@company.com" />
            </div>
            <div className="input-group">
              <label className="input-label">Phone</label>
              <input {...register('phone')} className="input" placeholder="+91 98765 43210" />
            </div>
            <div className="input-group">
              <label className="input-label">Job Title</label>
              <input {...register('jobTitle')} className="input" placeholder="CEO" />
            </div>
            <div className="input-group">
              <label className="input-label">Department</label>
              <input {...register('department')} className="input" placeholder="Sales" />
            </div>
            <div className="input-group">
              <label className="input-label">City</label>
              <input {...register('city')} className="input" placeholder="Mumbai" />
            </div>
            <div className="input-group">
              <label className="input-label">Country</label>
              <input {...register('country')} className="input" placeholder="India" />
            </div>
          </div>
          <div className="input-group" style={{ marginBottom: 20 }}>
            <label className="input-label">Notes</label>
            <textarea {...register('description')} className="input" rows={3} placeholder="Additional notes..." />
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving…' : contact ? 'Update' : 'Create Contact'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ContactsPage() {
  const qc = useQueryClient();
  const { success, error } = useToast();
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [selected, setSelected] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['contacts', page, search],
    queryFn: async () => {
      const { data } = await api.get('/contacts', { params: { page, limit: 20, search: search || undefined } });
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/contacts/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['contacts'] }); success('Contact deleted'); },
    onError: () => error('Failed to delete'),
  });

  const contacts = data?.data || [];
  const total = data?.meta?.total || 0;
  const totalPages = data?.meta?.totalPages || 1;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Contacts</h1>
          <p className="page-subtitle">{total} total contacts</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal('create')}><Plus size={16} /> New Contact</button>
      </div>

      <div className="filters-bar">
        <div className="search-wrapper">
          <Search size={14} className="search-icon" />
          <input className="search-input" placeholder="Search contacts..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} style={{ width: 220 }} />
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 'auto' }}>Showing {contacts.length} of {total}</div>
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Job Title</th>
              <th>Department</th>
              <th>Location</th>
              <th>Created</th>
              <th style={{ width: 40 }}></th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i}>{Array.from({ length: 8 }).map((_, j) => <td key={j}><div className="skeleton" style={{ height: 14, width: j === 0 ? 140 : 80 }} /></td>)}</tr>
              ))
            ) : contacts.length === 0 ? (
              <tr><td colSpan={8}>
                <div className="empty-state">
                  <div className="empty-icon"><UserCheck size={22} /></div>
                  <div style={{ fontWeight: 600 }}>No contacts found</div>
                  <button className="btn btn-primary btn-sm" onClick={() => setModal('create')}><Plus size={14} /> Add Contact</button>
                </div>
              </td></tr>
            ) : contacts.map((c: any) => (
              <tr key={c.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div className="avatar avatar-sm" style={{ background: '#8b5cf620', color: '#8b5cf6' }}>
                      {c.firstName?.[0]}{c.lastName?.[0]}
                    </div>
                    <span style={{ fontWeight: 600 }}>{c.firstName} {c.lastName}</span>
                  </div>
                </td>
                <td style={{ color: 'var(--text-secondary)' }}>{c.email}</td>
                <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{c.phone || '—'}</td>
                <td style={{ fontSize: 12 }}>{c.jobTitle || '—'}</td>
                <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{c.department || '—'}</td>
                <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  {[c.city, c.country].filter(Boolean).join(', ') || '—'}
                </td>
                <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(c.createdAt).toLocaleDateString('en-IN')}</td>
                <td>
                  <div style={{ position: 'relative' }}>
                    <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setOpenMenuId(openMenuId === c.id ? null : c.id)}><MoreVertical size={15} /></button>
                    {openMenuId === c.id && (
                      <div className="dropdown">
                        <button className="dropdown-item" onClick={() => { setSelected(c); setModal('edit'); setOpenMenuId(null); }}><Edit2 size={14} /> Edit</button>
                        <div className="dropdown-divider" />
                        <button className="dropdown-item danger" onClick={() => { deleteMutation.mutate(c.id); setOpenMenuId(null); }}><Trash2 size={14} /> Delete</button>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button className="page-btn" onClick={() => setPage(1)} disabled={page === 1}>«</button>
          <button className="page-btn" onClick={() => setPage(p => p - 1)} disabled={page === 1}>‹</button>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + Math.max(1, page - 2)).filter(p => p <= totalPages).map(p => (
            <button key={p} className={`page-btn ${page === p ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
          ))}
          <button className="page-btn" onClick={() => setPage(p => p + 1)} disabled={page === totalPages}>›</button>
          <button className="page-btn" onClick={() => setPage(totalPages)} disabled={page === totalPages}>»</button>
        </div>
      )}

      {modal === 'create' && <ContactModal onClose={() => setModal(null)} />}
      {modal === 'edit' && selected && <ContactModal contact={selected} onClose={() => { setModal(null); setSelected(null); }} />}
      {openMenuId && <div style={{ position: 'fixed', inset: 0, zIndex: 50 }} onClick={() => setOpenMenuId(null)} />}
    </div>
  );
}
