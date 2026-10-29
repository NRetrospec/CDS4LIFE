"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { makeFunctionReference } from "convex/server";
import { Show, SignInButton } from "@clerk/nextjs";
import { HAS_CLERK, HAS_CONVEX } from "@/lib/env";

type Review = { _id: string; authorName: string; rating: number; body: string; createdAt: number };
const listRef = makeFunctionReference<"query", { slug: string }, Review[]>("reviews:listApproved");
const createRef = makeFunctionReference<"mutation", { slug: string; rating: number; body: string }, null>("reviews:create");

function Live({ slug }: { slug: string }) {
  const reviews = useQuery(listRef, { slug });
  const create = useMutation(createRef);
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState("");
  const [state, setState] = useState<"idle" | "sent" | "error">("idle");

  return (
    <>
      {reviews === undefined ? null : reviews.length === 0 ? (
        <p className="mt-4 text-lg">No reviews yet.</p>
      ) : (
        <ul className="mt-6 space-y-6">
          {reviews.map((r) => (
            <li key={r._id} className="border-b border-mist pb-6">
              <p className="font-bold">
                {r.authorName} <span className="font-normal text-navy/70">— {r.rating} / 5</span>
              </p>
              <p className="mt-1 text-lg">{r.body}</p>
            </li>
          ))}
        </ul>
      )}
      {HAS_CLERK && (
        <div className="mt-8">
          <Show when="signed-out">
            <SignInButton mode="modal">
              <button className="rounded-full border border-navy/25 px-6 py-3 text-sm font-semibold">Sign in to write a review</button>
            </SignInButton>
          </Show>
          <Show when="signed-in">
            <form
              className="max-w-xl space-y-3"
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  await create({ slug, rating, body });
                  setBody("");
                  setState("sent");
                } catch {
                  setState("error");
                }
              }}
            >
              <label className="block text-sm font-semibold">
                Rating
                <select value={rating} onChange={(e) => setRating(Number(e.target.value))} className="ml-2 rounded border border-navy/25 px-2 py-1">
                  {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </label>
              <label className="block text-sm font-semibold">
                Your review
                <textarea required maxLength={2000} value={body} onChange={(e) => setBody(e.target.value)} rows={4} className="mt-1 w-full rounded-lg border border-navy/25 p-3 text-base font-normal" />
              </label>
              <button className="rounded-full bg-navy px-6 py-3 text-sm font-semibold text-white">Submit review</button>
              <p role="status" className="text-sm">
                {state === "sent" && "Thanks — your review will appear once it has been approved."}
                {state === "error" && "Could not submit your review. Please try again."}
              </p>
            </form>
          </Show>
        </div>
      )}
    </>
  );
}

/** Real, approved submissions only. Nothing is ever pre-filled. */
export default function Reviews({ slug }: { slug: string }) {
  return (
    <section aria-labelledby="reviews-h" className="mt-[var(--section-gap)]">
      <h2 id="reviews-h" className="font-display text-3xl font-extrabold uppercase tracking-tight">Reviews</h2>
      {HAS_CONVEX ? <Live slug={slug} /> : <p className="mt-4 text-lg">No reviews yet.</p>}
    </section>
  );
}
