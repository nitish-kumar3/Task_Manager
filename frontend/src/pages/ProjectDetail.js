import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const STATUSES = ['todo', 'in_progress', 'done'];
const PRIORITIES = ['low', 'medium', 'high'];

function TaskModal({ task, onClose, onSave, members }) {
  const [form, setForm] = useState(task || { title: '', description: '', assigned_to: '', status: 'todo', priority: 'medium', due_date: '' });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try { await onSave(form); onClose(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed to save task'); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.7)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000 }} onClick={onClose}>
      <div className="card" style={{ width:480,maxWidth:'90vw',maxHeight:'90vh',overflowY:'auto' }} onClick={e=>e.stopPropagation()}>
        <h2 style={{ fontSize:18,fontWeight:600,marginBottom:20 }}>{task?.id ? 'Edit Task' : 'New Task'}</h2>
        <form onSubmit={handleSubmit} style={{ display:'flex',flexDirection:'column',gap:14 }}>
          <div>
            <label style={{ display:'block',marginBottom:6,fontSize:13,color:'#94a3b8' }}>Title *</label>
            <input placeholder="Task title" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} required />
          </div>
          <div>
            <label style={{ display:'block',marginBottom:6,fontSize:13,color:'#94a3b8' }}>Description</label>
            <textarea placeholder="Details..." value={form.description} onChange={e=>setForm({...form,description:e.target.value})} rows={3} style={{resize:'vertical'}} />
          </div>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12 }}>
            <div>
              <label style={{ display:'block',marginBottom:6,fontSize:13,color:'#94a3b8' }}>Status</label>
              <select value={form.status} onChange={e=>setForm({...form,status:e.target.value})}>
                {STATUSES.map(s=><option key={s} value={s}>{s.replace('_',' ')}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display:'block',marginBottom:6,fontSize:13,color:'#94a3b8' }}>Priority</label>
              <select value={form.priority} onChange={e=>setForm({...form,priority:e.target.value})}>
                {PRIORITIES.map(p=><option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12 }}>
            <div>
              <label style={{ display:'block',marginBottom:6,fontSize:13,color:'#94a3b8' }}>Assign To</label>
              <select value={form.assigned_to||''} onChange={e=>setForm({...form,assigned_to:e.target.value})}>
                <option value="">Unassigned</option>
                {members?.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display:'block',marginBottom:6,fontSize:13,color:'#94a3b8' }}>Due Date</label>
              <input type="date" value={form.due_date||''} onChange={e=>setForm({...form,due_date:e.target.value})} />
            </div>
          </div>
          <div style={{ display:'flex',gap:10,justifyContent:'flex-end',marginTop:8 }}>
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Task'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function MemberModal({ projectId, onClose, onDone }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post(`/projects/${projectId}/members`, { email, role });
      toast.success('Member added!');
      onDone();
      onClose();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.7)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000 }} onClick={onClose}>
      <div className="card" style={{ width:400,maxWidth:'90vw' }} onClick={e=>e.stopPropagation()}>
        <h2 style={{ fontSize:18,fontWeight:600,marginBottom:20 }}>Add Member</h2>
        <form onSubmit={handleSubmit} style={{ display:'flex',flexDirection:'column',gap:14 }}>
          <div>
            <label style={{ display:'block',marginBottom:6,fontSize:13,color:'#94a3b8' }}>Email</label>
            <input type="email" placeholder="member@example.com" value={email} onChange={e=>setEmail(e.target.value)} required />
          </div>
          <div>
            <label style={{ display:'block',marginBottom:6,fontSize:13,color:'#94a3b8' }}>Role</label>
            <select value={role} onChange={e=>setRole(e.target.value)}>
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div style={{ display:'flex',gap:10,justifyContent:'flex-end' }}>
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Adding...' : 'Add Member'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ProjectDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [filter, setFilter] = useState('all');

  const fetchAll = async () => {
    try {
      const [proj, taskRes] = await Promise.all([
        api.get(`/projects/${id}`),
        api.get(`/projects/${id}/tasks`),
      ]);
      setProject(proj.data);
      setTasks(taskRes.data);
    } catch { navigate('/projects'); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchAll(); }, [id]);

  const handleSaveTask = async (form) => {
    if (editTask?.id) {
      await api.put(`/projects/${id}/tasks/${editTask.id}`, form);
      toast.success('Task updated!');
    } else {
      await api.post(`/projects/${id}/tasks`, form);
      toast.success('Task created!');
    }
    fetchAll();
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await api.delete(`/projects/${id}/tasks/${taskId}`);
      toast.success('Task deleted');
      fetchAll();
    } catch (err) { toast.error('Failed to delete'); }
  };

  const handleDeleteProject = async () => {
    if (!window.confirm('Delete this project and all its tasks?')) return;
    try {
      await api.delete(`/projects/${id}`);
      toast.success('Project deleted');
      navigate('/projects');
    } catch (err) { toast.error('Unauthorized'); }
  };

  if (loading) return <div style={{ color: '#94a3b8' }}>Loading project...</div>;
  if (!project) return null;

  const myRole = project.members?.find(m => m.id === user?.id)?.role;
  const isAdmin = myRole === 'admin';
  const filtered = filter === 'all' ? tasks : tasks.filter(t => t.status === filter);

  const colTasks = (status) => filtered.filter(t => t.status === status);

  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:32 }}>
        <div>
          <div style={{ fontSize:13,color:'#94a3b8',marginBottom:4 }}>
            <span style={{ cursor:'pointer',color:'#6c63ff' }} onClick={()=>navigate('/projects')}>Projects</span> / {project.name}
          </div>
          <h1 style={{ fontSize:26,fontWeight:700 }}>{project.name}</h1>
          {project.description && <p style={{ color:'#94a3b8',marginTop:4 }}>{project.description}</p>}
        </div>
        <div style={{ display:'flex',gap:8 }}>
          {isAdmin && <button className="btn-secondary btn-sm" onClick={()=>setShowMemberModal(true)}>+ Member</button>}
          <button className="btn-primary btn-sm" onClick={()=>{setEditTask(null);setShowTaskModal(true);}}>+ Task</button>
          {isAdmin && <button className="btn-danger btn-sm" onClick={handleDeleteProject}>Delete</button>}
        </div>
      </div>

      {/* Members bar */}
      <div className="card" style={{ marginBottom:24,padding:'16px 20px' }}>
        <div style={{ display:'flex',alignItems:'center',gap:16,flexWrap:'wrap' }}>
          <span style={{ fontSize:13,color:'#94a3b8',fontWeight:600 }}>TEAM</span>
          {project.members?.map(m => (
            <div key={m.id} style={{ display:'flex',alignItems:'center',gap:8 }}>
              <div style={{ width:28,height:28,borderRadius:'50%',background:'#6c63ff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700 }}>
                {m.name[0].toUpperCase()}
              </div>
              <span style={{ fontSize:13 }}>{m.name}</span>
              <span className={`badge badge-${m.role}`} style={{ fontSize:10 }}>{m.role}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Filter */}
      <div style={{ display:'flex',gap:8,marginBottom:20 }}>
        {['all','todo','in_progress','done'].map(f => (
          <button key={f} onClick={()=>setFilter(f)}
            style={{ padding:'6px 14px',borderRadius:8,fontSize:13,fontWeight:500,border:'none',cursor:'pointer',
              background:filter===f?'#6c63ff':'#1a1a24',color:filter===f?'#fff':'#94a3b8' }}>
            {f==='all'?'All':f.replace('_',' ')}
          </button>
        ))}
        <span style={{ marginLeft:'auto',color:'#94a3b8',fontSize:13,lineHeight:'32px' }}>{filtered.length} tasks</span>
      </div>

      {/* Kanban board */}
      <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16 }}>
        {STATUSES.map(status => (
          <div key={status}>
            <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:12 }}>
              <span className={`badge badge-${status}`}>{status.replace('_',' ')}</span>
              <span style={{ fontSize:12,color:'#94a3b8' }}>({colTasks(status).length})</span>
            </div>
            <div style={{ display:'flex',flexDirection:'column',gap:10 }}>
              {colTasks(status).map(task => (
                <div key={task.id} className="card" style={{ padding:16,cursor:'pointer' }}
                  onMouseEnter={e=>e.currentTarget.style.borderColor='#6c63ff'}
                  onMouseLeave={e=>e.currentTarget.style.borderColor='#2a2a3a'}>
                  <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8 }}>
                    <div style={{ fontWeight:500,fontSize:14,flex:1 }}>{task.title}</div>
                    <div style={{ display:'flex',gap:4,marginLeft:8 }}>
                      <button className="btn-secondary btn-sm" style={{ padding:'3px 8px',fontSize:11 }}
                        onClick={()=>{setEditTask(task);setShowTaskModal(true);}}>✏️</button>
                      <button className="btn-danger btn-sm" style={{ padding:'3px 8px',fontSize:11 }}
                        onClick={()=>handleDeleteTask(task.id)}>🗑</button>
                    </div>
                  </div>
                  {task.description && <p style={{ fontSize:12,color:'#94a3b8',marginBottom:8 }}>{task.description}</p>}
                  <div style={{ display:'flex',gap:6,flexWrap:'wrap',alignItems:'center' }}>
                    <span className={`badge badge-${task.priority}`} style={{ fontSize:10 }}>{task.priority}</span>
                    {task.assigned_to_name && <span style={{ fontSize:11,color:'#94a3b8' }}>👤 {task.assigned_to_name}</span>}
                    {task.due_date && (
                      <span style={{ fontSize:11,color: new Date(task.due_date) < new Date() && task.status !== 'done' ? '#ef4444' : '#94a3b8',fontFamily:'var(--mono)',marginLeft:'auto' }}>
                        {new Date(task.due_date).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {colTasks(status).length === 0 && (
                <div style={{ padding:20,textAlign:'center',color:'#2a2a3a',fontSize:13,border:'2px dashed #1a1a24',borderRadius:10 }}>
                  No tasks
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {showTaskModal && (
        <TaskModal task={editTask} members={project.members}
          onClose={()=>{setShowTaskModal(false);setEditTask(null);}}
          onSave={handleSaveTask} />
      )}
      {showMemberModal && (
        <MemberModal projectId={id} onClose={()=>setShowMemberModal(false)} onDone={fetchAll} />
      )}
    </div>
  );
}
