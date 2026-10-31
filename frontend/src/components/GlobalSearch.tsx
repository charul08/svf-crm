import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Users, UserCheck, Building2, TrendingUp, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';

interface SearchResults {
  leads: any[];
  contacts: any[];
  accounts: any[];
  deals: any[];
  products: any[];
}

const SECTIONS = [
  { key: 'leads', label: 'Leads', icon: Users, path: '/leads' },
  { key: 'contacts', label: 'Contacts', icon: UserCheck, path: '/contacts' },
  { key: 'accounts', label: 'Accounts', icon: Building2, path: '/accounts' },
  { key: 'deals', label: 'Deals', icon: TrendingUp, path: '/deals' },
  { key: 'products', label: 'Products', icon: Package, path: '/products' },
];

export default function GlobalSearch({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    if (query.trim().length < 2) {
      setResults(null);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const { data } = await api.get('/search', { params: { q: query }, signal: controller.signal });
        setResults(data.data);
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [query]);

  const hasResults = results && Object.values(results).some((arr) => arr.length > 0);

  const goTo = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal"
        style={{ maxWidth: 560, padding: 0, overflow: 'hidden' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
          <Search size={18} color="var(--text-muted)" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search leads, contacts, deals, products..."
            style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: 15, color: 'var(--text-primary)' }}
            onKeyDown={(e) => e.key === 'Escape' && onClose()}
          />
          {loading && (
            <div className="animate-spin" style={{ width: 16, height: 16, border: '2px solid var(--bg-elevated)', borderTopColor: 'var(--color-primary-500)', borderRadius: '50%' }} />
          )}
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}><X size={16} /></button>
        </div>

        {/* Results */}
        <div style={{ maxHeight: 450, overflowY: 'auto', padding: hasResults ? '8px 0' : '32px 0' }}>
          {!hasResults && !loading && query.length >= 2 && (
            <div className="empty-state" style={{ padding: '32px' }}>
              <div className="empty-icon"><Search size={22} /></div>
              <div style={{ fontWeight: 600 }}>No results for "{query}"</div>
            </div>
          )}

          {!query && (
            <div style={{ padding: '20px 16px', color: 'var(--text-muted)', fontSize: 13, textAlign: 'center' }}>
              Start typing to search across all modules
            </div>
          )}

          {results && SECTIONS.map((section) => {
            const items = results[section.key as keyof SearchResults];
            if (!items || items.length === 0) return null;
            return (
              <div key={section.key} style={{ marginBottom: 4 }}>
                <div style={{ padding: '6px 16px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>
                  {section.label}
                </div>
                {items.map((item: any) => (
                  <button
                    key={item.id}
                    className="dropdown-item"
                    style={{ padding: '10px 16px', width: '100%' }}
                    onClick={() => goTo(section.path)}
                  >
                    <section.icon size={15} color="var(--text-muted)" />
                    <span style={{ flex: 1, textAlign: 'left' }}>
                      <span style={{ fontWeight: 600 }}>
                        {item.firstName ? `${item.firstName} ${item.lastName}` : item.name}
                      </span>
                      {item.email && (
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 8 }}>{item.email}</span>
                      )}
                      {item.company && (
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 8 }}>{item.company}</span>
                      )}
                    </span>
                    {item.status && (
                      <span className="badge badge-blue" style={{ fontSize: 10 }}>{item.status}</span>
                    )}
                    {item.stage && (
                      <span className="badge badge-green" style={{ fontSize: 10 }}>{item.stage}</span>
                    )}
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
