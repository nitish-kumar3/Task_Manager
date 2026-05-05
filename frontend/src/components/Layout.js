import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); toast.success('Logged out'); };

  const navStyle = ({ isActive }) => ({
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '10px 16px', borderRadius: 10,
    color: isActive ? '#6c63ff' : '#94a3b8',
    background: isActive ? 'rgba(108,99,255,0.1)' : 'transparent',
    textDecoration: 'none', fontWeight: 500,
    transition: 'all 0.2s', fontSize: 15,
  });

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside style={{
        width: 240, background: '#0d0d14', borderRight: '1px solid #2a2a3a',
        display: 'flex', flexDirection: 'column', padding: '24px 16px',
        position: 'fixed', top: 0, left: 0, height: '100vh', zIndex: 100,
      }}>
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontWeight: 700, fontSize: 20, color: '#6c63ff', letterSpacing: '-0.5px' }}>
            ⚡ TaskFlow
          </div>
          <div style={{ fontSize: 12, color: '#4a4a6a', marginTop: 2 }}>Team Task Manager</div>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
          <NavLink to="/dashboard" style={navStyle}>📊 Dashboard</NavLink>
          <NavLink to="/projects" style={navStyle}>📁 Projects</NavLink>
        </nav>

        <div style={{ borderTop: '1px solid #2a2a3a', paddingTop: 16, marginTop: 16 }}>
          <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 4 }}>{user?.name}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <span className="badge badge-admin" style={{ fontSize: 11 }}>{user?.role}</span>
            <span style={{ fontSize: 12, color: '#4a4a6a', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email}</span>
          </div>
          <button className="btn-secondary btn-sm" onClick={handleLogout} style={{ width: '100%' }}>
            🚪 Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ marginLeft: 240, flex: 1, padding: '32px', minHeight: '100vh' }}>
        <Outlet />
      </main>
    </div>
  );
}
