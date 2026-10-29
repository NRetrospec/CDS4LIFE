import Image from "next/image";
import Link from "next/link";
import { BOTTLE_ART, type Product } from "@/lib/catalog";
import { formatPrice } from "@/lib/format";
import { inkFor } from "@/lib/site-content";

export default function ProductCard({ product: p }: { product: Product }) {
  const art = BOTTLE_ART[p.slug];
  const price = formatPrice(p.priceCents, p.currency);
  return (
    <article className="on-light group relative flex flex-col items-center rounded-card bg-white p-6 text-center shadow-soft">
      <div className="flex h-56 items-end justify-center">
        {art && (
          <Image
            src={`/bottles/${p.slug}.webp`}
            alt={art.alt}
            width={art.w}
            height={art.h}
            sizes="160px"
            className="bottle-shadow w-auto transition-transform duration-300 group-hover:-translate-y-1"
            style={{ height: `${Math.round(224 * art.rel)}px` }}
          />
        )}
      </div>
      <h3
        className="mt-5 rounded-full px-6 py-1.5 text-base font-extrabold uppercase tracking-wide"
        style={{ background: p.pillColor, color: inkFor(p.pillColor) }}
      >
        {p.name}
      </h3>
      <p className="mt-3 text-sm font-semibold">{p.subtitle}</p>
      <p className="mt-0.5 text-sm text-navy/70">{p.volume}</p>
      {price && <p className="mt-2 text-base font-bold">{price}</p>}
      <Link
        href={`/products/${p.slug}`}
        className="mt-5 rounded-full border border-navy/25 px-5 py-2 text-sm font-semibold transition hover:border-navy after:absolute after:inset-0"
      >
        Read more<span className="sr-only"> about {p.name}</span>
      </Link>
    </article>
  );
}
