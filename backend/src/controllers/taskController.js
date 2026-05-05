const { pool } = require('../config/db');

const isMember = async (projectId, userId) => {
  const [rows] = await pool.query(
    'SELECT role FROM project_members WHERE project_id = ? AND user_id = ?',
    [projectId, userId]
  );
  return rows.length ? rows[0] : null;
};

exports.createTask = async (req, res) => {
  const { title, description, assigned_to, status, priority, due_date } = req.body;
  const project_id = req.params.projectId;
  if (!title) return res.status(400).json({ message: 'Title is required' });
  try {
    const member = await isMember(project_id, req.user.id);
    if (!member) return res.status(403).json({ message: 'Not a project member' });

    const [result] = await pool.query(
      `INSERT INTO tasks (title, description, project_id, assigned_to, created_by, status, priority, due_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, description || '', project_id, assigned_to || null, req.user.id,
       status || 'todo', priority || 'medium', due_date || null]
    );
    res.status(201).json({ id: result.insertId, title, project_id, status: status || 'todo' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getTasks = async (req, res) => {
  const project_id = req.params.projectId;
  try {
    const member = await isMember(project_id, req.user.id);
    if (!member) return res.status(403).json({ message: 'Not a project member' });

    const [tasks] = await pool.query(
      `SELECT t.*, u.name as assigned_to_name, c.name as created_by_name
       FROM tasks t
       LEFT JOIN users u ON u.id = t.assigned_to
       JOIN users c ON c.id = t.created_by
       WHERE t.project_id = ?
       ORDER BY t.created_at DESC`,
      [project_id]
    );
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.updateTask = async (req, res) => {
  const { title, description, assigned_to, status, priority, due_date } = req.body;
  try {
    const [task] = await pool.query('SELECT * FROM tasks WHERE id = ?', [req.params.id]);
    if (!task.length) return res.status(404).json({ message: 'Task not found' });

    const member = await isMember(task[0].project_id, req.user.id);
    if (!member) return res.status(403).json({ message: 'Not a project member' });

    await pool.query(
      `UPDATE tasks SET title=?, description=?, assigned_to=?, status=?, priority=?, due_date=?
       WHERE id=?`,
      [title || task[0].title, description ?? task[0].description,
       assigned_to ?? task[0].assigned_to, status || task[0].status,
       priority || task[0].priority, due_date ?? task[0].due_date, req.params.id]
    );
    res.json({ message: 'Task updated' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const [task] = await pool.query('SELECT * FROM tasks WHERE id = ?', [req.params.id]);
    if (!task.length) return res.status(404).json({ message: 'Task not found' });

    const member = await isMember(task[0].project_id, req.user.id);
    if (!member || (member.role !== 'admin' && task[0].created_by !== req.user.id))
      return res.status(403).json({ message: 'Unauthorized' });

    await pool.query('DELETE FROM tasks WHERE id = ?', [req.params.id]);
    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getDashboard = async (req, res) => {
  try {
    const [stats] = await pool.query(
      `SELECT
        COUNT(*) as total,
        SUM(status = 'todo') as todo,
        SUM(status = 'in_progress') as in_progress,
        SUM(status = 'done') as done,
        SUM(due_date < CURDATE() AND status != 'done') as overdue
       FROM tasks t
       JOIN project_members pm ON pm.project_id = t.project_id
       WHERE pm.user_id = ?`,
      [req.user.id]
    );

    const [recent] = await pool.query(
      `SELECT t.*, p.name as project_name, u.name as assigned_to_name
       FROM tasks t
       JOIN projects p ON p.id = t.project_id
       JOIN project_members pm ON pm.project_id = t.project_id
       LEFT JOIN users u ON u.id = t.assigned_to
       WHERE pm.user_id = ?
       ORDER BY t.updated_at DESC LIMIT 10`,
      [req.user.id]
    );

    const [overdue] = await pool.query(
      `SELECT t.*, p.name as project_name FROM tasks t
       JOIN projects p ON p.id = t.project_id
       JOIN project_members pm ON pm.project_id = t.project_id
       WHERE pm.user_id = ? AND t.due_date < CURDATE() AND t.status != 'done'
       ORDER BY t.due_date ASC`,
      [req.user.id]
    );

    res.json({ stats: stats[0], recent, overdue });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
