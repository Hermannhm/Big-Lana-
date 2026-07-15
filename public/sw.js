/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const CACHE_NAME = 'codecraft-pwa-v1';

// We dynamically cache requested assets of the same origin to avoid hardcoding hashed filenames
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Only cache GET requests
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Only handle same-origin or common external assets (like Google Fonts)
  const isSameOrigin = url.origin === self.location.origin;
  const isGoogleFont = url.host === 'fonts.googleapis.com' || url.host === 'fonts.gstatic.com';

  if (isSameOrigin || isGoogleFont) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          // Fetch a fresh copy in the background and update the cache (Stale-While-Revalidate)
          fetch(event.request)
            .then((networkResponse) => {
              if (networkResponse.status === 200) {
                caches.open(CACHE_NAME).then((cache) => {
                  cache.put(event.request, networkResponse);
                });
              }
            })
            .catch(() => { /* Ignore background fetch errors */ });

          return cachedResponse;
        }

        // Cache miss: fetch from network and store in cache
        return fetch(event.request).then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic' && !isGoogleFont) {
            return networkResponse;
          }

          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return networkResponse;
        }).catch((err) => {
          // If offline and request is for a page, return the index shell from cache
          if (event.request.mode === 'navigate') {
            return caches.match('/');
          }
          throw err;
        });
      })
    );
  }
});
