/**
 * 打卡服务
 * 负责连续打卡、累计打卡等统计
 */

import { Storage } from '../data/storage.js';
import { SUCCESS_RATE } from '../data/constants.js';
import { Settings } from '../data/settings.js';

export const StreakService = {
  /**
   * 获取当前连续打卡天数
   */
  getCurrentStreak() {
    const threshold = Settings.get('successRate') || SUCCESS_RATE;
    const history = Storage.loadHistory();
    let streak = 0;

    for (let i = history.length - 1; i >= 0; i--) {
      if (history[i].rate >= threshold) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  },

  /**
   * 获取最长连续打卡天数
   */
  getLongestStreak() {
    const threshold = Settings.get('successRate') || SUCCESS_RATE;
    const history = Storage.loadHistory();
    let longest = 0;
    let current = 0;

    history.forEach(day => {
      if (day.rate >= threshold) {
        current++;
        longest = Math.max(longest, current);
      } else {
        current = 0;
      }
    });

    return longest;
  },

  /**
   * 获取累计打卡天数（达标天数）
   */
  getTotalSuccessDays() {
    const threshold = Settings.get('successRate') || SUCCESS_RATE;
    return Storage.loadHistory().filter(d => d.rate >= threshold).length;
  },

  /**
   * 获取累计记录天数
   */
  getTotalRecordDays() {
    return Storage.loadHistory().length;
  },

  /**
   * 判断某天是否打卡成功
   */
  isSuccessDay(date) {
    const threshold = Settings.get('successRate') || SUCCESS_RATE;
    const record = Storage.loadHistory().find(h => h.date === date);
    return record ? record.rate >= threshold : false;
  }
};
