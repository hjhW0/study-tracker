/**
 * Firebase 存储引擎（模板）
 * 实现 StorageProvider 接口：
 *   async get(key)    → { success, data, error }
 *   async set(key, value) → { success, error }
 *   async remove(key) → { success, error }
 *
 * 使用方法：
 *   import { FirebaseProvider } from './providers/firebaseProvider.js';
 *   Storage.use(FirebaseProvider);
 */

// import { initializeApp } from 'firebase/app';
// import { getFirestore, doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';

// const firebaseConfig = { /* 你的 Firebase 配置 */ };
// const app = initializeApp(firebaseConfig);
// const db = getFirestore(app);
// const COLLECTION = 'study_tracker';

// export const FirebaseProvider = {
//   async get(key) {
//     try {
//       const snap = await getDoc(doc(db, COLLECTION, key));
//       if (!snap.exists()) return { success: true, data: null };
//       return { success: true, data: snap.data().value };
//     } catch (e) {
//       return { success: false, data: null, error: e.message };
//     }
//   },
//
//   async set(key, value) {
//     try {
//       await setDoc(doc(db, COLLECTION, key), {
//         value,
//         updated_at: new Date().toISOString()
//       });
//       return { success: true };
//     } catch (e) {
//       return { success: false, error: e.message };
//     }
//   },
//
//   async remove(key) {
//     try {
//       await deleteDoc(doc(db, COLLECTION, key));
//       return { success: true };
//     } catch (e) {
//       return { success: false, error: e.message };
//     }
//   }
// };
