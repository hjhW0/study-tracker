/**
 * 统计页面 UI
 * 负责渲染7天柱状图、月度统计、历史记录列表
 */

import { StatsService } from '../services/statsService.js';

export const StatsPage = {
  render() {
    this._renderWeekChart();
    this._renderMonthStats();
    this._renderHistoryList();
  },

  _renderWeekChart() {
    const container = document.getElementById('weekChart');
    if (!container) return;

    const last7 = StatsService.getRecentDays(7);
    container.innerHTML = '';

    if (last7.length === 0) {
      container.innerHTML = '<div class="no-data" style="width:100%">暂无数据，完成每日任务后自动记录</div>';
      return;
    }

    last7.forEach(day => {
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

  _renderMonthStats() {
    const container = document.getElementById('monthStats');
    if (!container) return;

    const stats = StatsService.getMonthlyStats();
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
      { label: '最低完成率', value: `${stats.minRate}%` }
    ];

    rows.forEach(row => {
      const div = document.createElement('div');
      div.className = 'stat-row';
      div.innerHTML = `<span class="stat-label">${row.label}</span><span class="stat-value">${row.value}</span>`;
      container.appendChild(div);
    });
  },

  _renderHistoryList() {
    const container = document.getElementById('historyList');
    if (!container) return;

    const history = StatsService.getHistoryReversed();
    container.innerHTML = '';

    if (history.length === 0) {
      container.innerHTML = '<div class="no-data">暂无记录</div>';
      return;
    }

    history.forEach(day => {
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
  }
};
