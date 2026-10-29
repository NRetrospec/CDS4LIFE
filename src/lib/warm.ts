"use client";

/** Starts the product page's heavy parts (three.js chunk, measured data, label art) before the click. */
const done = new Set<string>();
let chunk = false;

export function warmViewer(slug?: string) {
  if (typeof window === "undefined") return;
  if (!chunk) {
    chunk = true;
    void import("@/components/three/BottleViewerImpl").catch(() => (chunk = false));
    void fetch("/products.json").catch(() => {});
  }
  if (slug && !done.has(slug)) {
    done.add(slug);
    for (const side of ["front", "back"]) {
      const img = new window.Image();
      img.src = `/labels/${slug}/${side}.png`;
    }
  }
}

/** Idle-time warm-up for all products, so the first click is already cached. */
export function warmAllWhenIdle(slugs: string[]) {
  if (typeof window === "undefined") return;
  const run = () => slugs.forEach(warmViewer);
  const ric = (window as unknown as { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => void }).requestIdleCallback;
  if (ric) ric(run, { timeout: 4000 });
  else setTimeout(run, 2500);
}
