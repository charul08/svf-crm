import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Plus, CheckSquare, Edit2, Trash2, X, MoreVertical, Check } from 'lucide-react';
import api from '../../lib/api';
import { useToast } from '../../contexts/ToastContext';

const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
const STATUSES = ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

const priorityBadge: Record<string, string> = {
  LOW: 'badge-gray', MEDIUM: 'badge-blue', HIGH: 'badge-orange', URGENT: 'badge-red',
};
const statusBadge: Record<string, string> = {
  NOT_STARTED: 'badge-gray', IN_PROGRESS: 'badge-blue', COMPLETED: 'badge-green', CANCELLED: 'badge-red',
};

function TaskModal({ task, onClose }: { task?: any; onClose: () => void }) {
  const qc = useQueryClient();
  const { success, error } = useToast();
  const { register, handleSubmit } = useForm({
    defaultValues: task ? { ...task, dueDate: task.dueDate?.slice(0, 10) } : { status: 'NOT_STARTED', priority: 'MEDIUM' }
  });

  const mutation = useMutation({
    mutationFn: (d: any) => task ? api.patch(`/tasks/${task.id}`, d) : api.post('/tasks', d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tasks'] }); success(task ? 'Task updated' : 'Task created'); onClose(); },
    onError: (err: any) => error('Failed', err?.response?.data?.message),
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{task ? 'Edit Task' : 'New Task'}</h2>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
            <div className="input-group">
              <label className="input-label">Task Title *</label>
              <input {...register('title', { required: true })} className="input" placeholder="Follow up with client" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div className="input-group">
                <label className="input-label">Priority</label>
                <select {...register('priority')} className="input">
                  {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="input-group">
                <label className="input-label">Status</label>
                <select {...register('status')} className="input">
                  {STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                </select>
              </div>
              <div className="input-group">
                <label className="input-label">Due Date</label>
                <input {...register('dueDate')} type="date" className="input" />
              </div>
            </div>
            <div className="input-group">
              <label className="input-label">Description</label>
              <textarea {...register('description')} className="input" rows={3} placeholder="Task details..." />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving…' : task ? 'Update' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function TasksPage() {
  const qc = useQueryClient();
  const { success, error } = useToast();
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [selected, setSelected] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [page, setPage] = useState(1);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['tasks', page, statusFilter, priorityFilter],
    queryFn: async () => {
      const { data } = await api.get('/tasks', { params: { page, limit: 20, status: statusFilter || undefined, priority: priorityFilter || undefined } });
      return data;
    },
  });

  const completeMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/tasks/${id}`, { status: 'COMPLETED' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tasks'] }); success('Task completed!'); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/tasks/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tasks'] }); success('Task deleted'); },
  });

  const tasks = data?.data || [];
  const total = data?.meta?.total || 0;
  const totalPages = data?.meta?.totalPages || 1;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Tasks</h1>
          <p className="page-subtitle">{total} total tasks</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal('create')}><Plus size={16} /> New Task</button>
      </div>

      <div className="filters-bar">
        <select className="input" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} style={{ width: 150 }}>
          <option value="">All Status</option>
          {STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
        </select>
        <select className="input" value={priorityFilter} onChange={(e) => { setPriorityFilter(e.target.value); setPage(1); }} style={{ width: 130 }}>
          <option value="">All Priority</option>
          {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr><th style={{ width: 40 }}></th><th>Title</th><th>Priority</th><th>Status</th><th>Due Date</th><th>Created</th><th style={{ width: 40 }}></th></tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => <tr key={i}>{Array.from({ length: 7 }).map((_, j) => <td key={j}><div className="skeleton" style={{ height: 14, width: 80 }} /></td>)}</tr>)
            ) : tasks.length === 0 ? (
              <tr><td colSpan={7}>
                <div className="empty-state">
                  <div className="empty-icon"><CheckSquare size={22} /></div>
                  <div style={{ fontWeight: 600 }}>No tasks found</div>
                  <button className="btn btn-primary btn-sm" onClick={() => setModal('create')}><Plus size={14} /> Add Task</button>
                </div>
              </td></tr>
            ) : tasks.map((task: any) => {
              const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'COMPLETED';
              return (
                <tr key={task.id} style={{ opacity: task.status === 'COMPLETED' ? 0.6 : 1 }}>
                  <td>
                    <button
                      className="btn btn-ghost btn-icon btn-sm"
                      onClick={() => task.status !== 'COMPLETED' && completeMutation.mutate(task.id)}
                      disabled={task.status === 'COMPLETED'}
                      style={{ color: task.status === 'COMPLETED' ? '#10b981' : 'var(--text-muted)' }}
                    >
                      <Check size={16} />
                    </button>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, textDecoration: task.status === 'COMPLETED' ? 'line-through' : 'none' }}>{task.title}</div>
                    {task.description && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{task.description}</div>}
                  </td>
                  <td><span className={`badge ${priorityBadge[task.priority]}`}>{task.priority}</span></td>
                  <td><span className={`badge ${statusBadge[task.status]}`}>{task.status.replace(/_/g, ' ')}</span></td>
                  <td style={{ fontSize: 12, color: isOverdue ? '#f87171' : 'var(--text-secondary)', fontWeight: isOverdue ? 600 : 400 }}>
                    {task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-IN') : '—'}
                    {isOverdue && <span style={{ marginLeft: 6, fontSize: 10 }}>OVERDUE</span>}
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(task.createdAt).toLocaleDateString('en-IN')}</td>
                  <td>
                    <div style={{ position: 'relative' }}>
                      <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setOpenMenuId(openMenuId === task.id ? null : task.id)}><MoreVertical size={15} /></button>
                      {openMenuId === task.id && (
                        <div className="dropdown">
                          <button className="dropdown-item" onClick={() => { setSelected(task); setModal('edit'); setOpenMenuId(null); }}><Edit2 size={14} /> Edit</button>
                          <div className="dropdown-divider" />
                          <button className="dropdown-item danger" onClick={() => { deleteMutation.mutate(task.id); setOpenMenuId(null); }}><Trash2 size={14} /> Delete</button>
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

      {modal === 'create' && <TaskModal onClose={() => setModal(null)} />}
      {modal === 'edit' && selected && <TaskModal task={selected} onClose={() => { setModal(null); setSelected(null); }} />}
      {openMenuId && <div style={{ position: 'fixed', inset: 0, zIndex: 50 }} onClick={() => setOpenMenuId(null)} />}
    </div>
  );
}
