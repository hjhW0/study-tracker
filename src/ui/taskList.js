/**
 * 任务列表 UI
 * 负责渲染每日任务和长期任务的卡片
 */

import { TaskService } from '../services/taskService.js';
import { EventBus, Events } from '../utils/eventBus.js';
import { getDaysLeft } from '../utils/date.js';

let currentType = 'daily';
let searchKeyword = '';

export const TaskList = {
    init() {
        // 监听任务变化
        EventBus.on(Events.TASK_UPDATED, () => this.render());
        EventBus.on(Events.TAB_SWITCHED, ({ type }) => {
            currentType = type;
            this.render();
        });
    },

    setType(type) {
        currentType = type;
    },

    setSearchKeyword(keyword) {
        searchKeyword = keyword.toLowerCase();
        this.render();
    },

    async render() {
        const tasks = await TaskService.search(searchKeyword, currentType);
        const allDaily = await TaskService.getByType('daily');
        const allLongterm = await TaskService.getByType('longterm');

        this._renderList('dailyList', tasks, 'daily', currentType === 'daily');
        this._renderList('longtermList', tasks, 'longterm', currentType === 'longterm');

        // 空状态
        this._toggleEmpty('dailyEmpty', allDaily.length === 0 && currentType === 'daily');
        this._toggleEmpty('longtermEmpty', allLongterm.length === 0 && currentType === 'longterm');
    },

    async _renderList(containerId, tasks, type, isActive) {
        const container = document.getElementById(containerId);
        if (!container) return;

        // 如果不是当前 tab 的类型，只用全量数据来判断空状态
        const filtered = isActive ? tasks : await TaskService.search(searchKeyword, type);
        container.innerHTML = '';

        filtered.forEach((task) => {
            container.appendChild(this._createCard(task, type));
        });
    },

    _createCard(task, type) {
        const card = document.createElement('div');
        card.className = 'task-card';
        if (task.completed) card.classList.add('completed');
        if (type === 'longterm') card.classList.add(`priority-${task.priority}`);

        // 优先级圆点（每日任务）
        if (type === 'daily') {
            const dot = document.createElement('span');
            dot.className = `priority-dot ${task.priority}`;
            card.appendChild(dot);
        }

        // 复选框
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = task.completed;
        checkbox.addEventListener('change', () => TaskService.toggle(task.id));

        // 任务内容
        const body = document.createElement('div');
        body.className = 'task-body';

        const span = document.createElement('span');
        span.className = 'task-content';
        span.textContent = task.content;
        body.appendChild(span);

        // 元信息行
        const meta = document.createElement('div');
        meta.className = 'task-meta';

        // 截止日期（长期任务）
        if (type === 'longterm' && task.deadline) {
            const deadlineEl = document.createElement('span');
            deadlineEl.className = 'deadline';

            const daysLeft = getDaysLeft(task.deadline);

            if (task.completed) {
                deadlineEl.textContent = `截止 ${task.deadline}`;
            } else if (daysLeft < 0) {
                deadlineEl.textContent = `已过期 ${Math.abs(daysLeft)} 天`;
                deadlineEl.classList.add('urgent');
            } else if (daysLeft <= 3) {
                deadlineEl.textContent = `剩余 ${daysLeft} 天`;
                deadlineEl.classList.add('urgent');
            } else if (daysLeft <= 7) {
                deadlineEl.textContent = `剩余 ${daysLeft} 天`;
                deadlineEl.classList.add('warning');
            } else {
                deadlineEl.textContent = `截止 ${task.deadline}`;
            }

            meta.appendChild(deadlineEl);
        }

        // 任务类型标签
        const tag = document.createElement('span');
        tag.className = 'task-type-tag';
        tag.textContent = type === 'daily' ? '每日' : '长期';
        meta.appendChild(tag);

        // 标签（目标系统）
        if (task.tags && task.tags.length > 0) {
            task.tags.forEach((tagName) => {
                const tagEl = document.createElement('span');
                tagEl.className = 'task-tag';
                tagEl.textContent = `#${tagName}`;
                meta.appendChild(tagEl);
            });
        }

        if (meta.childNodes.length > 0) {
            body.appendChild(meta);
        }

        // 删除按钮
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.textContent = '✕';
        deleteBtn.addEventListener('click', () => TaskService.delete(task.id));

        card.appendChild(checkbox);
        card.appendChild(body);
        card.appendChild(deleteBtn);

        return card;
    },

    _toggleEmpty(elementId, show) {
        const el = document.getElementById(elementId);
        if (el) el.classList.toggle('show', show);
    },
};
