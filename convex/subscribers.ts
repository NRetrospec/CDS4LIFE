import { v } from "convex/values";
import { mutation } from "./lib/server";

export const add = mutation({
  args: { email: v.string(), source: v.string() },
  handler: async (ctx, { email, source }) => {
    const e = email.trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) throw new Error("Invalid email");
    const hit = await ctx.db.query("subscribers").withIndex("by_email", (q) => q.eq("email", e)).unique();
    if (!hit) await ctx.db.insert("subscribers", { email: e, source, createdAt: Date.now() });
    return null;
  },
});
