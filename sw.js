const CACHE = 'potato-diary-20260920174910';
const ASSETS = [
  './index.html',
  './manifest.json'
];

// 安裝時快取核心檔案，外部資源失敗不阻擋
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS))
  );
  // 強制新 SW 立即接管，不等舊的閒置
  self.skipWaiting();
});

// 啟動時刪除所有舊版快取
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => {
        console.log('[SW] 刪除舊快取:', k);
        return caches.delete(k);
      }))
    )
  );
  // 立即接管所有已開啟的分頁
  self.clients.claim();
});

// 網路優先策略：每次都先嘗試網路取得最新版
// 失敗時才回退到快取（離線模式）
self.addEventListener('fetch', e => {
  // 只處理 GET，其他略過
  if(e.request.method !== 'GET') return;

  e.respondWith(
    fetch(e.request)
      .then(res => {
        // 成功從網路取得，更新快取
        if(res && res.status === 200){
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      })
      .catch(() => {
        // 離線時從快取回應
        return caches.match(e.request);
      })
  );
});
