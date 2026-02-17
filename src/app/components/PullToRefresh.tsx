import { useState, useEffect, useRef, useCallback } from "react";
import { RefreshCw } from "lucide-react";

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  disabled?: boolean;
}

export function PullToRefresh({
  onRefresh,
  children,
  disabled = false,
}: PullToRefreshProps) {
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef<number>(0);
  const currentYRef = useRef<number>(0);
  const isDraggingRef = useRef(false);

  const MAX_PULL_DISTANCE = 100;
  const REFRESH_THRESHOLD = 80;

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (disabled || isRefreshing) return;

    // Only trigger if at top of page
    if (window.scrollY > 0) return;

    startYRef.current = e.touches[0].clientY;
    isDraggingRef.current = true;
  }, [disabled, isRefreshing]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDraggingRef.current || disabled || isRefreshing) return;

    currentYRef.current = e.touches[0].clientY;
    const diff = currentYRef.current - startYRef.current;

    // Only allow pulling down
    if (diff > 0 && window.scrollY === 0) {
      e.preventDefault();
      setIsPulling(true);
      // Add resistance to pull
      const distance = Math.min(diff * 0.5, MAX_PULL_DISTANCE);
      setPullDistance(distance);
    }
  }, [disabled, isRefreshing]);

  const handleTouchEnd = useCallback(async () => {
    if (!isDraggingRef.current) return;

    isDraggingRef.current = false;

    if (pullDistance >= REFRESH_THRESHOLD) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } catch (error) {
        console.error("Refresh failed:", error);
      } finally {
        setIsRefreshing(false);
      }
    }

    setIsPulling(false);
    setPullDistance(0);
  }, [pullDistance, onRefresh]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener("touchstart", handleTouchStart, { passive: true });
    container.addEventListener("touchmove", handleTouchMove, { passive: false });
    container.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  const getIndicatorStyle = () => {
    const opacity = Math.min(pullDistance / REFRESH_THRESHOLD, 1);
    const scale = Math.min(pullDistance / REFRESH_THRESHOLD, 1);

    return {
      opacity,
      transform: `translateY(${pullDistance - 50}px) scale(${scale})`,
    };
  };

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden"
      style={{ touchAction: isPulling ? "none" : "auto" }}
    >
      {/* Pull Indicator */}
      <div
        className="absolute top-0 left-0 right-0 flex items-center justify-center z-10 pointer-events-none"
        style={getIndicatorStyle()}
      >
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg"
          style={{
            backgroundColor: "var(--card)",
            border: "1px solid var(--border)",
          }}
        >
          {isRefreshing ? (
            <RefreshCw
              className="w-5 h-5 animate-spin"
              style={{ color: "var(--accent-indigo)" }}
            />
          ) : (
            <RefreshCw
              className="w-5 h-5 transition-transform"
              style={{
                color: "var(--accent-indigo)",
                transform: `rotate(${pullDistance * 2}deg)`,
              }}
            />
          )}
        </div>
      </div>

      {/* Content */}
      <div
        className="transition-transform duration-200"
        style={{
          transform: isPulling ? `translateY(${pullDistance}px)` : "translateY(0)",
        }}
      >
        {children}
      </div>

      {/* Refreshing Overlay */}
      {isRefreshing && (
        <div
          className="absolute inset-0 bg-black/5 backdrop-blur-[1px] z-20 flex items-start justify-center pt-20"
          aria-live="polite"
          aria-busy="true"
        >
          <div
            className="px-4 py-2 rounded-full shadow-lg flex items-center gap-2"
            style={{
              backgroundColor: "var(--card)",
              border: "1px solid var(--border)",
            }}
          >
            <RefreshCw
              className="w-4 h-4 animate-spin"
              style={{ color: "var(--accent-indigo)" }}
            />
            <span
              className="text-sm font-medium"
              style={{ color: "var(--text-primary)" }}
            >
              Refreshing...
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
