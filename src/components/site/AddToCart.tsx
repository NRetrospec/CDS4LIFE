"use client";

import { useState } from "react";
import { useCart } from "./CartProvider";

export default function AddToCart({ slug, name }: { slug: string; name: string }) {
  const { add } = useCart();
  const [added, setAdded] = useState(false);
  return (
    <div>
      <button
        type="button"
        onClick={() => {
          add(slug);
          setAdded(true);
          setTimeout(() => setAdded(false), 2200);
        }}
        className="cta w-full rounded-full bg-navy px-8 py-4 text-base font-bold text-white transition hover:bg-forest sm:w-auto"
      >
        Add to cart
      </button>
      <p role="status" aria-live="polite" className="mt-2 h-5 text-sm font-semibold text-forest">
        {added ? `${name} added to your cart` : ""}
      </p>
    </div>
  );
}
