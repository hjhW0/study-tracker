/**
 * 数据模型工厂
 * 用工厂函数创建对象，新增字段只改这里，不会炸
 */

import { generateId } from '../utils/helpers.js';

export function createTask(data = {}) {
  return {
    id: data.id || generateId(),
    content: data.content || '',
    type: data.type || 'daily',
    priority: data.priority || 'medium',
    completed: data.completed || false,

    // 长期任务
    deadline: data.deadline || null,

    // 每日任务
    lastReset: data.lastReset || null,

    // 预留字段
    tags: data.tags || [],
    estimateMinutes: data.estimateMinutes || 0,
    actualMinutes: data.actualMinutes || 0,
    note: data.note || '',

    // 时间戳
    createdAt: data.createdAt || new Date().toISOString(),
    completedAt: data.completedAt || null,

    // 元数据（不破坏结构即可扩展）
    metadata: data.metadata || {}
  };
}

export function createHistoryRecord(data = {}) {
  return {
    date: data.date || '',
    total: data.total || 0,
    completed: data.completed || 0,
    rate: data.rate || 0,
    totalMinutes: data.totalMinutes || 0
  };
}

export function createGoal(data = {}) {
  return {
    id: data.id || generateId(),
    name: data.name || '',
    description: data.description || '',
    targetDate: data.targetDate || null,
    createdAt: data.createdAt || new Date().toISOString()
  };
}

export function createFocusRecord(data = {}) {
  return {
    id: data.id || generateId(),
    taskId: data.taskId || null,
    startedAt: data.startedAt || null,
    endedAt: data.endedAt || null,
    durationMinutes: data.durationMinutes || 0,
    completed: data.completed || false
  };
}
