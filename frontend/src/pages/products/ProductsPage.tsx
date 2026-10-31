import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Plus, Package, Edit2, Trash2, X, MoreVertical } from 'lucide-react';
import api from '../../lib/api';
import { useToast } from '../../contexts/ToastContext';

function ProductModal({ product, onClose }: { product?: any; onClose: () => void }) {
  const qc = useQueryClient();
  const { success, error } = useToast();
  const { register, handleSubmit } = useForm({ defaultValues: product || { currency: 'INR', isActive: true } });

  const mutation = useMutation({
    mutationFn: (d: any) => product ? api.patch(`/products/${product.id}`, d) : api.post('/products', d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['products'] }); success(product ? 'Product updated' : 'Product created'); onClose(); },
    onError: (err: any) => error('Failed', err?.response?.data?.message),
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{product ? 'Edit Product' : 'New Product'}</h2>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
            <div className="input-group" style={{ gridColumn: 'span 2' }}>
              <label className="input-label">Product Name *</label>
              <input {...register('name', { required: true })} className="input" placeholder="CRM Enterprise License" />
            </div>
            <div className="input-group">
              <label className="input-label">SKU</label>
              <input {...register('sku')} className="input" placeholder="CRM-ENT-001" />
            </div>
            <div className="input-group">
              <label className="input-label">Category</label>
              <input {...register('category')} className="input" placeholder="Software" />
            </div>
            <div className="input-group">
              <label className="input-label">Unit Price *</label>
              <input {...register('unitPrice', { required: true, valueAsNumber: true })} type="number" className="input" placeholder="9999" />
            </div>
            <div className="input-group">
              <label className="input-label">Currency</label>
              <select {...register('currency')} className="input">
                <option value="INR">INR (₹)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">Tax Rate (%)</label>
              <input {...register('taxRate', { valueAsNumber: true })} type="number" className="input" placeholder="18" />
            </div>
            <div className="input-group">
              <label className="input-label">Unit</label>
              <input {...register('unit')} className="input" placeholder="month / license / unit" />
            </div>
          </div>
          <div className="input-group" style={{ marginBottom: 20 }}>
            <label className="input-label">Description</label>
            <textarea {...register('description')} className="input" rows={3} placeholder="Product description..." />
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving…' : product ? 'Update' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  const qc = useQueryClient();
  const { success, error } = useToast();
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [selected, setSelected] = useState<any>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: async () => { const { data } = await api.get('/products', { params: { limit: 50 } }); return data; },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/products/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['products'] }); success('Product deleted'); },
    onError: () => error('Failed to delete'),
  });

  const products = data?.data || [];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Products</h1>
          <p className="page-subtitle">{products.length} products in catalog</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal('create')}><Plus size={16} /> New Product</button>
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr><th>Name</th><th>SKU</th><th>Category</th><th>Unit Price</th><th>Tax Rate</th><th>Status</th><th style={{ width: 40 }}></th></tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => <tr key={i}>{Array.from({ length: 7 }).map((_, j) => <td key={j}><div className="skeleton" style={{ height: 14, width: 80 }} /></td>)}</tr>)
            ) : products.length === 0 ? (
              <tr><td colSpan={7}>
                <div className="empty-state">
                  <div className="empty-icon"><Package size={22} /></div>
                  <div style={{ fontWeight: 600 }}>No products yet</div>
                  <button className="btn btn-primary btn-sm" onClick={() => setModal('create')}><Plus size={14} /> Add Product</button>
                </div>
              </td></tr>
            ) : products.map((p: any) => (
              <tr key={p.id}>
                <td style={{ fontWeight: 600 }}>{p.name}</td>
                <td><code style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{p.sku || '—'}</code></td>
                <td><span className="badge badge-cyan">{p.category || '—'}</span></td>
                <td style={{ fontWeight: 700, color: '#10b981' }}>
                  {p.currency === 'INR' ? '₹' : p.currency === 'USD' ? '$' : '€'}{Number(p.unitPrice).toLocaleString('en-IN')}
                </td>
                <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{p.taxRate ? `${p.taxRate}%` : '—'}</td>
                <td><span className={`badge ${p.isActive ? 'badge-green' : 'badge-gray'}`}>{p.isActive ? 'Active' : 'Inactive'}</span></td>
                <td>
                  <div style={{ position: 'relative' }}>
                    <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setOpenMenuId(openMenuId === p.id ? null : p.id)}><MoreVertical size={15} /></button>
                    {openMenuId === p.id && (
                      <div className="dropdown">
                        <button className="dropdown-item" onClick={() => { setSelected(p); setModal('edit'); setOpenMenuId(null); }}><Edit2 size={14} /> Edit</button>
                        <div className="dropdown-divider" />
                        <button className="dropdown-item danger" onClick={() => { deleteMutation.mutate(p.id); setOpenMenuId(null); }}><Trash2 size={14} /> Delete</button>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal === 'create' && <ProductModal onClose={() => setModal(null)} />}
      {modal === 'edit' && selected && <ProductModal product={selected} onClose={() => { setModal(null); setSelected(null); }} />}
      {openMenuId && <div style={{ position: 'fixed', inset: 0, zIndex: 50 }} onClick={() => setOpenMenuId(null)} />}
    </div>
  );
}
