import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const StatCard = ({ label, value, color, icon }) => (
  <div className="card" style={{ textAlign: 'center' }}>
    <div style={{ fontSize: 28, marginBottom: 6 }}>{icon}</div>
    <div style={{ fontSize: 32, fontWeight: 700, color }}>{value}</div>
    <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>{label}</div>
  </div>
);

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard').then(r => setData(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ color: '#94a3b8' }}>Loading dashboard...</div>;

  const { stats, recent, overdue } = data || {};

  const statusColor = { todo: '#94a3b8', in_progress: '#60a5fa', done: '#22c55e' };
  const priorityColor = { high: '#ef4444', medium: '#f59e0b', low: '#22c55e' };

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700 }}>Good day, {user?.name} 👋</h1>
        <p style={{ color: '#94a3b8', marginTop: 4 }}>Here's your task overview</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
        <StatCard icon="📋" label="Total Tasks" value={stats?.total || 0} color="#e2e8f0" />
        <StatCard icon="⏳" label="In Progress" value={stats?.in_progress || 0} color="#60a5fa" />
        <StatCard icon="✅" label="Completed" value={stats?.done || 0} color="#22c55e" />
        <StatCard icon="🔥" label="Overdue" value={stats?.overdue || 0} color="#ef4444" />
      </div>

      {overdue?.length > 0 && (
        <div className="card" style={{ marginBottom: 24, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.05)' }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: '#ef4444' }}>⚠️ Overdue Tasks ({overdue.length})</h2>
          {overdue.map(t => (
            <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #1a1a24' }}>
              <div>
                <div style={{ fontWeight: 500 }}>{t.title}</div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{t.project_name}</div>
              </div>
              <div style={{ fontSize: 12, color: '#ef4444', fontFamily: 'var(--mono)' }}>
                {new Date(t.due_date).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>🕒 Recent Tasks</h2>
        {!recent?.length ? (
          <p style={{ color: '#94a3b8', fontSize: 14 }}>No tasks yet. Create a project to get started!</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {recent.map(t => (
              <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px', background: '#1a1a24', borderRadius: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: statusColor[t.status] || '#94a3b8', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500, fontSize: 14 }}>{t.title}</div>
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>{t.project_name}</div>
                </div>
                <span className={`badge badge-${t.status}`}>{t.status.replace('_', ' ')}</span>
                <span className={`badge badge-${t.priority}`} style={{ fontSize: 11 }}>{t.priority}</span>
                {t.due_date && (
                  <span style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'var(--mono)', whiteSpace: 'nowrap' }}>
                    {new Date(t.due_date).toLocaleDateString()}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
