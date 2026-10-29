"use client";

import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type CartLine = { slug: string; qty: number };
type Ctx = {
  lines: CartLine[];
  count: number;
  add: (slug: string, qty?: number) => void;
  setQty: (slug: string, qty: number) => void;
  clear: () => void;
  hydrated: boolean;
};
const KEY = "cds-cart";
const CartContext = createContext<Ctx | null>(null);

function read(): CartLine[] {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(raw) ? raw.filter((l) => typeof l?.slug === "string" && l.qty > 0) : [];
  } catch {
    return [];
  }
}

/** Anonymous cart in localStorage. Merged into Convex once on sign-in by CartSync. */
export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setLines(read());
    setHydrated(true);
    const onStorage = (e: StorageEvent) => e.key === KEY && setLines(read());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const commit = useCallback((next: CartLine[]) => {
    setLines(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {}
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      lines,
      hydrated,
      count: lines.reduce((n, l) => n + l.qty, 0),
      add: (slug, qty = 1) => {
        const cur = read();
        const hit = cur.find((l) => l.slug === slug);
        commit(hit ? cur.map((l) => (l.slug === slug ? { ...l, qty: l.qty + qty } : l)) : [...cur, { slug, qty }]);
      },
      setQty: (slug, qty) => commit(read().flatMap((l) => (l.slug !== slug ? [l] : qty > 0 ? [{ slug, qty }] : []))),
      clear: () => commit([]),
    }),
    [lines, hydrated, commit]
  );
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const c = useContext(CartContext);
  if (!c) throw new Error("useCart outside CartProvider");
  return c;
}
