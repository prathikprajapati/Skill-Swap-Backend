import { useEffect, useState, useCallback } from "react";

interface ServiceWorkerState {
  isSupported: boolean;
  isInstalled: boolean;
  isUpdateAvailable: boolean;
  offlineReady: boolean;
}

/**
 * useServiceWorker - Hook for managing service worker registration and updates
 * Provides offline support and PWA capabilities
 */
export function useServiceWorker() {
  const [state, setState] = useState<ServiceWorkerState>({
    isSupported: "serviceWorker" in navigator,
    isInstalled: false,
    isUpdateAvailable: false,
    offlineReady: false,
  });

  const [registration, setRegistration] =
    useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      console.log("[Service Worker] Not supported in this browser");
      return;
    }

    const registerSW = async () => {
      try {
        const reg = await navigator.serviceWorker.register(
          "/service-worker.js",
          {
            scope: "/",
          },
        );

        console.log("[Service Worker] Registered:", reg.scope);

        setRegistration(reg);
        setState((prev) => ({ ...prev, isInstalled: true }));

        // Check for updates
        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing;
          if (!newWorker) return;

          newWorker.addEventListener("statechange", () => {
            if (
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              console.log("[Service Worker] Update available");
              setState((prev) => ({ ...prev, isUpdateAvailable: true }));
            }
          });
        });

        // Listen for messages from service worker
        navigator.serviceWorker.addEventListener("message", (event) => {
          if (event.data === "offline-ready") {
            setState((prev) => ({ ...prev, offlineReady: true }));
          }
        });

        // Check if already controlling
        if (reg.active) {
          setState((prev) => ({ ...prev, offlineReady: true }));
        }
      } catch (error) {
        console.error("[Service Worker] Registration failed:", error);
      }
    };

    registerSW();

    // Listen for online/offline events
    const handleOnline = () => {
      console.log("[App] Back online");
    };

    const handleOffline = () => {
      console.log("[App] Gone offline");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const updateServiceWorker = useCallback(() => {
    if (!registration?.waiting) return;

    // Send skip waiting message to activate new service worker
    registration.waiting.postMessage("skipWaiting");

    // Reload page to use new service worker
    window.location.reload();
  }, [registration]);

  const checkForUpdates = useCallback(async () => {
    if (!registration) return;

    try {
      await registration.update();
      console.log("[Service Worker] Checked for updates");
    } catch (error) {
      console.error("[Service Worker] Update check failed:", error);
    }
  }, [registration]);

  return {
    ...state,
    registration,
    updateServiceWorker,
    checkForUpdates,
  };
}

/**
 * useOnlineStatus - Hook to track online/offline status
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return isOnline;
}
