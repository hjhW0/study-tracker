/**
 * 日期工具函数
 * 所有日期相关的纯函数放在这里
 */

export function getToday() {
    return new Date().toISOString().split('T')[0];
}

export function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return `${d.getMonth() + 1}月${d.getDate()}日`;
}

export function formatDateShort(dateStr) {
    if (!dateStr) return '';
    return dateStr.slice(5);
}

export function daysBetween(date1, date2) {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return Math.ceil((d2 - d1) / (1000 * 60 * 60 * 24));
}

export function getDaysLeft(deadline) {
    return daysBetween(getToday(), deadline);
}

export function isOverdue(deadline) {
    return getDaysLeft(deadline) < 0;
}

export function isUrgent(deadline, days = 3) {
    const left = getDaysLeft(deadline);
    return left >= 0 && left <= days;
}

export function isWarning(deadline, days = 7) {
    const left = getDaysLeft(deadline);
    return left > 3 && left <= days;
}

export function getMonthStr() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export function getDayOfYear() {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now - start;
    return Math.floor(diff / (1000 * 60 * 60 * 24));
}
