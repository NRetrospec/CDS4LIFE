import { v } from "convex/values";
import { mutation, query, requireAdmin, requireUser } from "./lib/server";

export const listApproved = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const p = await ctx.db.query("products").withIndex("by_slug", (q) => q.eq("slug", slug)).unique();
    if (!p) return [];
    const rows = await ctx.db
      .query("reviews")
      .withIndex("by_product", (q) => q.eq("productId", p._id).eq("approved", true))
      .collect();
    return rows
      .sort((a, b) => b.createdAt - a.createdAt)
      .map((r) => ({ _id: r._id, authorName: r.authorName, rating: r.rating, body: r.body, createdAt: r.createdAt }));
  },
});

/** Always created unapproved; an admin approves before it shows. */
export const create = mutation({
  args: { slug: v.string(), rating: v.number(), body: v.string() },
  handler: async (ctx, { slug, rating, body }) => {
    const identity = await requireUser(ctx);
    const p = await ctx.db.query("products").withIndex("by_slug", (q) => q.eq("slug", slug)).unique();
    if (!p) throw new Error("Unknown product");
    const text = body.trim();
    if (!text || text.length > 2000) throw new Error("Review must be 1–2000 characters");
    const stars = Math.round(rating);
    if (stars < 1 || stars > 5) throw new Error("Rating must be 1–5");
    await ctx.db.insert("reviews", {
      productId: p._id,
      userId: identity.subject,
      authorName: identity.givenName ?? identity.name ?? "Customer",
      rating: stars,
      body: text,
      approved: false,
      createdAt: Date.now(),
    });
  },
});

export const listPending = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.db.query("reviews").collect().then((r) => r.filter((x) => !x.approved));
  },
});

export const approve = mutation({
  args: { id: v.id("reviews") },
  handler: async (ctx, { id }) => {
    await requireAdmin(ctx);
    await ctx.db.patch(id, { approved: true });
  },
});
