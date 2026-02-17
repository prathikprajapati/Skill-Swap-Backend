import { Outlet, useNavigate, useLocation } from "react-router";
import { LayoutDashboard, User, Inbox, MessageSquare } from "lucide-react";
import Dock from "@/app/components/ui/Dock";
import { MobileNavigation } from "@/app/components/MobileNavigation";
import { PullToRefresh } from "@/app/components/PullToRefresh";
import { Navigation } from "@/app/components/Navigation";
import { useCallback } from "react";

/**
 * Layout - Main application layout with responsive navigation
 * Includes mobile navigation, desktop navigation, and pull-to-refresh
 */
export function Layout() {
  const navigate = useNavigate();
  const location = useLocation();

  const dockItems = [
    {
      icon: <LayoutDashboard size={18} />,
      label: "Dashboard",
      onClick: () => navigate("/app"),
      ariaLabel: "Go to Dashboard",
    },
    {
      icon: <User size={18} />,
      label: "Profile",
      onClick: () => navigate("/app/profile"),
      ariaLabel: "Go to Profile",
    },
    {
      icon: <Inbox size={18} />,
      label: "Requests",
      onClick: () => navigate("/app/requests"),
      ariaLabel: "Go to Requests",
    },
    {
      icon: <MessageSquare size={18} />,
      label: "Chat",
      onClick: () => navigate("/app/chat"),
      ariaLabel: "Go to Chat",
    },
  ];

  // Handle pull-to-refresh
  const handleRefresh = useCallback(async () => {
    // Reload current page data
    window.location.reload();
  }, []);

  // Check if current route supports pull-to-refresh
  const supportsPullToRefresh = ["/app", "/app/requests", "/app/chat"].includes(
    location.pathname
  );

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "var(--background)" }}
    >
      {/* Desktop Navigation - Hidden on mobile */}
      <div className="hidden md:block">
        <Navigation />
      </div>

      {/* Mobile Navigation */}
      <MobileNavigation />

      {/* Main Content */}
      <PullToRefresh
        onRefresh={handleRefresh}
        disabled={!supportsPullToRefresh}
      >
        <main
          id="main-content"
          tabIndex={-1}
          className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-24 md:pb-8 outline-none"
          aria-label="Main content"
        >
          <Outlet />
        </main>
      </PullToRefresh>

      {/* Desktop Dock - Hidden on mobile */}
      <div className="hidden md:block">
        <Dock
          items={dockItems}
          panelHeight={59}
          baseItemSize={50}
          magnification={70}
        />
      </div>

      {/* Mobile Bottom Navigation */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-40"
        aria-label="Mobile bottom navigation"
      >
        <div className="flex items-center justify-around h-16 px-2">
          {dockItems.map((item) => (
            <button
              key={item.label}
              onClick={item.onClick}
              className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors active:scale-95 min-h-[44px] min-w-[44px]"
              style={{
                color:
                  location.pathname ===
                  (item.label === "Dashboard" ? "/app" : `/app/${item.label.toLowerCase()}`)
                    ? "var(--accent-indigo)"
                    : "var(--text-secondary)",
              }}
              aria-label={item.ariaLabel}
              aria-current={
                location.pathname ===
                (item.label === "Dashboard" ? "/app" : `/app/${item.label.toLowerCase()}`)
                  ? "page"
                  : undefined
              }
            >
              {item.icon}
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
