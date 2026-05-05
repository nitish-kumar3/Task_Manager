const sequelize = require('../config/database');
const User = require('./User');
const Project = require('./Project');
const ProjectMember = require('./ProjectMember');
const Task = require('./Task');

// User <-> Project (ownership)
User.hasMany(Project, { foreignKey: 'ownerId', as: 'ownedProjects' });
Project.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });

// User <-> Project (membership via ProjectMember)
User.belongsToMany(Project, {
  through: ProjectMember,
  foreignKey: 'userId',
  otherKey: 'projectId',
  as: 'memberProjects',
});
Project.belongsToMany(User, {
  through: ProjectMember,
  foreignKey: 'projectId',
  otherKey: 'userId',
  as: 'members',
});

// Project <-> Task
Project.hasMany(Task, { foreignKey: 'projectId', as: 'tasks', onDelete: 'CASCADE' });
Task.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });

// User -> Task (assigned)
User.hasMany(Task, { foreignKey: 'assignedToId', as: 'assignedTasks' });
Task.belongsTo(User, { foreignKey: 'assignedToId', as: 'assignedTo' });

// User -> Task (created)
User.hasMany(Task, { foreignKey: 'createdById', as: 'createdTasks' });
Task.belongsTo(User, { foreignKey: 'createdById', as: 'createdBy' });

module.exports = { sequelize, User, Project, ProjectMember, Task };
