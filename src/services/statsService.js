/**
 * 统计服务
 * 负责完成率计算、历史记录、月度统计
 */

import { Storage } from '../data/storage.js';
import { createHistoryRecord } from '../data/models.js';
import { TaskService } from './taskService.js';
import { getToday, getMonthStr } from '../utils/date.js';

export const StatsService = {
  getTodayRate() {
    const tasks = TaskService.getByType('daily');
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const rate = total === 0 ? 0 : Math.round((completed / total) * 100);
    return { total, completed, rate };
  },

  getLongtermRate() {
    const tasks = TaskService.getByType('longterm');
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const rate = total === 0 ? 0 : Math.round((completed / total) * 100);
    return { total, completed, rate };
  },

  saveDayProgress(date) {
    const history = Storage.loadHistory();
    const tasks = TaskService.getByType('daily');
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const rate = total === 0 ? 0 : Math.round((completed / total) * 100);

    const record = createHistoryRecord({ date, total, completed, rate });
    const existing = history.findIndex(h => h.date === date);

    if (existing >= 0) {
      history[existing] = record;
    } else {
      history.push(record);
    }

    Storage.saveHistory(history);
    return record;
  },

  saveTodayProgress() {
    return this.saveDayProgress(getToday());
  },

  getHistory() {
    return Storage.loadHistory();
  },

  getRecentDays(n = 7) {
    return Storage.loadHistory().slice(-n);
  },

  getMonthlyStats() {
    const monthStr = getMonthStr();
    const history = Storage.loadHistory().filter(h => h.date.startsWith(monthStr));

    if (history.length === 0) {
      return { totalDays: 0, goodDays: 0, avgRate: 0, maxRate: 0, minRate: 0 };
    }

    const totalDays = history.length;
    const goodDays = history.filter(d => d.rate >= 80).length;
    const avgRate = Math.round(history.reduce((s, d) => s + d.rate, 0) / totalDays);
    const maxRate = Math.max(...history.map(d => d.rate));
    const minRate = Math.min(...history.map(d => d.rate));

    return { totalDays, goodDays, avgRate, maxRate, minRate };
  },

  getHistoryReversed() {
    return [...Storage.loadHistory()].reverse();
  }
};
