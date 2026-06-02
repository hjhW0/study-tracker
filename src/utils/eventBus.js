/**
 * 事件总线
 * 所有模块通过事件通信，互不直接依赖
 *
 * 用法：
 *   EventBus.on('task:completed', handler);
 *   EventBus.emit('task:completed', { taskId });
 *   EventBus.off('task:completed', handler);
 */

const listeners = {};

export const EventBus = {
    on(event, fn) {
        if (!listeners[event]) {
            listeners[event] = [];
        }
        listeners[event].push(fn);
    },

    off(event, fn) {
        if (!listeners[event]) return;
        listeners[event] = listeners[event].filter((f) => f !== fn);
    },

    emit(event, data) {
        if (!listeners[event]) return;
        listeners[event].forEach((fn) => fn(data));
    },
};

/**
 * 事件名称常量
 * 集中管理，避免拼写错误
 */
export const Events = {
    // 任务事件（统一入口：任何任务状态变化都发 TASK_UPDATED）
    TASK_UPDATED: 'task:updated', // { date }

    // 页面事件
    TAB_SWITCHED: 'tab:switched',

    // 热力图交互
    DATE_SELECTED: 'date:selected',
    MODAL_CLOSED: 'modal:closed',
};
