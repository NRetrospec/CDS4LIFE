import { NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";

/**
 * Phase 2 seam. Verifies Stripe's signature, then hands the paid session to Convex through the
 * shared-secret bridge in convex/http.ts (orders.createFromStripeSession stays an internal mutation).
 * Inert unless NEXT_PUBLIC_COMMERCE=on.
 */
export async function POST(req: Request) {
  if (process.env.NEXT_PUBLIC_COMMERCE !== "on") return new NextResponse("commerce is off", { status: 404 });

  const { STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, NEXT_PUBLIC_CONVEX_SITE_URL, STRIPE_BRIDGE_SECRET } = process.env;
  if (!STRIPE_SECRET_KEY || !STRIPE_WEBHOOK_SECRET || !NEXT_PUBLIC_CONVEX_SITE_URL || !STRIPE_BRIDGE_SECRET) {
    return new NextResponse("not configured", { status: 500 });
  }

  const stripe = new Stripe(STRIPE_SECRET_KEY);
  const sig = req.headers.get("stripe-signature");
  if (!sig) return new NextResponse("missing signature", { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(await req.text(), sig, STRIPE_WEBHOOK_SECRET);
  } catch {
    return new NextResponse("bad signature", { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const s = event.data.object as Stripe.Checkout.Session;
    const items = s.metadata?.items ? (JSON.parse(s.metadata.items) as { slug: string; qty: number }[]) : [];
    const res = await fetch(`${NEXT_PUBLIC_CONVEX_SITE_URL}/stripe-order`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${STRIPE_BRIDGE_SECRET}` },
      body: JSON.stringify({
        userId: s.client_reference_id ?? "guest",
        email: s.customer_details?.email ?? "",
        items,
        shippingCents: s.total_details?.amount_shipping ?? 0,
        stripeSessionId: s.id,
        shippingAddress: s.customer_details?.address ? JSON.stringify(s.customer_details.address) : undefined,
      }),
    });
    if (!res.ok) return new NextResponse("order bridge failed", { status: 502 }); // Stripe will retry
  }
  return NextResponse.json({ received: true });
}
