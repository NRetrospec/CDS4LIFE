import { v } from "convex/values";
import { mutation, query, requireUser } from "./lib/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const rows = await ctx.db.query("wishlist").withIndex("by_user", (q) => q.eq("userId", identity.subject)).collect();
    const out = await Promise.all(
      rows.map(async (r) => {
        const p = await ctx.db.get(r.productId);
        return p ? { slug: p.slug, name: p.name, subtitle: p.subtitle, volume: p.volume, addedAt: r.createdAt } : null;
      })
    );
    return out.filter((x) => x !== null);
  },
});

export const toggle = mutation({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const { subject } = await requireUser(ctx);
    const p = await ctx.db.query("products").withIndex("by_slug", (q) => q.eq("slug", slug)).unique();
    if (!p) throw new Error("Unknown product");
    const hit = await ctx.db
      .query("wishlist")
      .withIndex("by_user_product", (q) => q.eq("userId", subject).eq("productId", p._id))
      .unique();
    if (hit) {
      await ctx.db.delete(hit._id);
      return false;
    }
    await ctx.db.insert("wishlist", { userId: subject, productId: p._id, createdAt: Date.now() });
    return true;
  },
});
