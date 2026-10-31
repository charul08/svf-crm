import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileText, Plus } from 'lucide-react';
import api from '../../lib/api';

export default function QuotesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['quotes'],
    queryFn: async () => { const { data } = await api.get('/quotes', { params: { limit: 20 } }); return data; },
  });
  const quotes = data?.data || [];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Quotes</h1>
          <p className="page-subtitle">{quotes.length} quotes</p>
        </div>
        <button className="btn btn-primary"><Plus size={16} /> New Quote</button>
      </div>
      <div className="table-wrapper">
        <table>
          <thead>
            <tr><th>Quote #</th><th>Status</th><th>Subtotal</th><th>Grand Total</th><th>Valid Until</th><th>Created</th></tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => <tr key={i}>{Array.from({ length: 6 }).map((_, j) => <td key={j}><div className="skeleton" style={{ height: 14, width: 80 }} /></td>)}</tr>)
            ) : quotes.length === 0 ? (
              <tr><td colSpan={6}>
                <div className="empty-state">
                  <div className="empty-icon"><FileText size={22} /></div>
                  <div style={{ fontWeight: 600 }}>No quotes yet</div>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Create a quote from a deal to get started</p>
                </div>
              </td></tr>
            ) : quotes.map((q: any) => (
              <tr key={q.id}>
                <td style={{ fontWeight: 700, color: 'var(--color-primary-400)' }}>{q.quoteNumber}</td>
                <td><span className="badge badge-blue">{q.status}</span></td>
                <td>₹{Number(q.subtotal || 0).toLocaleString('en-IN')}</td>
                <td style={{ fontWeight: 700, color: '#10b981' }}>₹{Number(q.grandTotal || 0).toLocaleString('en-IN')}</td>
                <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{q.validUntil ? new Date(q.validUntil).toLocaleDateString('en-IN') : '—'}</td>
                <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(q.createdAt).toLocaleDateString('en-IN')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
