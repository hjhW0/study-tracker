/**
 * localStorage 存储引擎
 * 实现 StorageProvider 接口：
 *   async get(key)    → { success, data, error }
 *   async set(key, value) → { success, error }
 *   async remove(key) → { success, error }
 */

export const LocalStorageProvider = {
    async get(key) {
        try {
            const data = localStorage.getItem(key);
            return { success: true, data: data ? JSON.parse(data) : null };
        } catch (e) {
            console.error(`读取 ${key} 失败:`, e);
            return { success: false, data: null, error: e.message };
        }
    },

    async set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return { success: true };
        } catch (e) {
            console.error(`保存 ${key} 失败:`, e);
            return { success: false, error: e.message };
        }
    },

    async remove(key) {
        try {
            localStorage.removeItem(key);
            return { success: true };
        } catch (e) {
            return { success: false, error: e.message };
        }
    },
};
