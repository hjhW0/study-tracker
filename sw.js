const CACHE_NAME = 'study-tracker-v2';
const ASSETS = [
    './',
    './index.html',
    './.nojekyll',
    './manifest.json',
    './css/base.css',
    './css/dashboard.css',
    './css/task.css',
    './css/stats.css',
    './css/animation.css',
    './src/app.js',
    './src/data/constants.js',
    './src/data/models.js',
    './src/data/settings.js',
    './src/data/storage.js',
    './src/data/providers/localStorageProvider.js',
    './src/services/taskService.js',
    './src/services/statsService.js',
    './src/services/streakService.js',
    './src/ui/dashboard.js',
    './src/ui/taskList.js',
    './src/ui/statsPage.js',
    './src/utils/date.js',
    './src/utils/eventBus.js',
    './src/utils/helpers.js',
];

// 安装：缓存所有资源
self.addEventListener('install', (e) => {
    e.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
    self.skipWaiting();
});

// 激活：清理旧缓存
self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches
            .keys()
            .then((keys) =>
                Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))),
            ),
    );
    self.clients.claim();
});

// 请求：缓存优先，失败再走网络
self.addEventListener('fetch', (e) => {
    e.respondWith(caches.match(e.request).then((cached) => cached || fetch(e.request)));
});
