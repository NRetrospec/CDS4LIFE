import { v } from "convex/values";
import { mutation, query, requireAdmin } from "./lib/server";

export const productFields = {
  slug: v.string(),
  name: v.string(),
  subtitle: v.string(),
  volume: v.string(),
  priceCents: v.number(),
  currency: v.literal("USD"),
  pillColor: v.string(),
  summary: v.string(),
  details: v.array(v.object({ label: v.string(), value: v.string() })),
  images: v.object({ front: v.string(), back: v.string(), bottle: v.string() }),
  active: v.boolean(),
  sortOrder: v.number(),
};

export const list = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db
      .query("products")
      .withIndex("by_active", (q) => q.eq("active", true))
      .collect();
    return rows.sort((a, b) => a.sortOrder - b.sortOrder);
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const p = await ctx.db.query("products").withIndex("by_slug", (q) => q.eq("slug", slug)).unique();
    return p && p.active ? p : null;
  },
});

export const listAll = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return (await ctx.db.query("products").collect()).sort((a, b) => a.sortOrder - b.sortOrder);
  },
});

export const upsert = mutation({
  args: productFields,
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const existing = await ctx.db.query("products").withIndex("by_slug", (q) => q.eq("slug", args.slug)).unique();
    if (existing) {
      await ctx.db.replace(existing._id, args);
      return existing._id;
    }
    return await ctx.db.insert("products", args);
  },
});
