/**
 * 任务服务
 * 核心模块，负责所有任务的业务逻辑
 *
 * 缓存策略：
 * - 首次 getAll() 从 Storage 加载，之后返回内存缓存
 * - 写操作先更新缓存（同步），再异步持久化到 Storage
 * - 未来接云端时，避免每次 render 都发起网络请求
 */

import { Storage } from '../data/storage.js';
import { createTask } from '../data/models.js';
import { PRIORITY } from '../data/constants.js';
import { getToday } from '../utils/date.js';
import { EventBus, Events } from '../utils/eventBus.js';

const PRIORITY_ORDER = {
    [PRIORITY.HIGH]: 3,
    [PRIORITY.MEDIUM]: 2,
    [PRIORITY.LOW]: 1,
};

// ---- 内存缓存 ----
let _cache = null;

export const TaskService = {
    /**
     * 强制下次读取从 Storage 重新加载
     */
    invalidateCache() {
        _cache = null;
    },

    // ============ 查询（读缓存） ============

    async getAll() {
        if (_cache === null) {
            _cache = await Storage.loadTasks();
        }
        return _cache;
    },

    async getByType(type) {
        const tasks = await this.getAll();
        return tasks.filter((t) => t.type === type);
    },

    async getDailyTasks() {
        return this._sort(await this.getByType('daily'));
    },

    async getLongtermTasks() {
        return this._sort(await this.getByType('longterm'));
    },

    async getById(id) {
        const tasks = await this.getAll();
        return tasks.find((t) => t.id === id) || null;
    },

    /**
     * 获取某天的任务（仅当天可操作，历史日期返回只读数据）
     */
    async getTasksByDate(date) {
        const today = getToday();
        if (date === today) {
            const tasks = await this.getByType('daily');
            return { date, tasks, editable: true };
        }
        // 历史日期：从 history 拿统计，无具体任务列表
        const { StatsService } = await import('./statsService.js');
        const history = await StatsService.getHistory();
        const record = history.find((h) => h.date === date);
        return {
            date,
            tasks: [],
            editable: false,
            record: record || null,
        };
    },

    // ============ 搜索 & 筛选 ============

    async search(keyword, type) {
        const tasks = type ? await this.getByType(type) : await this.getAll();
        if (!keyword) return this._sort(tasks);
        const lower = keyword.toLowerCase();
        return this._sort(
            tasks.filter(
                (t) =>
                    t.content.toLowerCase().includes(lower) ||
                    t.tags.some((tag) => tag.toLowerCase().includes(lower)),
            ),
        );
    },

    async getByTag(tag) {
        const tasks = await this.getAll();
        return tasks.filter((t) => t.tags.some((tg) => tg.toLowerCase() === tag.toLowerCase()));
    },

    async getTagStats() {
        const tasks = await this.getByType('longterm');
        const tagMap = {};

        tasks.forEach((t) => {
            t.tags.forEach((tag) => {
                if (!tagMap[tag]) tagMap[tag] = { total: 0, completed: 0 };
                tagMap[tag].total++;
                if (t.completed) tagMap[tag].completed++;
            });
        });

        return Object.entries(tagMap).map(([name, stats]) => ({
            name,
            total: stats.total,
            completed: stats.completed,
            rate: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0,
        }));
    },

    // ============ 写操作（更新缓存 + 异步持久化） ============

    async add(content, options = {}) {
        const tasks = await this.getAll();
        const today = getToday();

        const task = createTask({
            content,
            type: options.type || 'daily',
            priority: options.priority || PRIORITY.MEDIUM,
            deadline: options.deadline || null,
            lastReset: options.type === 'daily' ? today : null,
            tags: options.tags || [],
        });

        tasks.push(task);
        this._persist(tasks);

        EventBus.emit(Events.TASK_UPDATED, { date: today });

        return task;
    },

    async toggle(id) {
        const tasks = await this.getAll();
        const task = tasks.find((t) => t.id === id);
        if (!task) return null;

        task.completed = !task.completed;
        task.completedAt = task.completed ? new Date().toISOString() : null;

        this._persist(tasks);

        EventBus.emit(Events.TASK_UPDATED, { date: getToday() });

        return task;
    },

    async delete(id) {
        const tasks = await this.getAll();
        _cache = tasks.filter((t) => t.id !== id);
        this._persist(_cache);

        EventBus.emit(Events.TASK_UPDATED, { date: getToday() });
    },

    async update(id, changes) {
        const tasks = await this.getAll();
        const task = tasks.find((t) => t.id === id);
        if (!task) return null;

        Object.assign(task, changes);
        this._persist(tasks);

        EventBus.emit(Events.TASK_UPDATED, { date: getToday() });
        return task;
    },

    // ============ 批量操作 ============

    async dailyReset() {
        const tasks = await this.getAll();
        const today = getToday();
        let resetCount = 0;

        tasks.forEach((task) => {
            if (task.type === 'daily' && task.lastReset !== today) {
                task.completed = false;
                task.completedAt = null;
                task.lastReset = today;
                resetCount++;
            }
        });

        if (resetCount > 0) {
            this._persist(tasks);
        }

        return resetCount;
    },

    async moveOverdueTasks() {
        const tasks = await this.getAll();
        const today = getToday();
        let overdueCount = 0;

        tasks.forEach((task) => {
            if (task.type === 'longterm' && task.deadline && !task.completed) {
                if (task.deadline < today) {
                    task.metadata = { ...task.metadata, overdue: true };
                    overdueCount++;
                }
            }
        });

        if (overdueCount > 0) {
            this._persist(tasks);
        }

        return overdueCount;
    },

    // ============ 内部方法 ============

    /**
     * 异步持久化（不阻塞调用方）
     * 缓存已经更新，UI 立即可用；Storage 写入在后台完成
     */
    _persist(tasks) {
        Storage.saveTasks(tasks).catch((err) => {
            console.error('任务持久化失败:', err);
        });
    },

    _sort(tasks) {
        return [...tasks].sort((a, b) => {
            if (a.completed !== b.completed) return a.completed ? 1 : -1;
            return (PRIORITY_ORDER[b.priority] || 0) - (PRIORITY_ORDER[a.priority] || 0);
        });
    },
};
