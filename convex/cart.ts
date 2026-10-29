import { v } from "convex/values";
import { mutation, query, requireUser } from "./lib/server";
import type { DataModel } from "./lib/server";
import type { GenericMutationCtx } from "convex/server";

type Items = { productId: DataModel["products"]["document"]["_id"]; qty: number }[];

async function mine(ctx: GenericMutationCtx<DataModel>) {
  const { subject } = await requireUser(ctx);
  const cart = await ctx.db.query("carts").withIndex("by_user", (q) => q.eq("userId", subject)).unique();
  return { subject, cart };
}
async function save(ctx: GenericMutationCtx<DataModel>, subject: string, cartId: string | undefined, items: Items) {
  if (cartId) await ctx.db.patch(cartId as never, { items });
  else await ctx.db.insert("carts", { userId: subject, items });
}

export const get = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const cart = await ctx.db.query("carts").withIndex("by_user", (q) => q.eq("userId", identity.subject)).unique();
    const lines = await Promise.all(
      (cart?.items ?? []).map(async (i) => {
        const p = await ctx.db.get(i.productId);
        return p ? { productId: i.productId, slug: p.slug, name: p.name, unitCents: p.priceCents, qty: i.qty } : null;
      })
    );
    return lines.filter((l) => l !== null);
  },
});

export const addItem = mutation({
  args: { productId: v.id("products"), qty: v.optional(v.number()) },
  handler: async (ctx, { productId, qty = 1 }) => {
    const { subject, cart } = await mine(ctx);
    const items = [...(cart?.items ?? [])];
    const hit = items.find((i) => i.productId === productId);
    if (hit) hit.qty += qty;
    else items.push({ productId, qty });
    await save(ctx, subject, cart?._id, items);
  },
});

export const setQty = mutation({
  args: { productId: v.id("products"), qty: v.number() },
  handler: async (ctx, { productId, qty }) => {
    const { subject, cart } = await mine(ctx);
    const items = (cart?.items ?? []).flatMap((i) =>
      i.productId !== productId ? [i] : qty > 0 ? [{ productId, qty }] : []
    );
    await save(ctx, subject, cart?._id, items);
  },
});

export const removeItem = mutation({
  args: { productId: v.id("products") },
  handler: async (ctx, { productId }) => {
    const { subject, cart } = await mine(ctx);
    await save(ctx, subject, cart?._id, (cart?.items ?? []).filter((i) => i.productId !== productId));
  },
});

export const clear = mutation({
  args: {},
  handler: async (ctx) => {
    const { subject, cart } = await mine(ctx);
    await save(ctx, subject, cart?._id, []);
  },
});

/** One-time merge of the anonymous localStorage cart (by slug) into the signed-in cart. Quantities add. */
export const mergeLocal = mutation({
  args: { items: v.array(v.object({ slug: v.string(), qty: v.number() })) },
  handler: async (ctx, { items: local }) => {
    const { subject, cart } = await mine(ctx);
    const items = [...(cart?.items ?? [])];
    for (const l of local) {
      if (!(l.qty > 0)) continue;
      const p = await ctx.db.query("products").withIndex("by_slug", (q) => q.eq("slug", l.slug)).unique();
      if (!p || !p.active) continue;
      const hit = items.find((i) => i.productId === p._id);
      if (hit) hit.qty += Math.floor(l.qty);
      else items.push({ productId: p._id, qty: Math.floor(l.qty) });
    }
    await save(ctx, subject, cart?._id, items);
    return null;
  },
});
