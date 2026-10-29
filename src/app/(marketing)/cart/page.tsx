"use client";

import Link from "next/link";
import { useCart } from "@/components/site/CartProvider";
import { STATIC_PRODUCTS } from "@/lib/catalog";
import { COMMERCE_ON } from "@/lib/env";
import { formatPrice } from "@/lib/format";

export default function CartPage() {
  const { lines, setQty, hydrated } = useCart();
  const rows = lines.flatMap((l) => {
    const p = STATIC_PRODUCTS.find((x) => x.slug === l.slug);
    return p ? [{ ...l, p }] : [];
  });
  const subtotal = rows.reduce((n, r) => n + r.p.priceCents * r.qty, 0);

  return (
    <div className="on-light mx-auto max-w-3xl px-5 pb-24 pt-32 md:px-8">
      <h1 className="font-display text-4xl font-extrabold uppercase tracking-tight md:text-5xl">Cart</h1>
      {!hydrated ? null : rows.length === 0 ? (
        <p className="mt-8 text-lg">
          Your cart is empty. <Link href="/products" className="font-semibold underline">Browse the range</Link>.
        </p>
      ) : (
        <>
          <ul className="mt-8 divide-y divide-navy/15 border-y border-navy/15">
            {rows.map(({ p, qty }) => (
              <li key={p.slug} className="flex items-center justify-between gap-4 py-5">
                <div>
                  <Link href={`/products/${p.slug}`} className="text-lg font-bold">{p.name}</Link>
                  <p className="text-sm text-navy/70">{p.volume}</p>
                </div>
                <div className="flex items-center gap-3">
                  <button aria-label={`Decrease ${p.name} quantity`} onClick={() => setQty(p.slug, qty - 1)} className="h-9 w-9 rounded-full border border-navy/25">−</button>
                  <span className="w-6 text-center font-bold" aria-live="polite">{qty}</span>
                  <button aria-label={`Increase ${p.name} quantity`} onClick={() => setQty(p.slug, qty + 1)} className="h-9 w-9 rounded-full border border-navy/25">+</button>
                </div>
              </li>
            ))}
          </ul>
          {subtotal > 0 && <p className="mt-6 text-right text-xl font-bold">Subtotal {formatPrice(subtotal)}</p>}
          <button
            disabled={!COMMERCE_ON}
            className="mt-8 rounded-full bg-navy px-8 py-4 font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {COMMERCE_ON ? "Checkout" : "Checkout opens soon"}
          </button>
        </>
      )}
    </div>
  );
}
