import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });
  const [saving, setSaving] = useState(false);

  const fetchProjects = () => {
    api.get('/projects').then(r => setProjects(r.data)).finally(() => setLoading(false));
  };
  useEffect(fetchProjects, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/projects', form);
      toast.success('Project created!');
      setShowModal(false);
      setForm({ name: '', description: '' });
      fetchProjects();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create project');
    } finally { setSaving(false); }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700 }}>Projects</h1>
          <p style={{ color: '#94a3b8', marginTop: 4 }}>Manage your team projects</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>+ New Project</button>
      </div>

      {loading ? <div style={{ color: '#94a3b8' }}>Loading...</div> :
        !projects.length ? (
          <div className="card" style={{ textAlign: 'center', padding: 48 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📁</div>
            <h3 style={{ fontWeight: 600, marginBottom: 8 }}>No projects yet</h3>
            <p style={{ color: '#94a3b8', marginBottom: 20 }}>Create your first project to get started</p>
            <button className="btn-primary" onClick={() => setShowModal(true)}>Create Project</button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {projects.map(p => (
              <Link key={p.id} to={`/projects/${p.id}`} style={{ textDecoration: 'none' }}>
                <div className="card" style={{ cursor: 'pointer', transition: 'border-color 0.2s, transform 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#6c63ff'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#2a2a3a'; e.currentTarget.style.transform = 'none'; }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ fontWeight: 600, fontSize: 16 }}>{p.name}</div>
                    <span style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'var(--mono)' }}>
                      {new Date(p.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p style={{ color: '#94a3b8', fontSize: 13, marginBottom: 16, minHeight: 36 }}>
                    {p.description || 'No description'}
                  </p>
                  <div style={{ display: 'flex', gap: 16, fontSize: 13, color: '#94a3b8' }}>
                    <span>👥 {p.member_count} members</span>
                    <span>📋 {p.task_count} tasks</span>
                  </div>
                  <div style={{ marginTop: 10, fontSize: 12, color: '#4a4a6a' }}>by {p.owner_name}</div>
                </div>
              </Link>
            ))}
          </div>
        )
      }

      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }} onClick={() => setShowModal(false)}>
          <div className="card" style={{ width: 440, maxWidth: '90vw' }} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20 }}>New Project</h2>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 13, color: '#94a3b8' }}>Project Name *</label>
                <input placeholder="My Awesome Project" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 13, color: '#94a3b8' }}>Description</label>
                <textarea placeholder="Describe your project..." value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })} rows={3} style={{ resize: 'vertical' }} />
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Creating...' : 'Create Project'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
