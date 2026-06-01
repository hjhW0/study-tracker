/**
 * 统计服务
 * 负责完成率计算、历史记录、月度统计
 */

import { Storage } from '../data/storage.js';
import { createHistoryRecord } from '../data/models.js';
import { TaskService } from './taskService.js';
import { getToday, getMonthStr } from '../utils/date.js';

export const StatsService = {
    async getTodayRate() {
        const tasks = await TaskService.getByType('daily');
        const total = tasks.length;
        const completed = tasks.filter((t) => t.completed).length;
        const rate = total === 0 ? 0 : Math.round((completed / total) * 100);
        return { total, completed, rate };
    },

    async getLongtermRate() {
        const tasks = await TaskService.getByType('longterm');
        const total = tasks.length;
        const completed = tasks.filter((t) => t.completed).length;
        const rate = total === 0 ? 0 : Math.round((completed / total) * 100);
        return { total, completed, rate };
    },

    async saveDayProgress(date) {
        const history = await Storage.loadHistory();
        const tasks = await TaskService.getByType('daily');
        const total = tasks.length;
        const completed = tasks.filter((t) => t.completed).length;
        const rate = total === 0 ? 0 : Math.round((completed / total) * 100);

        const record = createHistoryRecord({ date, total, completed, rate });
        const existing = history.findIndex((h) => h.date === date);

        if (existing >= 0) {
            history[existing] = record;
        } else {
            history.push(record);
        }

        await Storage.saveHistory(history);
        return record;
    },

    async saveTodayProgress() {
        return this.saveDayProgress(getToday());
    },

    async getHistory() {
        return Storage.loadHistory();
    },

    async getRecentDays(n = 7) {
        const history = await Storage.loadHistory();
        return history.slice(-n);
    },

    async getMonthlyStats() {
        const monthStr = getMonthStr();
        const history = await Storage.loadHistory();
        const monthData = history.filter((h) => h.date.startsWith(monthStr));

        if (monthData.length === 0) {
            return { totalDays: 0, goodDays: 0, avgRate: 0, maxRate: 0, minRate: 0 };
        }

        const totalDays = monthData.length;
        const goodDays = monthData.filter((d) => d.rate >= 80).length;
        const avgRate = Math.round(monthData.reduce((s, d) => s + d.rate, 0) / totalDays);
        const maxRate = Math.max(...monthData.map((d) => d.rate));
        const minRate = Math.min(...monthData.map((d) => d.rate));

        return { totalDays, goodDays, avgRate, maxRate, minRate };
    },

    async getHistoryReversed() {
        const history = await Storage.loadHistory();
        return [...history].reverse();
    },
};
