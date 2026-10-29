// Inlined at build time. Every integration degrades to a no-op when its keys are absent,
// so the storefront builds and runs before Clerk / Convex / Stripe are provisioned.
export const HAS_CLERK = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
export const HAS_CONVEX = !!process.env.NEXT_PUBLIC_CONVEX_URL;
export const COMMERCE_ON = process.env.NEXT_PUBLIC_COMMERCE === "on";
export const SITE = {
  name: "CDS 4 Life",
  tagline: "Pure Solutions. Powerful Results. Naturally.",
  whatsapp: "786-887-7773",
  instagram: "@cds4.life",
  email: "info@cds4life.com",
  // tap-through URLs are an open question (#5); these are the obvious targets for the known handles
  whatsappUrl: "https://wa.me/17868877773",
  instagramUrl: "https://instagram.com/cds4.life",
};
