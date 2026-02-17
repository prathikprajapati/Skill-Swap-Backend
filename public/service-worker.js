/**
 * SkillSwap Service Worker
 * Provides offline support and caching strategies
 */

const CACHE_NAME = "skillswap-v1";
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/vite.svg",
];

const API_CACHE_NAME = "skillswap-api-v1";
const API_ROUTES = [
  "/api/skills",
  "/api/users/me",
];

// Install event - cache static assets
self.addEventListener("install", (event) => {
  console.log("[Service Worker] Installing...");
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[Service Worker] Caching static assets");
      return cache.addAll(STATIC_ASSETS);
    })
  );

  // Skip waiting to activate immediately
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  console.log("[Service Worker] Activating...");
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== API_CACHE_NAME)
          .map((name) => {
            console.log("[Service Worker] Deleting old cache:", name);
            return caches.delete(name);
          })
      );
    })
  );

  // Claim clients immediately
  event.waitUntil(self.clients.claim());
});

// Fetch event - serve from cache or network
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") {
    return;
  }

  // Skip chrome-extension and other non-http requests
  if (!url.protocol.startsWith("http")) {
    return;
  }

  // API requests - Network first, then cache
  if (API_ROUTES.some((route) => url.pathname.includes(route))) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Clone the response before caching
          const responseClone = response.clone();
          caches.open(API_CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
          return response;
        })
        .catch(() => {
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
              console.log("[Service Worker] Serving API from cache:", url.pathname);
              return cachedResponse;
            }
            // Return offline fallback for API
            return new Response(
              JSON.stringify({ error: "Offline - No cached data available" }),
              {
                status: 503,
                headers: { "Content-Type": "application/json" },
              }
            );
          });
        })
    );
    return;
  }

  // Static assets - Cache first, then network
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // Return cached version and update in background
        fetch(request)
          .then((response) => {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, response);
            });
          })
          .catch(() => {
            // Network failed, but we have cached version
          });
        return cachedResponse;
      }

      // Not in cache, fetch from network
      return fetch(request)
        .then((response) => {
          // Clone and cache the response
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
          return response;
        })
        .catch((error) => {
          console.error("[Service Worker] Fetch failed:", error);
          // Return offline page for navigation requests
          if (request.mode === "navigate") {
            return caches.match("/index.html");
          }
          throw error;
        });
    })
  );
});

// Background sync for offline form submissions
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-messages") {
    event.waitUntil(syncMessages());
  }
});

// Push notifications (future implementation)
self.addEventListener("push", (event) => {
  const options = {
    body: event.data?.text() || "New notification from SkillSwap",
    icon: "/vite.svg",
    badge: "/vite.svg",
    tag: "skillswap-notification",
    requireInteraction: true,
  };

  event.waitUntil(
    self.registration.showNotification("SkillSwap", options)
  );
});

// Message handling from client
self.addEventListener("message", (event) => {
  if (event.data === "skipWaiting") {
    self.skipWaiting();
  }
});

// Helper function to sync messages
async function syncMessages() {
  // Implementation for background sync
  console.log("[Service Worker] Syncing messages...");
}

console.log("[Service Worker] Registered");
