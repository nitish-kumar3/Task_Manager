const { pool } = require('../config/db');

exports.createProject = async (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ message: 'Project name is required' });
  try {
    const [result] = await pool.query(
      'INSERT INTO projects (name, description, owner_id) VALUES (?, ?, ?)',
      [name, description || '', req.user.id]
    );
    // Add owner as admin member
    await pool.query(
      'INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)',
      [result.insertId, req.user.id, 'admin']
    );
    res.status(201).json({ id: result.insertId, name, description, owner_id: req.user.id });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getProjects = async (req, res) => {
  try {
    const [projects] = await pool.query(
      `SELECT p.*, u.name as owner_name,
        (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id) as task_count,
        (SELECT COUNT(*) FROM project_members pm WHERE pm.project_id = p.id) as member_count
       FROM projects p
       JOIN users u ON p.owner_id = u.id
       JOIN project_members pm ON pm.project_id = p.id
       WHERE pm.user_id = ?
       ORDER BY p.created_at DESC`,
      [req.user.id]
    );
    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getProject = async (req, res) => {
  try {
    const [projects] = await pool.query(
      `SELECT p.*, u.name as owner_name FROM projects p
       JOIN users u ON p.owner_id = u.id
       JOIN project_members pm ON pm.project_id = p.id
       WHERE p.id = ? AND pm.user_id = ?`,
      [req.params.id, req.user.id]
    );
    if (!projects.length) return res.status(404).json({ message: 'Project not found' });

    const [members] = await pool.query(
      `SELECT u.id, u.name, u.email, pm.role FROM project_members pm
       JOIN users u ON u.id = pm.user_id WHERE pm.project_id = ?`,
      [req.params.id]
    );
    res.json({ ...projects[0], members });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.updateProject = async (req, res) => {
  const { name, description } = req.body;
  try {
    const [pm] = await pool.query(
      'SELECT role FROM project_members WHERE project_id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (!pm.length || pm[0].role !== 'admin') return res.status(403).json({ message: 'Admin access required' });

    await pool.query('UPDATE projects SET name = ?, description = ? WHERE id = ?', [name, description, req.params.id]);
    res.json({ message: 'Project updated' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.deleteProject = async (req, res) => {
  try {
    const [proj] = await pool.query('SELECT owner_id FROM projects WHERE id = ?', [req.params.id]);
    if (!proj.length) return res.status(404).json({ message: 'Project not found' });
    if (proj[0].owner_id !== req.user.id && req.user.role !== 'admin')
      return res.status(403).json({ message: 'Unauthorized' });

    await pool.query('DELETE FROM projects WHERE id = ?', [req.params.id]);
    res.json({ message: 'Project deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.addMember = async (req, res) => {
  const { email, role } = req.body;
  try {
    const [pm] = await pool.query(
      'SELECT role FROM project_members WHERE project_id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (!pm.length || pm[0].role !== 'admin') return res.status(403).json({ message: 'Admin access required' });

    const [users] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (!users.length) return res.status(404).json({ message: 'User not found' });

    await pool.query(
      'INSERT IGNORE INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)',
      [req.params.id, users[0].id, role || 'member']
    );
    res.json({ message: 'Member added' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.removeMember = async (req, res) => {
  try {
    const [pm] = await pool.query(
      'SELECT role FROM project_members WHERE project_id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (!pm.length || pm[0].role !== 'admin') return res.status(403).json({ message: 'Admin access required' });

    await pool.query('DELETE FROM project_members WHERE project_id = ? AND user_id = ?', [req.params.id, req.params.userId]);
    res.json({ message: 'Member removed' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
