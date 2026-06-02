/**
 * 统计页面 UI
 * 负责热力图、7天柱状图、月度统计、本周表现等
 */

import { StatsService } from '../services/statsService.js';
import { StreakService } from '../services/streakService.js';
import { EventBus, Events } from '../utils/eventBus.js';

const DAY_NAMES = ['日', '一', '二', '三', '四', '五', '六'];
const MONTH_NAMES = [
    '1月',
    '2月',
    '3月',
    '4月',
    '5月',
    '6月',
    '7月',
    '8月',
    '9月',
    '10月',
    '11月',
    '12月',
];

export const StatsPage = {
    init() {
        // 监听任务变化，自动刷新统计
        EventBus.on(Events.TASK_UPDATED, () => {
            StatsPage.render();
        });
    },

    async render() {
        await Promise.all([
            this._renderWeekSummary(),
            this._renderWeekChart(),
            this._renderHeatmap(),
            this._renderMonthStats(),
            this._renderHistory(),
        ]);
    },

    // ---- 本周表现 ----
    async _renderWeekSummary() {
        const el = document.getElementById('weekSummary');
        if (!el) return;

        const history = await StatsService.getHistory();
        const streak = await StreakService.getCurrentStreak();

        // 最近7天
        const last7 = history.slice(-7);
        const totalCompleted = last7.reduce((sum, d) => sum + (d.completed || 0), 0);
        const avgRate =
            last7.length > 0
                ? Math.round(last7.reduce((sum, d) => sum + d.rate, 0) / last7.length)
                : 0;

        el.innerHTML = `
            <div class="week-summary-item">
                <span class="ws-value">${totalCompleted}</span>
                <span class="ws-label">完成任务</span>
            </div>
            <div class="week-summary-item">
                <span class="ws-value">${avgRate}%</span>
                <span class="ws-label">平均完成率</span>
            </div>
            <div class="week-summary-item">
                <span class="ws-value">${streak}</span>
                <span class="ws-label">连续学习</span>
            </div>
        `;
    },

    // ---- 7天柱状图 ----
    async _renderWeekChart() {
        const el = document.getElementById('weekChart');
        if (!el) return;

        const history = await StatsService.getHistory();
        const last7 = history.slice(-7);

        if (last7.length === 0) {
            el.innerHTML = '<p class="no-data">🌱 开始学习后这里会显示数据</p>';
            return;
        }

        el.innerHTML = last7
            .map((day) => {
                const height = Math.max(3, (day.rate / 100) * 130);
                let rateClass = 'rate-none';
                if (day.rate >= 80) rateClass = 'rate-high';
                else if (day.rate >= 50) rateClass = 'rate-mid';
                else if (day.rate > 0) rateClass = 'rate-low';

                const dateObj = new Date(day.date + 'T00:00:00');
                const label = DAY_NAMES[dateObj.getDay()];

                return `
                <div class="chart-bar-wrapper">
                    <span class="chart-value">${day.rate}%</span>
                    <div class="chart-bar ${rateClass}" style="height: ${height}px"></div>
                    <span class="chart-label">${label}</span>
                </div>`;
            })
            .join('');
    },

    // ---- 热力图 ----
    async _renderHeatmap() {
        const el = document.getElementById('heatmap');
        if (!el) return;

        const weeks = await StatsService.getHeatmapData();

        // 空状态
        const hasData = weeks.some((w) => w.days.some((d) => !d.isFuture && d.level > 0));
        if (!hasData) {
            el.innerHTML = `
                <div class="heatmap-empty">
                    <span class="heatmap-empty-icon">🌱</span>
                    <div class="heatmap-empty-title">开始你的学习旅程</div>
                    <div class="heatmap-empty-sub">完成今天的第一个任务，这里会留下成长记录</div>
                </div>`;
            return;
        }

        // 月份标签
        let monthsHtml = '<div class="heatmap-months">';
        let lastMonth = -1;
        weeks.forEach((week) => {
            const firstDay = week.days.find((d) => d.date);
            if (firstDay) {
                const m = new Date(firstDay.date + 'T00:00:00').getMonth();
                if (m !== lastMonth) {
                    monthsHtml += `<span>${MONTH_NAMES[m]}</span>`;
                    lastMonth = m;
                } else {
                    monthsHtml += '<span></span>';
                }
            }
        });
        monthsHtml += '</div>';

        // 星期标签
        const dayLabels =
            '<div class="heatmap-labels"><span></span><span>一</span><span></span><span>三</span><span></span><span>五</span><span></span></div>';

        // 网格
        let gridHtml = '';
        weeks.forEach((week) => {
            gridHtml += '<div class="heatmap-week">';
            week.days.forEach((day) => {
                if (day.isFuture) {
                    gridHtml += '<div class="heatmap-cell" style="visibility:hidden"></div>';
                } else {
                    const levelClass = day.level > 0 ? ` level-${day.level}` : '';
                    const tooltip = `${day.date} · ${day.rate}%`;
                    gridHtml += `<div class="heatmap-cell${levelClass}" data-tooltip="${tooltip}" data-date="${day.date}"></div>`;
                }
            });
            gridHtml += '</div>';
        });

        // 图例
        const legend = `
            <div class="heatmap-legend">
                <span>少</span>
                <div class="heatmap-cell"></div>
                <div class="heatmap-cell level-1"></div>
                <div class="heatmap-cell level-2"></div>
                <div class="heatmap-cell level-3"></div>
                <div class="heatmap-cell level-4"></div>
                <span>多</span>
            </div>`;

        el.innerHTML = `${monthsHtml}<div class="heatmap">${dayLabels}${gridHtml}</div>${legend}`;

        // 点击事件
        el.querySelectorAll('.heatmap-cell[data-date]').forEach((cell) => {
            cell.addEventListener('click', () => {
                EventBus.emit(Events.DATE_SELECTED, { date: cell.dataset.date });
            });
        });
    },

    // ---- 月度统计 ----
    async _renderMonthStats() {
        const el = document.getElementById('monthStats');
        if (!el) return;

        const history = await StatsService.getHistory();
        const now = new Date();
        const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const monthDays = history.filter((h) => h.date.startsWith(ym));

        if (monthDays.length === 0) {
            el.innerHTML = '<p class="no-data">本月暂无记录</p>';
            return;
        }

        const avgRate = Math.round(monthDays.reduce((s, d) => s + d.rate, 0) / monthDays.length);
        const bestDay = monthDays.reduce(
            (best, d) => (d.rate > best.rate ? d : best),
            monthDays[0],
        );
        const totalTasks = monthDays.reduce((s, d) => s + (d.completed || 0), 0);

        el.innerHTML = `
            <div class="stat-row"><span class="stat-label">记录天数</span><span class="stat-value">${monthDays.length} 天</span></div>
            <div class="stat-row"><span class="stat-label">平均完成率</span><span class="stat-value">${avgRate}%</span></div>
            <div class="stat-row"><span class="stat-label">最佳单日</span><span class="stat-value">${bestDay.date} (${bestDay.rate}%)</span></div>
            <div class="stat-row"><span class="stat-label">完成任务数</span><span class="stat-value">${totalTasks} 项</span></div>
        `;
    },

    // ---- 每日完成率记录 ----
    async _renderHistory() {
        const el = document.getElementById('historyList');
        if (!el) return;

        const history = await StatsService.getHistory();
        const last14 = history.slice(-14).reverse();

        if (last14.length === 0) {
            el.innerHTML = '<p class="no-data">暂无记录</p>';
            return;
        }

        el.innerHTML = last14
            .map((day) => {
                let barClass = 'rate-low';
                if (day.rate >= 80) barClass = 'rate-high';
                else if (day.rate >= 50) barClass = 'rate-mid';

                return `
                <div class="history-row">
                    <span class="history-date">${day.date}</span>
                    <div class="history-bar-wrapper">
                        <div class="history-bar ${barClass}" style="width: ${day.rate}%"></div>
                    </div>
                    <span class="history-rate">${day.rate}%</span>
                </div>`;
            })
            .join('');
    },
};
