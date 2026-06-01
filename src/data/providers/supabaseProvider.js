/**
 * Supabase 存储引擎（模板）
 * 实现 StorageProvider 接口：
 *   async get(key)    → { success, data, error }
 *   async set(key, value) → { success, error }
 *   async remove(key) → { success, error }
 *
 * 使用方法：
 *   import { SupabaseProvider } from './providers/supabaseProvider.js';
 *   SupabaseProvider.init('https://xxx.supabase.co', 'your-anon-key');
 *   Storage.use(SupabaseProvider);
 */

// ---- 配置 ----
// const TABLE = 'study_tracker_data';
// let supabase;

// export const SupabaseProvider = {
//   init(url, key) {
//     supabase = window.supabase.createClient(url, key);
//   },
//
//   async get(key) {
//     try {
//       const { data, error } = await supabase
//         .from(TABLE)
//         .select('value')
//         .eq('key', key)
//         .single();
//
//       if (error) return { success: false, data: null, error: error.message };
//       return { success: true, data: data?.value ?? null };
//     } catch (e) {
//       return { success: false, data: null, error: e.message };
//     }
//   },
//
//   async set(key, value) {
//     try {
//       const { error } = await supabase
//         .from(TABLE)
//         .upsert({ key, value, updated_at: new Date().toISOString() });
//
//       if (error) return { success: false, error: error.message };
//       return { success: true };
//     } catch (e) {
//       return { success: false, error: e.message };
//     }
//   },
//
//   async remove(key) {
//     try {
//       const { error } = await supabase.from(TABLE).delete().eq('key', key);
//       if (error) return { success: false, error: error.message };
//       return { success: true };
//     } catch (e) {
//       return { success: false, error: e.message };
//     }
//   }
// };
