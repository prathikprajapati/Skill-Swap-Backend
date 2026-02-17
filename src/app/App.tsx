import { RouterProvider } from "react-router";
import { router } from "@/app/routes";
import { ThemeProvider } from "@/app/contexts/ThemeContext";
import { AuthProvider } from "@/app/contexts/AuthContext";
import { ToastProvider } from "@/app/components/ui/Toast";
import { ErrorBoundary } from "@/app/components/ErrorBoundary";
import { SkipNavigation } from "@/app/components/SkipNavigation";
import { useServiceWorker } from "@/app/hooks/useServiceWorker";
import { useEffect } from "react";

/**
 * ServiceWorkerRegistration - Registers service worker for offline support
 */
function ServiceWorkerRegistration() {
  const { isUpdateAvailable, updateServiceWorker } = useServiceWorker();

  useEffect(() => {
    if (isUpdateAvailable) {
      // Show update notification or auto-update
      console.log("[App] Service Worker update available");
    }
  }, [isUpdateAvailable]);

  return null;
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <SkipNavigation />
            <ServiceWorkerRegistration />
            <main id="main-content" tabIndex={-1} className="outline-none">
              <RouterProvider router={router} />
            </main>
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
