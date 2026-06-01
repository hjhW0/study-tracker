/**
 * 存储层（接口 + Provider 模式）
 *
 * 职责：
 * 1. 委托 provider 读写数据
 * 2. 统一处理错误（调用方不需要 try/catch）
 * 3. 业务逻辑（裁剪历史记录等）
 *
 * 返回格式：
 *   load* → 数据（失败时返回 fallback）
 *   save* → { success, error? }
 *
 * 切换后端只需：
 *   Storage.use(YourProvider);
 */

import { HISTORY_KEEP_DAYS } from './constants.js';
import { LocalStorageProvider } from './providers/localStorageProvider.js';

const TASKS_KEY = 'study-tracker-tasks';
const HISTORY_KEY = 'study-tracker-history';
const GOALS_KEY = 'study-tracker-goals';

let _provider = LocalStorageProvider;

export const Storage = {
    use(provider) {
        _provider = provider;
    },

    // ---- 任务 ----
    async loadTasks() {
        const result = await _provider.get(TASKS_KEY);
        if (!result.success) {
            console.error('加载任务失败:', result.error);
            return [];
        }
        return result.data || [];
    },

    async saveTasks(tasks) {
        const result = await _provider.set(TASKS_KEY, tasks);
        if (!result.success) console.error('保存任务失败:', result.error);
        return result;
    },

    // ---- 历史记录 ----
    async loadHistory() {
        const result = await _provider.get(HISTORY_KEY);
        if (!result.success) {
            console.error('加载历史失败:', result.error);
            return [];
        }
        return result.data || [];
    },

    async saveHistory(history) {
        if (history.length > HISTORY_KEEP_DAYS) {
            history = history.slice(history.length - HISTORY_KEEP_DAYS);
        }
        const result = await _provider.set(HISTORY_KEY, history);
        if (!result.success) console.error('保存历史失败:', result.error);
        return result;
    },

    // ---- 目标 ----
    async loadGoals() {
        const result = await _provider.get(GOALS_KEY);
        if (!result.success) {
            console.error('加载目标失败:', result.error);
            return [];
        }
        return result.data || [];
    },

    async saveGoals(goals) {
        const result = await _provider.set(GOALS_KEY, goals);
        if (!result.success) console.error('保存目标失败:', result.error);
        return result;
    },
};
