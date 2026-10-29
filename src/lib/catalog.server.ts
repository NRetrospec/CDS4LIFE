import "server-only";
import { cache } from "react";
import { ConvexHttpClient } from "convex/browser";
import { productsList, STATIC_PRODUCTS, type Product } from "./catalog";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

/** Server-side read. Pages using this set `revalidate` so Convex edits show without a deploy. */
export const getProducts = cache(async (): Promise<Product[]> => {
  if (convexUrl) {
    try {
      const rows = await new ConvexHttpClient(convexUrl).query(productsList, {});
      if (rows.length) return rows;
    } catch (e) {
      console.error("convex products.list failed, using bundled catalog", e);
    }
  }
  return STATIC_PRODUCTS;
});

export async function getProduct(slug: string): Promise<Product | null> {
  return (await getProducts()).find((p) => p.slug === slug) ?? null;
}
