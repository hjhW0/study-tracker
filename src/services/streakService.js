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
    async getCurrentStreak() {
        const threshold = Settings.get('successRate') || SUCCESS_RATE;
        const history = await Storage.loadHistory();
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
    async getLongestStreak() {
        const threshold = Settings.get('successRate') || SUCCESS_RATE;
        const history = await Storage.loadHistory();
        let longest = 0;
        let current = 0;

        history.forEach((day) => {
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
    async getTotalSuccessDays() {
        const threshold = Settings.get('successRate') || SUCCESS_RATE;
        const history = await Storage.loadHistory();
        return history.filter((d) => d.rate >= threshold).length;
    },

    /**
     * 获取累计记录天数
     */
    async getTotalRecordDays() {
        const history = await Storage.loadHistory();
        return history.length;
    },

    /**
     * 判断某天是否打卡成功
     */
    async isSuccessDay(date) {
        const threshold = Settings.get('successRate') || SUCCESS_RATE;
        const history = await Storage.loadHistory();
        const record = history.find((h) => h.date === date);
        return record ? record.rate >= threshold : false;
    },
};
