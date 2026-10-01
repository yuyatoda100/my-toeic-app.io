// Service Worker - キャッシング戦略
const CACHE_NAME = 'new-horizon-v1';
const urlsToCache = [
  './',
  './index_1.html',
  './style_1.css',
  './app_1.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// キャッシュのインストール
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache).catch(err => {
        console.warn('Some assets failed to cache:', err);
        // キャッシュに失敗してもインストールを続行
        return Promise.resolve();
      });
    })
  );
  self.skipWaiting(); // 新しいService Workerをすぐに有効化
});

// 古いキャッシュの削除
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim(); // 即座にClient管理を開始
});

// ネットワークリクエストの処理
self.addEventListener('fetch', event => {
  // GETリクエストのみ処理
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(response => {
      if (response) {
        return response; // キャッシュから返却
      }

      return fetch(event.request).then(response => {
        // ネットワークから取得したリソースをキャッシュに保存
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseToCache);
        });

        return response;
      }).catch(() => {
        // オフライン時はキャッシュから取得、なければオフラインページを返却
        return caches.match('./index_1.html');
      });
    })
  );
});
