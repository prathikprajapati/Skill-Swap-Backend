import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router";
import {
  LayoutDashboard,
  User,
  Inbox,
  MessageSquare,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "@/app/contexts/AuthContext";

export function MobileNavigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const location = useLocation();
  const { logout } = useAuth();

  // Handle scroll behavior - hide/show navigation
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Show/hide based on scroll direction
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  // Close menu on route change
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  const navItems = [
    { path: "/app", label: "Dashboard", icon: LayoutDashboard, badge: null },
    { path: "/app/profile", label: "Profile", icon: User, badge: null },
    { path: "/app/requests", label: "Requests", icon: Inbox, badge: 3 },
    { path: "/app/chat", label: "Chat", icon: MessageSquare, badge: 5 },
  ];

  const handleLogout = () => {
    logout();
    setIsOpen(false);
  };

  return (
    <>
      {/* Mobile Header */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 bg-card border-b border-border backdrop-blur-md bg-opacity-95 transition-transform duration-300 md:hidden ${
          isVisible ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        <div className="flex items-center justify-between h-14 px-4">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2"
            aria-label="Skill Swap Home"
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shadow-sm"
              style={{ backgroundColor: "var(--primary)" }}
            >
              <span className="text-white font-semibold text-sm">SS</span>
            </div>
            <span
              className="font-semibold text-base"
              style={{ color: "var(--text-primary)" }}
            >
              Skill Swap
            </span>
          </Link>

          {/* Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="w-11 h-11 rounded-lg flex items-center justify-center transition-colors active:scale-95"
            style={{
              backgroundColor: isOpen
                ? "var(--section-bg)"
                : "transparent",
              touchAction: "manipulation",
            }}
            aria-label={isOpen ? "Close menu" : "Open menu"}
            aria-expanded={isOpen}
            aria-controls="mobile-menu"
          >
            {isOpen ? (
              <X className="w-6 h-6" style={{ color: "var(--text-primary)" }} />
            ) : (
              <Menu className="w-6 h-6" style={{ color: "var(--text-primary)" }} />
            )}
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <div
        id="mobile-menu"
        className={`fixed inset-0 z-40 md:hidden transition-opacity duration-300 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />

        {/* Menu Panel */}
        <nav
          className={`absolute top-14 left-0 right-0 bg-card border-b border-border shadow-2xl transition-transform duration-300 ${
            isOpen ? "translate-y-0" : "-translate-y-full"
          }`}
          role="navigation"
          aria-label="Mobile navigation"
        >
          <div className="p-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className="flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 active:scale-98 min-h-[44px]"
                  style={{
                    backgroundColor: isActive
                      ? "var(--section-bg)"
                      : "transparent",
                    color: isActive
                      ? "var(--accent-indigo)"
                      : "var(--text-primary)",
                    fontWeight: isActive ? 600 : 400,
                    touchAction: "manipulation",
                  }}
                  aria-current={isActive ? "page" : undefined}
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{
                      backgroundColor: isActive
                        ? "var(--accent-indigo)"
                        : "var(--secondary)",
                      color: isActive ? "white" : "var(--text-secondary)",
                    }}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="flex-1 text-base">{item.label}</span>
                  {item.badge && (
                    <span
                      className="px-2 py-0.5 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: "var(--destructive)",
                        color: "white",
                        minWidth: "20px",
                        height: "20px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                      aria-label={`${item.badge} notifications`}
                    >
                      {item.badge}
                    </span>
                  )}
                  <ChevronRight
                    className="w-5 h-5"
                    style={{ color: "var(--text-tertiary)" }}
                  />
                </Link>
              );
            })}

            {/* Divider */}
            <div
              className="my-3 border-t"
              style={{ borderColor: "var(--border)" }}
            />

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 active:scale-98 min-h-[44px]"
              style={{
                backgroundColor: "transparent",
                color: "var(--destructive)",
                touchAction: "manipulation",
              }}
              aria-label="Logout"
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{
                  backgroundColor: "var(--destructive)",
                  color: "white",
                }}
              >
                <LogOut className="w-5 h-5" />
              </div>
              <span className="flex-1 text-base font-medium">Logout</span>
            </button>
          </div>
        </nav>
      </div>

      {/* Spacer for fixed header */}
      <div className="h-14 md:hidden" />
    </>
  );
}
