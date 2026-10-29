import type { Metadata } from "next";
import { Suspense } from "react";
import ProductSkeleton from "@/components/site/ProductSkeleton";
import ProductView from "@/components/site/ProductView";
import { STATIC_PRODUCTS } from "@/lib/catalog";
import { getProduct } from "@/lib/catalog.server";

export const revalidate = 60;

export function generateStaticParams() {
  return STATIC_PRODUCTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const p = await getProduct((await params).slug);
  return p ? { title: p.name, description: p.summary, openGraph: { images: [p.images.bottle] } } : {};
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return (
    <div className="on-light mx-auto max-w-7xl px-5 pb-24 pt-28 md:px-8">
      <Suspense fallback={<ProductSkeleton />}>
        <ProductView slug={slug} />
      </Suspense>
    </div>
  );
}
