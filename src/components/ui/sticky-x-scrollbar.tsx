import { useLayoutEffect, useRef } from "react";

export default function StickyXScrollbar({
  children,
  maxHeight = "70vh",
  barHeight = 14,
  className = "",
}) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const proxyRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    const proxy = proxyRef.current;
    const rail = railRef.current;
    if (!viewport || !proxy || !rail) return;

    const syncRail = () => {
      // width of content inside the table container
      rail.style.width = viewport.scrollWidth + "px";
    };

    let lock = false;
    const onProxyScroll = () => {
      if (lock) return;
      lock = true;
      viewport.scrollLeft = proxy.scrollLeft;
      lock = false;
    };
    const onViewportScroll = () => {
      if (lock) return;
      lock = true;
      proxy.scrollLeft = viewport.scrollLeft;
      lock = false;
    };

    proxy.addEventListener("scroll", onProxyScroll, { passive: true });
    viewport.addEventListener("scroll", onViewportScroll, { passive: true });

    const ro = new ResizeObserver(syncRail);
    ro.observe(viewport);

    const mo = new MutationObserver(syncRail);
    mo.observe(viewport, { childList: true, subtree: true });

    window.addEventListener("resize", syncRail);
    syncRail();

    return () => {
      proxy.removeEventListener("scroll", onProxyScroll);
      viewport.removeEventListener("scroll", onViewportScroll);
      ro.disconnect();
      mo.disconnect();
      window.removeEventListener("resize", syncRail);
    };
  }, []);

  return (
    <div className={`relative ${className}`}>
      {/* Your original scrollable container */}
      <div
        ref={viewportRef}
        className="overflow-auto [scrollbar-gutter:stable_both-edges]"
        style={{ maxHeight }}
        id="table-viewport"
      >
        {children}
      </div>

      {/* Sticky proxy scrollbar above table's bottom edge */}
      <div
        ref={proxyRef}
        className="absolute bottom-0 left-0 right-0 z-20 overflow-x-auto overflow-y-hidden border-t bg-white/90 backdrop-blur-sm"
        style={{ height: barHeight }}
        aria-label="Horizontal scroll for table"
      >
        <div ref={railRef} style={{ height: 1 }} />
      </div>
    </div>
  );
}