import type { Metadata } from "next";
import ProductCard from "@/components/site/ProductCard";
import { getProducts } from "@/lib/catalog.server";

export const revalidate = 60;
export const metadata: Metadata = { title: "Shop" };

export default async function ProductsIndex() {
  const products = await getProducts();
  return (
    <div className="on-light mx-auto max-w-7xl px-5 pb-24 pt-32 md:px-8">
      <h1 className="font-display text-4xl font-extrabold uppercase tracking-tight md:text-6xl">Shop</h1>
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((p) => <ProductCard key={p.slug} product={p} />)}
      </div>
    </div>
  );
}
