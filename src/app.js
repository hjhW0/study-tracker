/**
 * 应用入口
 * 保持精简：初始化模块 + 绑定事件，不含业务逻辑
 */

import { EventBus, Events } from './utils/eventBus.js';
import { TaskService } from './services/taskService.js';
import { StatsService } from './services/statsService.js';
import { Dashboard } from './ui/dashboard.js';
import { TaskList } from './ui/taskList.js';
import { StatsPage } from './ui/statsPage.js';

// ---- 当前状态 ----
let currentType = 'daily';

// ---- DOM ----
const taskInput = document.getElementById('taskInput');
const addBtn = document.getElementById('addBtn');
const prioritySelect = document.getElementById('prioritySelect');
const deadlineInput = document.getElementById('deadlineInput');
const searchInput = document.getElementById('searchInput');
const inputArea = document.getElementById('inputArea');

// ---- Tab 切换 ----
function switchTab(type) {
  currentType = type;

  document.querySelectorAll('.tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.type === type);
  });

  document.getElementById('dailySection').classList.toggle('hidden', type !== 'daily');
  document.getElementById('longtermSection').classList.toggle('hidden', type !== 'longterm');
  document.getElementById('statsSection').classList.toggle('hidden', type !== 'stats');

  inputArea.style.display = type === 'stats' ? 'none' : 'block';
  deadlineInput.style.display = type === 'longterm' ? 'block' : 'none';

  if (type === 'stats') StatsPage.render();

  TaskList.setType(type);
  EventBus.emit(Events.TAB_SWITCHED, { type });
}

// ---- 添加任务 ----
function handleAdd() {
  const content = taskInput.value.trim();
  if (!content) return;

  TaskService.add(content, {
    type: currentType,
    priority: prioritySelect.value,
    deadline: currentType === 'longterm' ? deadlineInput.value : null
  });

  taskInput.value = '';
  deadlineInput.value = '';
  taskInput.focus();
}

// ---- 初始化 ----
function init() {
  TaskService.dailyReset();
  StatsService.saveTodayProgress();

  Dashboard.init();
  TaskList.init();

  addBtn.addEventListener('click', handleAdd);
  taskInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleAdd();
  });

  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => switchTab(tab.dataset.type));
  });

  searchInput.addEventListener('input', (e) => {
    TaskList.setSearchKeyword(e.target.value.trim());
  });

  deadlineInput.style.display = 'none';
  Dashboard.render();
  TaskList.render();
}

init();
