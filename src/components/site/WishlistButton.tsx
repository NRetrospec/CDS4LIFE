"use client";

import { useMutation, useQuery } from "convex/react";
import { makeFunctionReference } from "convex/server";
import { Show } from "@clerk/nextjs";
import { HAS_CLERK, HAS_CONVEX } from "@/lib/env";

export const wishlistList = makeFunctionReference<"query", Record<string, never>, { slug: string; name: string; subtitle: string; volume: string }[]>("wishlist:list");
const toggleRef = makeFunctionReference<"mutation", { slug: string }, boolean>("wishlist:toggle");

function Inner({ slug, name }: { slug: string; name: string }) {
  const list = useQuery(wishlistList, {});
  const toggle = useMutation(toggleRef);
  const saved = !!list?.some((w) => w.slug === slug);
  return (
    <button
      type="button"
      aria-pressed={saved}
      onClick={() => toggle({ slug })}
      className="rounded-full border border-navy/25 px-6 py-3.5 text-sm font-semibold transition hover:border-navy aria-pressed:border-forest aria-pressed:bg-forest/10"
    >
      {saved ? "Saved to wishlist" : "Save to wishlist"}
      <span className="sr-only"> — {name}</span>
    </button>
  );
}

/** Wishlist needs an account; signed-out visitors never see the button. */
export default function WishlistButton(props: { slug: string; name: string }) {
  if (!HAS_CLERK || !HAS_CONVEX) return null;
  return (
    <Show when="signed-in">
      <Inner {...props} />
    </Show>
  );
}
