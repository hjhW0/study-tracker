/**
 * 热力图点击弹出层 - 显示某天的任务列表
 * 支持当天任务勾选，历史日期只读展示
 */

import { TaskService } from '../../services/taskService.js';
import { EventBus, Events } from '../../utils/eventBus.js';
import { PRIORITY } from '../../data/constants.js';

const PRIORITY_COLORS = {
    [PRIORITY.HIGH]: '#ef4444',
    [PRIORITY.MEDIUM]: '#f59e0b',
    [PRIORITY.LOW]: '#10b981',
};

const PRIORITY_LABELS = {
    [PRIORITY.HIGH]: '高',
    [PRIORITY.MEDIUM]: '中',
    [PRIORITY.LOW]: '低',
};

let _overlay = null;
let _currentDate = null;

export const DayTasksModal = {
    async open(date) {
        _currentDate = date;
        const data = await TaskService.getTasksByDate(date);
        this._render(data);
    },

    close() {
        if (_overlay) {
            _overlay.classList.add('closing');
            setTimeout(() => {
                _overlay.remove();
                _overlay = null;
                _currentDate = null;
                EventBus.emit(Events.MODAL_CLOSED);
            }, 200);
        }
    },

    _render(data) {
        // 移除旧弹窗
        if (_overlay) _overlay.remove();

        // 遮罩层
        _overlay = document.createElement('div');
        _overlay.className = 'modal-overlay';
        _overlay.addEventListener('click', (e) => {
            if (e.target === _overlay) this.close();
        });

        // 面板
        const panel = document.createElement('div');
        panel.className = 'modal-panel';

        // 头部
        const header = document.createElement('div');
        header.className = 'modal-header';
        header.innerHTML = `
            <span class="modal-title">📅 ${data.date}</span>
            <button class="modal-close" id="modalCloseBtn">✕</button>
        `;

        // 内容
        const body = document.createElement('div');
        body.className = 'modal-body';

        if (data.editable && data.tasks.length > 0) {
            body.appendChild(this._renderTaskList(data.tasks));
        } else if (data.editable) {
            body.innerHTML = '<div class="modal-empty">今天还没有任务</div>';
        } else if (data.record) {
            body.appendChild(this._renderHistoryStats(data.record));
        } else {
            body.innerHTML = '<div class="modal-empty">这一天没有记录</div>';
        }

        // 底部
        const footer = document.createElement('div');
        footer.className = 'modal-footer';

        if (data.editable && data.tasks.length > 0) {
            const markAllBtn = document.createElement('button');
            markAllBtn.className = 'modal-btn modal-btn-primary';
            markAllBtn.textContent = '标记全部完成';
            markAllBtn.addEventListener('click', () => this._markAllComplete(data.tasks));
            footer.appendChild(markAllBtn);
        }

        const closeBtn = document.createElement('button');
        closeBtn.className = 'modal-btn';
        closeBtn.textContent = '关闭';
        closeBtn.addEventListener('click', () => this.close());
        footer.appendChild(closeBtn);

        panel.appendChild(header);
        panel.appendChild(body);
        panel.appendChild(footer);
        _overlay.appendChild(panel);
        document.body.appendChild(_overlay);

        // 绑定关闭按钮
        document.getElementById('modalCloseBtn').addEventListener('click', () => this.close());
    },

    _renderTaskList(tasks) {
        const list = document.createElement('div');
        list.className = 'modal-task-list';

        tasks.forEach((task) => {
            const item = document.createElement('div');
            item.className = 'modal-task-item';
            if (task.completed) item.classList.add('completed');

            const checkbox = document.createElement('div');
            checkbox.className = 'modal-checkbox';
            checkbox.innerHTML = task.completed
                ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M5 13l4 4L19 7"/></svg>'
                : '';
            checkbox.addEventListener('click', () => this._toggleTask(task.id, item));

            const content = document.createElement('div');
            content.className = 'modal-task-content';

            const text = document.createElement('span');
            text.className = 'modal-task-text';
            text.textContent = task.content;

            const priorityDot = document.createElement('span');
            priorityDot.className = 'modal-priority-dot';
            priorityDot.style.background =
                PRIORITY_COLORS[task.priority] || PRIORITY_COLORS[PRIORITY.MEDIUM];
            priorityDot.title = `${PRIORITY_LABELS[task.priority] || '中'}优先级`;

            content.appendChild(priorityDot);
            content.appendChild(text);

            if (task.tags && task.tags.length > 0) {
                const tags = document.createElement('div');
                tags.className = 'modal-task-tags';
                task.tags.forEach((tag) => {
                    const tagEl = document.createElement('span');
                    tagEl.className = 'modal-tag';
                    tagEl.textContent = `#${tag}`;
                    tags.appendChild(tagEl);
                });
                content.appendChild(tags);
            }

            item.appendChild(checkbox);
            item.appendChild(content);
            list.appendChild(item);
        });

        return list;
    },

    _renderHistoryStats(record) {
        const stats = document.createElement('div');
        stats.className = 'modal-history-stats';

        const rows = [
            {
                label: '完成率',
                value: `${record.rate}%`,
                color:
                    record.rate >= 80
                        ? 'var(--success)'
                        : record.rate >= 50
                          ? 'var(--warning)'
                          : 'var(--danger)',
            },
            { label: '完成数', value: `${record.completed} 个` },
            { label: '总任务', value: `${record.total} 个` },
        ];

        rows.forEach((row) => {
            const div = document.createElement('div');
            div.className = 'modal-stat-row';
            div.innerHTML = `
                <span class="modal-stat-label">${row.label}</span>
                <span class="modal-stat-value" ${row.color ? `style="color:${row.color}"` : ''}>${row.value}</span>
            `;
            stats.appendChild(div);
        });

        const hint = document.createElement('div');
        hint.className = 'modal-hint';
        hint.textContent = '历史日期仅显示统计数据';
        stats.appendChild(hint);

        return stats;
    },

    async _toggleTask(taskId, itemEl) {
        const task = await TaskService.toggle(taskId);
        if (!task) return;

        // 本地 DOM 更新（即时反馈）
        itemEl.classList.toggle('completed');
        const checkbox = itemEl.querySelector('.modal-checkbox');
        checkbox.innerHTML = task.completed
            ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M5 13l4 4L19 7"/></svg>'
            : '';

        if (task.completed) {
            checkbox.classList.add('check-animate');
            setTimeout(() => checkbox.classList.remove('check-animate'), 400);
        }

        // TaskService.toggle() 已自动触发 TASK_UPDATED 事件
        // Dashboard / StatsPage / StatsService 会自动响应
    },

    async _markAllComplete(tasks) {
        for (const task of tasks) {
            if (!task.completed) {
                await TaskService.toggle(task.id);
            }
        }
        // 刷新弹窗内容
        this.open(_currentDate);
    },
};
