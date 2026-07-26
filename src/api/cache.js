/**
 * IndexedDB caching layer for Forkling.
 * Store: forkling_cache | Default TTL: 1 hour
 */

const DB_NAME = 'forkling_cache';
const STORE_NAME = 'responses';
const DB_VERSION = 1;
const DEFAULT_TTL = 3600000; // 1 hour in ms

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'url' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getCached(url) {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(url);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

async function setCached(url, data, ttl) {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put({
      url,
      data,
      timestamp: Date.now(),
      ttl,
    });
    await new Promise((resolve, reject) => {
      tx.oncomplete = resolve;
      tx.onerror = reject;
    });
  } catch {
    // Silently fail — caching is best-effort
  }
}

/**
 * Fetch with IndexedDB caching.
 * Checks cache first (by TTL), falls back to live fetch, then caches the result.
 *
 * @param {string} url - The URL to fetch
 * @param {RequestInit} options - fetch options (headers, etc.)
 * @param {number} ttl - Cache TTL in ms (default 1hr)
 * @returns {Promise<any>} - Parsed JSON response
 */
export async function fetchWithCache(url, options = {}, ttl = DEFAULT_TTL) {
  // Check cache
  const cached = await getCached(url);
  if (cached && (Date.now() - cached.timestamp) < cached.ttl) {
    return cached.data;
  }

  // Live fetch
  const response = await fetch(url, options);

  if (!response.ok) {
    const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
    error.status = response.status;
    error.headers = Object.fromEntries(response.headers.entries());
    throw error;
  }

  const data = await response.json();

  // Cache the result (don't await — fire and forget)
  setCached(url, data, ttl);

  // Extract rate limit headers for GitHub API
  const rateLimit = {
    limit: parseInt(response.headers.get('x-ratelimit-limit') || '0', 10),
    remaining: parseInt(response.headers.get('x-ratelimit-remaining') || '0', 10),
    reset: parseInt(response.headers.get('x-ratelimit-reset') || '0', 10),
    used: parseInt(response.headers.get('x-ratelimit-used') || '0', 10),
  };

  if (Array.isArray(data)) {
    data._rateLimit = rateLimit;
    return data;
  }

  return { ...data, _rateLimit: rateLimit };
}

/**
 * Clear all cached data.
 */
export async function clearCache() {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).clear();
    await new Promise((resolve) => { tx.oncomplete = resolve; });
  } catch {
    // Silently fail
  }
}
