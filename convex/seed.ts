import { STATIC_PRODUCTS } from "../src/lib/catalog";
import { internalMutation } from "./lib/server";

/** `npx convex run seed:run` — safe to re-run; upserts by slug. Prices stay 0 until the client confirms them. */
export const run = internalMutation({
  args: {},
  handler: async (ctx) => {
    for (const p of STATIC_PRODUCTS) {
      const hit = await ctx.db.query("products").withIndex("by_slug", (q) => q.eq("slug", p.slug)).unique();
      if (hit) await ctx.db.replace(hit._id, { ...p, priceCents: hit.priceCents }); // never clobber an edited price
      else await ctx.db.insert("products", p);
    }
    return STATIC_PRODUCTS.length;
  },
});
