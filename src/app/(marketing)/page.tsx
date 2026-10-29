import HomeHero from "@/components/intro/HomeHero";
import { getProducts } from "@/lib/catalog.server";

export const revalidate = 60; // Convex product edits show up without a deploy

/** The homepage is the hero alone: bottles open their product in a modal. */
export default async function HomePage() {
  return <HomeHero products={await getProducts()} />;
}
