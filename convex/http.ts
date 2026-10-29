import { httpActionGeneric, httpRouter, makeFunctionReference } from "convex/server";

const createOrder = makeFunctionReference<"mutation">("orders:createFromStripeSession");

const http = httpRouter();

/**
 * Next.js /api/stripe/webhook verifies Stripe's signature, then POSTs here with the shared secret
 * (Convex env STRIPE_BRIDGE_SECRET). The orders mutation itself stays internal.
 */
http.route({
  path: "/stripe-order",
  method: "POST",
  handler: httpActionGeneric(async (ctx, request) => {
    const expected = process.env.STRIPE_BRIDGE_SECRET;
    if (!expected || request.headers.get("authorization") !== `Bearer ${expected}`) {
      return new Response("unauthorized", { status: 401 });
    }
    const body = await request.json();
    await ctx.runMutation(createOrder, body);
    return new Response("ok", { status: 200 });
  }),
});

export default http;
