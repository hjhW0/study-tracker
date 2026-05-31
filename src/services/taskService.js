/**
 * 任务服务
 * 核心模块，负责所有任务的业务逻辑
 * 不关心 UI 和存储细节
 */

import { Storage } from '../data/storage.js';
import { createTask } from '../data/models.js';
import { PRIORITY } from '../data/constants.js';
import { getToday } from '../utils/date.js';
import { EventBus, Events } from '../utils/eventBus.js';

// 优先级排序权重
const PRIORITY_ORDER = {
  [PRIORITY.HIGH]: 3,
  [PRIORITY.MEDIUM]: 2,
  [PRIORITY.LOW]: 1
};

export const TaskService = {
  // ============ 查询 ============

  getAll() {
    return Storage.loadTasks();
  },

  getByType(type) {
    return this.getAll().filter(t => t.type === type);
  },

  getDailyTasks() {
    return this._sort(this.getByType('daily'));
  },

  getLongtermTasks() {
    return this._sort(this.getByType('longterm'));
  },

  getById(id) {
    return this.getAll().find(t => t.id === id) || null;
  },

  // ============ 搜索 & 筛选 ============

  search(keyword, type) {
    const tasks = type ? this.getByType(type) : this.getAll();
    if (!keyword) return this._sort(tasks);
    const lower = keyword.toLowerCase();
    return this._sort(tasks.filter(t =>
      t.content.toLowerCase().includes(lower) ||
      t.tags.some(tag => tag.toLowerCase().includes(lower))
    ));
  },

  getByTag(tag) {
    return this.getAll().filter(t =>
      t.tags.some(tg => tg.toLowerCase() === tag.toLowerCase())
    );
  },

  getTagStats() {
    const tasks = this.getByType('longterm');
    const tagMap = {};

    tasks.forEach(t => {
      t.tags.forEach(tag => {
        if (!tagMap[tag]) tagMap[tag] = { total: 0, completed: 0 };
        tagMap[tag].total++;
        if (t.completed) tagMap[tag].completed++;
      });
    });

    return Object.entries(tagMap).map(([name, stats]) => ({
      name,
      total: stats.total,
      completed: stats.completed,
      rate: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0
    }));
  },

  // ============ 写操作 ============

  add(content, options = {}) {
    const tasks = this.getAll();
    const today = getToday();

    const task = createTask({
      content,
      type: options.type || 'daily',
      priority: options.priority || PRIORITY.MEDIUM,
      deadline: options.deadline || null,
      lastReset: options.type === 'daily' ? today : null,
      tags: options.tags || []
    });

    tasks.push(task);
    Storage.saveTasks(tasks);

    EventBus.emit(Events.TASK_ADDED, { task });
    EventBus.emit(Events.DATA_CHANGED);

    return task;
  },

  toggle(id) {
    const tasks = this.getAll();
    const task = tasks.find(t => t.id === id);
    if (!task) return null;

    task.completed = !task.completed;
    task.completedAt = task.completed ? new Date().toISOString() : null;

    Storage.saveTasks(tasks);

    EventBus.emit(Events.TASK_TOGGLED, { task });
    EventBus.emit(Events.DATA_CHANGED);

    return task;
  },

  delete(id) {
    const tasks = this.getAll().filter(t => t.id !== id);
    Storage.saveTasks(tasks);

    EventBus.emit(Events.TASK_DELETED, { taskId: id });
    EventBus.emit(Events.DATA_CHANGED);
  },

  update(id, changes) {
    const tasks = this.getAll();
    const task = tasks.find(t => t.id === id);
    if (!task) return null;

    Object.assign(task, changes);
    Storage.saveTasks(tasks);

    EventBus.emit(Events.DATA_CHANGED);
    return task;
  },

  // ============ 批量操作 ============

  dailyReset() {
    const tasks = this.getAll();
    const today = getToday();
    let resetCount = 0;

    tasks.forEach(task => {
      if (task.type === 'daily' && task.lastReset !== today) {
        task.completed = false;
        task.completedAt = null;
        task.lastReset = today;
        resetCount++;
      }
    });

    if (resetCount > 0) {
      Storage.saveTasks(tasks);
    }

    return resetCount;
  },

  moveOverdueTasks() {
    // 将过期的长期任务标记（未来可扩展为自动移到"待处理"）
    const tasks = this.getAll();
    const today = getToday();
    let overdueCount = 0;

    tasks.forEach(task => {
      if (task.type === 'longterm' && task.deadline && !task.completed) {
        if (task.deadline < today) {
          task.metadata = { ...task.metadata, overdue: true };
          overdueCount++;
        }
      }
    });

    if (overdueCount > 0) {
      Storage.saveTasks(tasks);
    }

    return overdueCount;
  },

  // ============ 内部方法 ============

  _sort(tasks) {
    return [...tasks].sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      return (PRIORITY_ORDER[b.priority] || 0) - (PRIORITY_ORDER[a.priority] || 0);
    });
  }
};
