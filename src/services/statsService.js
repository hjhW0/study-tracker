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

    /**
     * 获取热力图数据（最近365天）
     * 返回按周分组的数组，每周7天（周日开始）
     */
    async getHeatmapData() {
        const history = await Storage.loadHistory();
        const rateMap = {};
        history.forEach((h) => {
            rateMap[h.date] = h.rate;
        });

        const today = new Date();
        const endDate = new Date(today);

        // 找到本周日（结束日）
        const dayOfWeek = today.getDay();
        endDate.setDate(today.getDate() + (6 - dayOfWeek));

        // 往前推52周
        const startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() - 52 * 7 + 1);

        const weeks = [];
        let currentWeek = [];
        const d = new Date(startDate);

        while (d <= endDate) {
            const dateStr = d.toISOString().slice(0, 10);
            const rate = rateMap[dateStr];
            let level = 0;
            if (rate > 0) level = 1;
            if (rate >= 40) level = 2;
            if (rate >= 70) level = 3;
            if (rate >= 90) level = 4;

            currentWeek.push({
                date: dateStr,
                rate: rate ?? 0,
                level,
                isFuture: d > today,
            });

            if (currentWeek.length === 7) {
                weeks.push(currentWeek);
                currentWeek = [];
            }
            d.setDate(d.getDate() + 1);
        }

        if (currentWeek.length > 0) {
            weeks.push(currentWeek);
        }

        return weeks;
    },
};
