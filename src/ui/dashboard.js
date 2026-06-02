/**
 * 仪表盘 UI
 * 负责顶部英雄卡片：问候语、进度条、统计数据
 */

import { StatsService } from '../services/statsService.js';
import { StreakService } from '../services/streakService.js';
import { TaskService } from '../services/taskService.js';
import { EventBus, Events } from '../utils/eventBus.js';
import { getToday } from '../utils/date.js';

// ---- DOM 缓存 ----
let els = {};

export const Dashboard = {
    init() {
        els = {
            greeting: document.getElementById('heroGreeting'),
            title: document.getElementById('heroTitle'),
            progressFill: document.getElementById('heroProgressFill'),
            streak: document.getElementById('heroStreak'),
            daily: document.getElementById('heroDaily'),
            longterm: document.getElementById('heroLongterm'),
        };

        // 监听任务变化（只刷新今日相关数据）
        EventBus.on(Events.TASK_UPDATED, ({ date }) => {
            if (date === getToday()) this.render();
        });
    },

    async render() {
        const todayStats = await StatsService.getTodayRate();
        const tasks = await TaskService.getAll();
        const dailyCount = tasks.filter((t) => t.type === 'daily').length;
        const longtermCount = tasks.filter((t) => t.type === 'longterm').length;
        const streak = await StreakService.getCurrentStreak();

        // 问候语
        this._setGreeting();

        // 标题
        if (els.title) {
            const remaining = todayStats.total - todayStats.completed;
            if (todayStats.total === 0) {
                els.title.textContent = '今天还没有任务';
            } else if (remaining === 0) {
                els.title.textContent = '🎉 今天的任务全部完成！';
            } else {
                els.title.textContent = `今天还剩 ${remaining} 项任务`;
            }
        }

        // 进度条
        if (els.progressFill) {
            els.progressFill.style.width = `${todayStats.rate}%`;
            // 根据完成率变色
            if (todayStats.rate >= 80) {
                els.progressFill.style.background = 'var(--success)';
            } else if (todayStats.rate >= 50) {
                els.progressFill.style.background = 'var(--warning)';
            } else {
                els.progressFill.style.background = 'var(--primary)';
            }
        }

        // 统计数字
        if (els.streak) els.streak.textContent = streak;
        if (els.daily) els.daily.textContent = dailyCount;
        if (els.longterm) els.longterm.textContent = longtermCount;
    },

    _setGreeting() {
        if (!els.greeting) return;
        const hour = new Date().getHours();
        let icon, text;
        if (hour < 6) {
            icon = '🌙';
            text = '夜深了';
        } else if (hour < 12) {
            icon = '☀️';
            text = '早上好';
        } else if (hour < 18) {
            icon = '☀️';
            text = '下午好';
        } else {
            icon = '🌅';
            text = '晚上好';
        }
        els.greeting.textContent = `${icon} ${text}`;
    },
};
