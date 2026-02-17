import { useState, useEffect } from "react";

/**
 * SkipNavigation - Accessibility component that allows keyboard users
 * to skip to main content, bypassing navigation menus
 */
export function SkipNavigation() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Show skip link when user presses Tab
      if (e.key === "Tab") {
        setIsVisible(true);
      }
    };

    // Hide skip link on click outside
    const handleClick = () => {
      setIsVisible(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("click", handleClick);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("click", handleClick);
    };
  }, []);

  const handleSkipToMain = () => {
    const mainContent = document.getElementById("main-content");
    if (mainContent) {
      mainContent.focus();
      mainContent.scrollIntoView({ behavior: "smooth" });
      setIsVisible(false);
    }
  };

  const handleSkipToNav = () => {
    const nav = document.getElementById("main-navigation");
    if (nav) {
      nav.focus();
      setIsVisible(false);
    }
  };

  return (
    <div
      className={`fixed top-4 left-4 z-[100] flex flex-col gap-2 transition-opacity duration-200 ${
        isVisible ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      role="region"
      aria-label="Skip navigation links"
    >
      <button
        onClick={handleSkipToMain}
        className="px-4 py-3 rounded-lg font-medium text-sm shadow-lg transform transition-transform hover:scale-105 focus:scale-105 min-h-[44px]"
        style={{
          backgroundColor: "var(--accent-indigo)",
          color: "white",
        }}
      >
        Skip to main content
      </button>
      <button
        onClick={handleSkipToNav}
        className="px-4 py-3 rounded-lg font-medium text-sm shadow-lg transform transition-transform hover:scale-105 focus:scale-105 min-h-[44px]"
        style={{
          backgroundColor: "var(--card)",
          color: "var(--text-primary)",
          border: "1px solid var(--border)",
        }}
      >
        Skip to navigation
      </button>
    </div>
  );
}
