const router = require('express').Router({ mergeParams: true });
const { authenticate } = require('../middleware/auth');
const { createTask, getTasks, updateTask, deleteTask } = require('../controllers/taskController');

router.use(authenticate);
router.get('/', getTasks);
router.post('/', createTask);
router.put('/:id', updateTask);
router.delete('/:id', deleteTask);

module.exports = router;
