/**
 * 常量定义
 * 集中管理所有魔法值，后期改一个地方全局生效
 */

export const PRIORITY = {
    HIGH: 'high',
    MEDIUM: 'medium',
    LOW: 'low',
};

export const TASK_TYPE = {
    DAILY: 'daily',
    LONGTERM: 'longterm',
};

export const SUCCESS_RATE = 80; // 完成率 >= 此值算打卡成功

export const HISTORY_KEEP_DAYS = 90; // 历史记录保留天数
