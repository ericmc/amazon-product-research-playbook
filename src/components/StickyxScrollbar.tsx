import { useLayoutEffect, useRef } from "react";

/**
 * Wrap any wide table/list with this. It renders a sticky horizontal proxy
 * scrollbar OUTSIDE the table viewport and keeps it synced with the table's
 * scrollLeft so it's usable no matter your vertical position.
 */
export default function StickyXScrollbar({
  children,
  maxHeight = "72vh",
  barHeight = 14,
  className = "",
}: {
  children: React.ReactNode;
  maxHeight?: string;
  barHeight?: number;
  className?: string;
}) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const proxyRef = useRef<HTMLDivElement | null>(null);
  const railRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    const viewport = viewportRef.current!;
    const proxy = proxyRef.current!;
    const rail = railRef.current!;

    const syncRail = () => {
      // match width to the full scrollable content of the table/list
      rail.style.width = viewport.scrollWidth + "px";
    };

    let lock = false;
    const onProxy = () => {
      if (lock) return;
      lock = true;
      viewport.scrollLeft = proxy.scrollLeft;
      lock = false;
    };
    const onViewport = () => {
      if (lock) return;
      lock = true;
      proxy.scrollLeft = viewport.scrollLeft;
      lock = false;
    };

    proxy.addEventListener("scroll", onProxy, { passive: true });
    viewport.addEventListener("scroll", onViewport, { passive: true });

    const ro = new ResizeObserver(syncRail);
    ro.observe(viewport);

    const mo = new MutationObserver(syncRail);
    mo.observe(viewport, { childList: true, subtree: true });

    window.addEventListener("resize", syncRail);
    syncRail();

    return () => {
      proxy.removeEventListener("scroll", onProxy);
      viewport.removeEventListener("scroll", onViewport);
      ro.disconnect();
      mo.disconnect();
      window.removeEventListener("resize", syncRail);
    };
  }, []);

  return (
    <div className={`relative ${className}`}>
      {/* Sticky proxy scrollbar outside the viewport */}
      <div
        ref={proxyRef}
        className="sticky bottom-0 z-20 overflow-x-auto overflow-y-hidden border-t bg-white/90 backdrop-blur-sm"
        style={{ height: barHeight }}
        aria-label="Horizontal scroll"
      >
        <div ref={railRef} style={{ height: 1 }} />
      </div>

      {/* Your original scroll container */}
      <div
        ref={viewportRef}
        className="overflow-auto [scrollbar-gutter:stable_both-edges]"
        style={{ maxHeight }}
      >
        {children}
      </div>
    </div>
  );
}