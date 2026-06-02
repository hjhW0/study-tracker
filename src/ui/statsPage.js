/**
 * 统计页面 UI
 * 负责渲染7天柱状图、月度统计、历史记录列表
 */

import { StatsService } from '../services/statsService.js';
import { EventBus, Events } from '../utils/eventBus.js';

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
const DAY_LABELS = ['', '周一', '', '周三', '', '周五', ''];

// 监听任务变化 → 刷新热力图
EventBus.on(Events.TASK_UPDATED, () => {
    StatsPage._renderHeatmap();
});

export const StatsPage = {
    async render() {
        await this._renderHeatmap();
        await this._renderWeekChart();
        await this._renderMonthStats();
        await this._renderHistoryList();
    },

    async _renderWeekChart() {
        const container = document.getElementById('weekChart');
        if (!container) return;

        const last7 = await StatsService.getRecentDays(7);
        container.innerHTML = '';

        if (last7.length === 0) {
            container.innerHTML =
                '<div class="no-data" style="width:100%">暂无数据，完成每日任务后自动记录</div>';
            return;
        }

        last7.forEach((day) => {
            const wrapper = document.createElement('div');
            wrapper.className = 'chart-bar-wrapper';

            const value = document.createElement('span');
            value.className = 'chart-value';
            value.textContent = `${day.rate}%`;

            const bar = document.createElement('div');
            bar.className = 'chart-bar';
            bar.style.height = `${Math.max(day.rate, 3)}%`;

            if (day.rate >= 80) bar.classList.add('rate-high');
            else if (day.rate >= 50) bar.classList.add('rate-mid');
            else if (day.rate > 0) bar.classList.add('rate-low');
            else bar.classList.add('rate-none');

            const label = document.createElement('span');
            label.className = 'chart-label';
            label.textContent = day.date.slice(5);

            wrapper.appendChild(value);
            wrapper.appendChild(bar);
            wrapper.appendChild(label);
            container.appendChild(wrapper);
        });
    },

    async _renderHeatmap() {
        const container = document.getElementById('heatmap');
        if (!container) return;

        const weeks = await StatsService.getHeatmapData();
        container.innerHTML = '';

        if (weeks.length === 0) {
            container.innerHTML = '<div class="no-data">暂无数据，完成每日任务后自动记录</div>';
            return;
        }

        // 月份标签行
        const monthsRow = document.createElement('div');
        monthsRow.className = 'heatmap-months';
        let lastMonth = -1;
        weeks.forEach((week) => {
            const firstDay = week[0];
            const m = new Date(firstDay.date).getMonth();
            if (m !== lastMonth) {
                const span = document.createElement('span');
                span.textContent = MONTH_NAMES[m];
                span.style.width = 'auto';
                monthsRow.appendChild(span);
                lastMonth = m;
            } else {
                const span = document.createElement('span');
                span.textContent = '';
                monthsRow.appendChild(span);
            }
        });

        // 热力图主体
        const heatmapWrapper = document.createElement('div');
        heatmapWrapper.className = 'heatmap';

        // 星期标签
        const labels = document.createElement('div');
        labels.className = 'heatmap-labels';
        DAY_LABELS.forEach((label) => {
            const span = document.createElement('span');
            span.textContent = label;
            labels.appendChild(span);
        });
        heatmapWrapper.appendChild(labels);

        // 每周列
        weeks.forEach((week) => {
            const col = document.createElement('div');
            col.className = 'heatmap-week';
            week.forEach((day) => {
                const cell = document.createElement('div');
                cell.className = 'heatmap-cell';
                cell.dataset.date = day.date;
                if (day.isFuture) {
                    cell.style.opacity = '0.3';
                } else if (day.level > 0) {
                    cell.classList.add(`level-${day.level}`);
                }
                cell.setAttribute('data-tooltip', `${day.date}: ${day.rate}%`);
                // 点击打开当天任务弹窗
                if (!day.isFuture) {
                    cell.addEventListener('click', () => {
                        EventBus.emit(Events.DATE_SELECTED, { date: day.date });
                    });
                }
                col.appendChild(cell);
            });
            heatmapWrapper.appendChild(col);
        });

        // 图例
        const legend = document.createElement('div');
        legend.className = 'heatmap-legend';
        legend.innerHTML = '<span>少</span>';
        for (let i = 0; i <= 4; i++) {
            const cell = document.createElement('div');
            cell.className = 'heatmap-cell';
            if (i > 0) cell.classList.add(`level-${i}`);
            legend.appendChild(cell);
        }
        legend.innerHTML += '<span>多</span>';

        container.appendChild(monthsRow);
        container.appendChild(heatmapWrapper);
        container.appendChild(legend);
    },

    async _renderMonthStats() {
        const container = document.getElementById('monthStats');
        if (!container) return;

        const stats = await StatsService.getMonthlyStats();
        container.innerHTML = '';

        if (stats.totalDays === 0) {
            container.innerHTML = '<div class="no-data">本月暂无数据</div>';
            return;
        }

        const rows = [
            { label: '记录天数', value: `${stats.totalDays} 天` },
            { label: '达标天数 (≥80%)', value: `${stats.goodDays} 天` },
            { label: '平均完成率', value: `${stats.avgRate}%` },
            { label: '最高完成率', value: `${stats.maxRate}%` },
            { label: '最低完成率', value: `${stats.minRate}%` },
        ];

        rows.forEach((row) => {
            const div = document.createElement('div');
            div.className = 'stat-row';
            div.innerHTML = `<span class="stat-label">${row.label}</span><span class="stat-value">${row.value}</span>`;
            container.appendChild(div);
        });
    },

    async _renderHistoryList() {
        const container = document.getElementById('historyList');
        if (!container) return;

        const history = await StatsService.getHistoryReversed();
        container.innerHTML = '';

        if (history.length === 0) {
            container.innerHTML = '<div class="no-data">暂无记录</div>';
            return;
        }

        history.forEach((day) => {
            const row = document.createElement('div');
            row.className = 'history-row';

            const dateEl = document.createElement('span');
            dateEl.className = 'history-date';
            dateEl.textContent = day.date;

            const barWrapper = document.createElement('div');
            barWrapper.className = 'history-bar-wrapper';

            const bar = document.createElement('div');
            bar.className = 'history-bar';
            bar.style.width = `${Math.max(day.rate, 2)}%`;

            if (day.rate >= 80) bar.classList.add('rate-high');
            else if (day.rate >= 50) bar.classList.add('rate-mid');
            else bar.classList.add('rate-low');

            barWrapper.appendChild(bar);

            const rateEl = document.createElement('span');
            rateEl.className = 'history-rate';
            rateEl.textContent = `${day.rate}%`;

            row.appendChild(dateEl);
            row.appendChild(barWrapper);
            row.appendChild(rateEl);
            container.appendChild(row);
        });
    },
};
