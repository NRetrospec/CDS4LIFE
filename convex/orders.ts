import { v } from "convex/values";
import { internalMutation, mutation, query, requireAdmin } from "./lib/server";

export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const rows = await ctx.db.query("orders").withIndex("by_user", (q) => q.eq("userId", identity.subject)).collect();
    return rows.sort((a, b) => b.createdAt - a.createdAt);
  },
});

/** Called only from convex/http.ts after the Next.js webhook has verified Stripe's signature. Idempotent per session. */
export const createFromStripeSession = internalMutation({
  args: {
    userId: v.string(),
    email: v.string(),
    items: v.array(v.object({ slug: v.string(), qty: v.number() })),
    shippingCents: v.number(),
    stripeSessionId: v.string(),
    shippingAddress: v.optional(v.string()),
  },
  handler: async (ctx, a) => {
    const dupe = await ctx.db
      .query("orders")
      .withIndex("by_stripe_session", (q) => q.eq("stripeSessionId", a.stripeSessionId))
      .unique();
    if (dupe) return dupe._id;

    const lines = [];
    for (const i of a.items) {
      const p = await ctx.db.query("products").withIndex("by_slug", (q) => q.eq("slug", i.slug)).unique();
      if (!p) throw new Error(`Unknown product ${i.slug}`);
      lines.push({ productId: p._id, name: p.name, unitCents: p.priceCents, qty: i.qty });
    }
    const subtotalCents = lines.reduce((n, l) => n + l.unitCents * l.qty, 0);
    return await ctx.db.insert("orders", {
      userId: a.userId,
      email: a.email,
      items: lines,
      subtotalCents,
      shippingCents: a.shippingCents,
      totalCents: subtotalCents + a.shippingCents,
      status: "paid",
      stripeSessionId: a.stripeSessionId,
      shippingAddress: a.shippingAddress,
      createdAt: Date.now(),
    });
  },
});

export const listAll = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return (await ctx.db.query("orders").collect()).sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const setStatus = mutation({
  args: {
    id: v.id("orders"),
    status: v.union(v.literal("pending"), v.literal("paid"), v.literal("shipped"), v.literal("cancelled")),
  },
  handler: async (ctx, { id, status }) => {
    await requireAdmin(ctx);
    await ctx.db.patch(id, { status });
  },
});
