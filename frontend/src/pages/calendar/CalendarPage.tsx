import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar as CalIcon, Clock, Users } from 'lucide-react';
import api from '../../lib/api';

const typeColors: Record<string, string> = {
  CALL: '#3b82f6', EMAIL: '#8b5cf6', MEETING: '#10b981',
  FOLLOW_UP: '#f59e0b', DEMO: '#06b6d4', PRESENTATION: '#f97316',
  task: '#ef4444',
};

export default function CalendarPage() {
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString();

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['calendar', startOfMonth, endOfMonth],
    queryFn: async () => {
      const { data } = await api.get('/calendar', { params: { from: startOfMonth, to: endOfMonth } });
      return data.data || [];
    },
  });

  const upcoming = events.filter((e: any) => e.start && new Date(e.start) >= today).slice(0, 10);
  const past = events.filter((e: any) => e.start && new Date(e.start) < today).slice(0, 10);

  const EventItem = ({ event }: { event: any }) => {
    const color = typeColors[event.activityType || event.type] || '#64748b';
    const dt = event.start ? new Date(event.start) : null;
    return (
      <div style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ width: 4, borderRadius: 2, background: color, flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: 13 }}>{event.title}</div>
          <div style={{ display: 'flex', gap: 12, marginTop: 4, fontSize: 11, color: 'var(--text-muted)' }}>
            {dt && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Clock size={11} />
                {dt.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            <span style={{ background: `${color}20`, color, padding: '1px 6px', borderRadius: 999, fontWeight: 600, textTransform: 'uppercase', fontSize: 10 }}>
              {event.activityType || event.type}
            </span>
            {event.priority && (
              <span style={{ color: event.priority === 'URGENT' ? '#ef4444' : 'var(--text-muted)' }}>{event.priority}</span>
            )}
          </div>
          {event.description && <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>{event.description}</div>}
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Calendar</h1>
          <p className="page-subtitle">
            {today.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })} · {events.length} events
          </p>
        </div>
      </div>

      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {[0, 1].map(i => <div key={i} className="card"><div className="skeleton" style={{ height: 300 }} /></div>)}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', background: '#3b82f620', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CalIcon size={18} color="#3b82f6" />
              </div>
              <div>
                <div style={{ fontWeight: 700 }}>Upcoming</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{upcoming.length} events scheduled</div>
              </div>
            </div>
            {upcoming.length === 0 ? (
              <div className="empty-state" style={{ padding: '32px 0' }}>
                <CalIcon size={28} color="var(--text-muted)" />
                <div>No upcoming events</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {upcoming.map((e: any) => <EventItem key={e.id + e.type} event={e} />)}
              </div>
            )}
          </div>

          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', background: '#64748b20', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Clock size={18} color="#64748b" />
              </div>
              <div>
                <div style={{ fontWeight: 700 }}>Past Events</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{past.length} completed</div>
              </div>
            </div>
            {past.length === 0 ? (
              <div className="empty-state" style={{ padding: '32px 0' }}>
                <Clock size={28} color="var(--text-muted)" />
                <div>No past events this month</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', opacity: 0.7 }}>
                {past.map((e: any) => <EventItem key={e.id + e.type} event={e} />)}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
