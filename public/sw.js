/**
 * Forkling Service Worker
 * ─── Cache First + Stale While Revalidate ───
 *
 * Static assets: Cache First (fast loads)
 * API requests:  Stale While Revalidate (show cached, refresh in background)
 * Navigation:    Network First with offline fallback
 */

const CACHE_NAME = 'forkling-v1';

// Assets to pre-cache on install
const PRECACHE_URLS = [
  '/',
  '/Forkling_logo.png',
  '/favicon.svg',
  '/manifest.json',
];

// ─── Install ─────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS);
    })
  );
  // Activate immediately instead of waiting for old SW to die
  self.skipWaiting();
});

// ─── Activate ────────────────────────────────────
self.addEventListener('activate', (event) => {
  // Purge old caches
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    )
  );
  // Take control of all clients immediately
  self.clients.claim();
});

// ─── Fetch strategies ────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip Chrome extensions & other origins we don't control
  if (!url.protocol.startsWith('http')) return;

  // Strategy for GitHub/HuggingFace API calls: Stale While Revalidate
  if (url.hostname === 'api.github.com' || url.hostname === 'huggingface.co') {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  // Strategy for static assets (JS, CSS, images, fonts): Cache First
  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Strategy for navigation (HTML pages): Network First
  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request));
    return;
  }

  // Everything else: Network First
  event.respondWith(networkFirst(request));
});

// ─── Helpers ─────────────────────────────────────

function isStaticAsset(url) {
  return /\.(js|css|png|jpg|jpeg|svg|gif|webp|woff|woff2|ttf|ico)(\?.*)?$/.test(url.pathname);
}

/**
 * Cache First — serve from cache, fall back to network.
 * Good for static assets that rarely change.
 */
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    // Offline and not cached — return a basic offline response
    return new Response('Offline', { status: 503, statusText: 'Offline' });
  }
}

/**
 * Stale While Revalidate — serve from cache immediately,
 * then fetch fresh data in the background.
 * Perfect for API calls where stale data is better than no data.
 */
async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  // Always try to fetch fresh data in the background
  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => null);

  // Return cached response immediately if available, otherwise wait for network
  if (cached) return cached;

  const networkResponse = await fetchPromise;
  if (networkResponse) return networkResponse;

  // Both cache and network failed
  return new Response(JSON.stringify({ error: 'Offline', message: 'Forky is offline — cached data unavailable for this request.' }), {
    status: 503,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * Network First — try network, fall back to cache.
 * Good for HTML navigation where freshness matters.
 */
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;

    // For navigation requests, try returning cached index page (SPA fallback)
    if (request.mode === 'navigate') {
      const fallback = await caches.match('/');
      if (fallback) return fallback;
    }

    return new Response('Offline', { status: 503, statusText: 'Offline' });
  }
}
