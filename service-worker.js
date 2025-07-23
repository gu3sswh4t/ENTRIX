// service-worker.js
const CACHE_NAME = 'school-qr-pwa-cache-v1';
const urlsToCache = [
    '/',
    '/index.html',
    'https://cdn.tailwindcss.com',
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
    'https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js',
    'https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js',
    'https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js',
    'https://www.gstatic.com/firebasejs/11.6.1/firebase-database.js'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Cache hit - return response
                if (response) {
                    return response;
                }
                // No cache hit - fetch from network
                return fetch(event.request).catch(() => {
                    // If network fails, you could return a fallback page
                    // For example, if it's an HTML request, return an offline page
                    if (event.request.mode === 'navigate') {
                        return caches.match('/index.html'); // Fallback to main page
                    }
                });
            })
    );
});

self.addEventListener('activate', (event) => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Background Sync for offline data submission
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-offline-scans') {
        console.log('Sync event fired for offline scans!');
        event.waitUntil(syncOfflineScans());
    }
});

async function syncOfflineScans() {
    // This function will be called by the service worker when online.
    // It needs to access the main app's logic to send data to Firebase.
    // However, direct access to localStorage/Firebase from SW is limited.
    // The best approach is to send a message to the main app to perform the sync.
    // For this demo, the main app (index.html) already listens for 'online' event
    // and triggers syncOfflineData(). This service worker's sync event is
    // primarily for more robust background sync in real PWAs, but the
    // client-side 'online' listener is sufficient for this demo.

    // To make this service worker truly handle the sync, you'd typically:
    // 1. Store offline data in IndexedDB within the main app.
    // 2. When sync event fires, the service worker reads from IndexedDB.
    // 3. The service worker then performs the fetch requests to Firebase.
    // 4. Clears IndexedDB upon successful sync.

    // For this specific demo, the main app's `syncOfflineData` function
    // is triggered by the `online` event listener, which is simpler for
    // demonstration purposes within a single HTML file.
    // A message could be sent to the client to trigger the sync:
    self.clients.matchAll().then(clients => {
        clients.forEach(client => {
            client.postMessage({ type: 'SYNC_OFFLINE_DATA' });
        });
    });
    console.log('Service Worker requested main app to sync offline data.');
}

