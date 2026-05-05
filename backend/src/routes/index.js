const express = require('express');
const { body } = require('express-validator');
const { signup, login, getMe } = require('../controllers/authController');
const { getProjects, getProject, createProject, updateProject, deleteProject, addMember, removeMember } = require('../controllers/projectController');
const { getTasks, getProjectTasks, createTask, updateTask, deleteTask, getDashboard } = require('../controllers/taskController');
const { getUsers, getUser, updateUserRole } = require('../controllers/userController');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

// ─── Auth ─────────────────────────────────────────────
router.post('/auth/signup', [
  body('name').trim().notEmpty().withMessage('Name required'),
  body('email').isEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be 6+ characters'),
], signup);

router.post('/auth/login', [
  body('email').isEmail(),
  body('password').notEmpty(),
], login);

router.get('/auth/me', protect, getMe);

// ─── Dashboard ────────────────────────────────────────
router.get('/dashboard', protect, getDashboard);

// ─── Projects ─────────────────────────────────────────
router.get('/projects', protect, getProjects);
router.post('/projects', protect, [
  body('name').trim().notEmpty().withMessage('Project name required'),
], createProject);
router.get('/projects/:id', protect, getProject);
router.put('/projects/:id', protect, updateProject);
router.delete('/projects/:id', protect, deleteProject);
router.post('/projects/:id/members', protect, addMember);
router.delete('/projects/:id/members/:userId', protect, removeMember);

// ─── Tasks ────────────────────────────────────────────
router.get('/tasks', protect, getTasks);
router.get('/projects/:projectId/tasks', protect, getProjectTasks);
router.post('/projects/:projectId/tasks', protect, [
  body('title').trim().notEmpty().withMessage('Task title required'),
], createTask);
router.put('/tasks/:id', protect, updateTask);
router.delete('/tasks/:id', protect, deleteTask);

// ─── Users ────────────────────────────────────────────
router.get('/users', protect, adminOnly, getUsers);
router.get('/users/:id', protect, getUser);
router.put('/users/:id/role', protect, adminOnly, [
  body('role').isIn(['admin', 'member']),
], updateUserRole);

module.exports = router;
