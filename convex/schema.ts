import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  products: defineTable({
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
  })
    .index("by_slug", ["slug"])
    .index("by_active", ["active", "sortOrder"]),

  carts: defineTable({
    userId: v.string(),
    items: v.array(v.object({ productId: v.id("products"), qty: v.number() })),
  }).index("by_user", ["userId"]),

  orders: defineTable({
    userId: v.string(),
    email: v.string(),
    items: v.array(
      v.object({ productId: v.id("products"), name: v.string(), unitCents: v.number(), qty: v.number() })
    ),
    subtotalCents: v.number(),
    shippingCents: v.number(),
    totalCents: v.number(),
    status: v.union(v.literal("pending"), v.literal("paid"), v.literal("shipped"), v.literal("cancelled")),
    stripeSessionId: v.optional(v.string()),
    shippingAddress: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"])
    .index("by_stripe_session", ["stripeSessionId"]), // webhook idempotency

  wishlist: defineTable({
    userId: v.string(),
    productId: v.id("products"),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_product", ["userId", "productId"]),

  reviews: defineTable({
    productId: v.id("products"),
    userId: v.string(),
    authorName: v.string(),
    rating: v.number(),
    body: v.string(),
    approved: v.boolean(),
    createdAt: v.number(),
  }).index("by_product", ["productId", "approved"]),

  subscribers: defineTable({
    email: v.string(),
    source: v.string(),
    createdAt: v.number(),
  }).index("by_email", ["email"]),
});
