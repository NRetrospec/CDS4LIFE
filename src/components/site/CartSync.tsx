"use client";

import { useEffect, useRef } from "react";
import { useConvexAuth, useMutation } from "convex/react";
import { makeFunctionReference } from "convex/server";
import { useCart } from "./CartProvider";

const mergeLocal = makeFunctionReference<"mutation", { items: { slug: string; qty: number }[] }, null>("cart:mergeLocal");
const MERGED = "cds-cart-merged";

/** Pushes the anonymous cart into the signed-in user's Convex cart exactly once per sign-in. */
export default function CartSync() {
  const { isAuthenticated } = useConvexAuth();
  const merge = useMutation(mergeLocal);
  const cart = useCart();
  const busy = useRef(false);

  useEffect(() => {
    if (!isAuthenticated) {
      try { sessionStorage.removeItem(MERGED); } catch {}
      return;
    }
    if (!cart.hydrated || busy.current) return;
    try { if (sessionStorage.getItem(MERGED)) return; } catch {}
    busy.current = true;
    const items = cart.lines;
    (items.length ? merge({ items }) : Promise.resolve(null))
      .then(() => {
        try { sessionStorage.setItem(MERGED, "1"); } catch {}
        if (items.length) cart.clear();
      })
      .catch((e) => console.error("cart merge failed", e))
      .finally(() => { busy.current = false; });
  }, [isAuthenticated, cart, merge]);

  return null;
}
