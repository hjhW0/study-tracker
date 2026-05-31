/**
 * 用户设置
 * 未来接设置页面直接读写，不用改任何业务代码
 */

const SETTINGS_KEY = 'study-tracker-settings';

const defaults = {
  successRate: 80,          // 打卡标准（%）
  pomodoroMinutes: 25,      // 番茄钟时长（分钟）
  enableSound: true,        // 提示音
  showQuote: true,          // 显示每日一句
  theme: 'auto'             // 主题：'light' | 'dark' | 'auto'
};

export const Settings = {
  get(key) {
    const saved = this._load();
    return key ? (saved[key] ?? defaults[key]) : { ...defaults, ...saved };
  },

  set(key, value) {
    const saved = this._load();
    saved[key] = value;
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(saved));
  },

  reset() {
    localStorage.removeItem(SETTINGS_KEY);
  },

  _load() {
    try {
      const data = localStorage.getItem(SETTINGS_KEY);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  }
};
