import { makeFunctionReference } from "convex/server";

export type Product = {
  slug: string;
  name: string;
  subtitle: string;
  volume: string;
  priceCents: number; // 0 = not yet confirmed by the client
  currency: "USD";
  pillColor: string;
  summary: string;
  details: { label: string; value: string }[];
  images: { front: string; back: string; bottle: string };
  active: boolean;
  sortOrder: number;
};

/** Legal copy transcribed from the back-label artwork. Never paraphrase. */
export const LABEL_COPY = {
  fda: "THESE STATEMENTS HAVE NOT BEEN EVALUATED BY THE FDA. THIS PRODUCT IS NOT INTENDED TO DIAGNOSE, TREAT, CURE OR PREVENT ANY DISEASE.",
  buyer: "The Buyer is responsible for the purchase, preparation, and consumption of any CDS 4 life product.",
  children: "Keep out of the reach of children.",
} as const;

const labelDetails = (extra: { label: string; value: string }[]) => [
  ...extra,
  { label: "Buyer responsibility", value: LABEL_COPY.buyer },
  { label: "Safety", value: LABEL_COPY.children },
];

/**
 * Bundled fallback / seed source. Convex `products` is the source of truth once
 * NEXT_PUBLIC_CONVEX_URL is set; convex/seed.ts mirrors this list.
 * Prices are 0 until the client confirms them (open question #1).
 */
export const STATIC_PRODUCTS: Product[] = [
  { slug: "mms", name: "MMS", subtitle: "Sodium Chlorite 28%", volume: "120 ml / 4 oz", pillColor: "#eabb03", sortOrder: 1 },
  { slug: "activator", name: "Activator", subtitle: "Hydrochloric Acid 4%", volume: "120 ml / 4 oz", pillColor: "#01488d", sortOrder: 2 },
  { slug: "cds", name: "CDS", subtitle: "Chlorine Dioxide Solution (3000 ppm)", volume: "250 ml / 8 oz", pillColor: "#2f6b16", sortOrder: 3 },
  { slug: "dmso", name: "DMSO", subtitle: "Dimethyl Sulfoxide 99.9% Pure", volume: "250 ml / 8 oz", pillColor: "#ee7902", sortOrder: 4 },
].map((p) => ({
  ...p,
  priceCents: 0,
  currency: "USD" as const,
  summary: `${p.subtitle} — ${p.volume}`,
  details: labelDetails([
    { label: "Contents", value: p.subtitle },
    { label: "Volume", value: p.volume },
  ]),
  images: { front: `/labels/${p.slug}/front.png`, back: `/labels/${p.slug}/back.png`, bottle: `/bottles/${p.slug}.webp` },
  active: true,
}));

/** Display-only: bottle cut-out sizes (1x WebP) and relative on-shelf height from the source art. */
export const BOTTLE_ART: Record<string, { w: number; h: number; rel: number; alt: string }> = {
  mms: { w: 313, h: 700, rel: 873 / 944, alt: "MMS bottle, 120 ml" },
  activator: { w: 318, h: 700, rel: 874 / 944, alt: "Activator bottle, 120 ml" },
  cds: { w: 284, h: 700, rel: 1, alt: "CDS bottle, 250 ml" },
  dmso: { w: 286, h: 700, rel: 927 / 944, alt: "DMSO bottle, 250 ml" },
};

export const productsList = makeFunctionReference<"query", Record<string, never>, Product[]>("products:list");
export const productBySlug = makeFunctionReference<"query", { slug: string }, Product | null>("products:getBySlug");
