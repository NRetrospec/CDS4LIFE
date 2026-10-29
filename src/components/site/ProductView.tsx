import { notFound } from "next/navigation";
import BottleViewer from "@/components/three/BottleViewer";
import AddToCart from "@/components/site/AddToCart";
import WishlistButton from "@/components/site/WishlistButton";
import ProductCard from "@/components/site/ProductCard";
import Reviews from "@/components/site/Reviews";
import { LABEL_COPY } from "@/lib/catalog";
import { getProduct, getProducts } from "@/lib/catalog.server";
import { formatPrice } from "@/lib/format";

const KIT = { mms: "activator", activator: "mms" } as const;

export default async function ProductView({ slug }: { slug: string }) {
  const [product, all] = await Promise.all([getProduct(slug), getProducts()]);
  if (!product) notFound();

  const partner = KIT[slug as keyof typeof KIT];
  const also = partner ? all.filter((p) => p.slug === partner) : all.filter((p) => p.slug !== slug).slice(0, 2);
  const price = formatPrice(product.priceCents, product.currency);

  const accordion = [
    {
      title: "Ingredients & use",
      body: (
        <dl className="space-y-3">
          {product.details.map((d) => (
            <div key={d.label}>
              <dt className="tracked text-xs font-bold text-navy/70">{d.label}</dt>
              <dd className="mt-0.5 text-base">{d.value}</dd>
            </div>
          ))}
        </dl>
      ),
    },
    { title: "Shipping", body: <p className="text-base">We ship across the USA.</p> },
    {
      title: "The FDA statement",
      open: true,
      body: <FdaBlock />,
    },
  ];

  return (
    <>
      <div className="grid gap-10 lg:grid-cols-[3fr_2fr] lg:gap-16">
        <BottleViewer productId={product.slug} name={product.name} subtitle={product.subtitle} volume={product.volume} />

        <div className="lg:pt-24">
          <p className="text-xl leading-relaxed">{product.summary}</p>
          <p className="mt-4 text-3xl font-extrabold">{price ?? <span className="text-xl font-bold text-navy/70">Price coming soon</span>}</p>
          <div className="mt-6 flex flex-wrap items-start gap-3">
            <AddToCart slug={product.slug} name={product.name} />
            <WishlistButton slug={product.slug} name={product.name} />
          </div>

          <div className="mt-8 divide-y divide-navy/15 border-y border-navy/15">
            {accordion.map((a) => (
              <details key={a.title} open={a.open} className="group py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between text-lg font-bold">
                  {a.title}
                  <span aria-hidden="true" className="text-2xl transition group-open:rotate-45">+</span>
                </summary>
                <div className="pt-4">{a.body}</div>
              </details>
            ))}
          </div>
        </div>
      </div>

      <section aria-labelledby="also-h" className="mt-[var(--section-gap)]">
        <h2 id="also-h" className="font-display text-3xl font-extrabold uppercase tracking-tight">
          {partner ? "You may also need" : "More from CDS 4 Life"}
        </h2>
        <div className="mt-6 grid max-w-2xl gap-6 sm:grid-cols-2">
          {also.map((p) => <ProductCard key={p.slug} product={p} />)}
        </div>
      </section>

      <Reviews slug={product.slug} />
    </>
  );
}

/** Verbatim from the back label. Bordered, body size or larger, always on the page. */
function FdaBlock() {
  return (
    <div className="space-y-3 text-base leading-relaxed">
      <p className="border-2 border-navy p-4 font-bold uppercase">{LABEL_COPY.fda}</p>
      <p>{LABEL_COPY.buyer}</p>
      <p className="font-semibold">{LABEL_COPY.children}</p>
    </div>
  );
}
