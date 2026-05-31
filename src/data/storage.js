/**
 * 存储层
 * 只负责数据的读写，不含任何业务逻辑
 * 后期替换为 IndexedDB / 云同步时，只需改这个文件
 */

import { HISTORY_KEEP_DAYS } from './constants.js';

const TASKS_KEY = 'study-tracker-tasks';
const HISTORY_KEY = 'study-tracker-history';
const GOALS_KEY = 'study-tracker-goals';

export const Storage = {
  // ---- 任务 ----
  loadTasks() {
    return this._get(TASKS_KEY, []);
  },

  saveTasks(tasks) {
    this._set(TASKS_KEY, tasks);
  },

  // ---- 历史记录 ----
  loadHistory() {
    return this._get(HISTORY_KEY, []);
  },

  saveHistory(history) {
    if (history.length > HISTORY_KEEP_DAYS) {
      history = history.slice(history.length - HISTORY_KEEP_DAYS);
    }
    this._set(HISTORY_KEY, history);
  },

  // ---- 目标 ----
  loadGoals() {
    return this._get(GOALS_KEY, []);
  },

  saveGoals(goals) {
    this._set(GOALS_KEY, goals);
  },

  // ---- 内部方法 ----
  _get(key, fallback) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : fallback;
    } catch (e) {
      console.error(`读取 ${key} 失败:`, e);
      return fallback;
    }
  },

  _set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(`保存 ${key} 失败:`, e);
    }
  }
};
