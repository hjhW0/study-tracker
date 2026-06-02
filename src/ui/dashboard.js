/**
 * 仪表盘 UI
 * 负责顶部圆环进度条、连续打卡、任务数量等显示
 */

import { StatsService } from '../services/statsService.js';
import { StreakService } from '../services/streakService.js';
import { TaskService } from '../services/taskService.js';
import { EventBus, Events } from '../utils/eventBus.js';
import { getDayOfYear, getToday } from '../utils/date.js';

// ---- DOM 缓存 ----
let els = {};

// ---- 每日一句 ----
const MOTTOS = [
    '📚 今天也要加油学习',
    '🎯 离目标更近一步',
    '💪 坚持就是胜利',
    '🌟 每天进步一点点',
    '📖 知识改变命运',
    '🔥 保持专注，保持热爱',
    '🚀 行动是成功的阶梯',
    '🧠 学习是最好的投资',
    '⭐ 今天的努力，明天的收获',
    '💡 不积跬步，无以至千里',
    '🎓 书山有路勤为径',
    '🌈 越努力，越幸运',
];

// ---- 圆环常量 ----
const RING_RADIUS = 42;
const CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

export const Dashboard = {
    init() {
        els = {
            ringFill: document.getElementById('ringFill'),
            ringPercent: document.getElementById('ringPercent'),
            streakNum: document.getElementById('streakNum'),
            dailyDashCount: document.getElementById('dailyDashCount'),
            longtermDashCount: document.getElementById('longtermDashCount'),
            dailyBadge: document.getElementById('dailyBadge'),
            longtermBadge: document.getElementById('longtermBadge'),
            motto: document.getElementById('motto'),
        };

        // 设置圆环初始状态
        if (els.ringFill) {
            els.ringFill.style.strokeDasharray = CIRCUMFERENCE;
            els.ringFill.style.strokeDashoffset = CIRCUMFERENCE;
        }

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

        // 圆环进度
        this._updateRing(todayStats.rate);

        // 连续打卡
        if (els.streakNum) {
            els.streakNum.textContent = await StreakService.getCurrentStreak();
        }

        // 任务数量
        if (els.dailyDashCount) els.dailyDashCount.textContent = dailyCount;
        if (els.longtermDashCount) els.longtermDashCount.textContent = longtermCount;
        if (els.dailyBadge) els.dailyBadge.textContent = dailyCount;
        if (els.longtermBadge) els.longtermBadge.textContent = longtermCount;

        // 每日一句
        this._setMotto();
    },

    _updateRing(percent) {
        if (!els.ringFill) return;
        const offset = CIRCUMFERENCE - (percent / 100) * CIRCUMFERENCE;
        els.ringFill.style.strokeDashoffset = offset;
        if (els.ringPercent) els.ringPercent.textContent = `${percent}%`;

        // 根据完成率改变颜色
        if (percent >= 80) {
            els.ringFill.style.stroke = '#10b981';
        } else if (percent >= 50) {
            els.ringFill.style.stroke = '#f59e0b';
        } else {
            els.ringFill.style.stroke = '#6366f1';
        }
    },

    _setMotto() {
        if (els.motto) {
            const index = getDayOfYear() % MOTTOS.length;
            els.motto.textContent = MOTTOS[index];
        }
    },
};
