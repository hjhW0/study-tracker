/**
 * 通用工具函数
 */

export function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

export function roundTo(value, decimals = 0) {
    const factor = Math.pow(10, decimals);
    return Math.round(value * factor) / factor;
}
