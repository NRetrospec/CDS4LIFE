import { NextResponse, type NextRequest } from "next/server";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtected = createRouteMatcher(["/account(.*)", "/wishlist(.*)", "/admin(.*)"]);
const isAdminRoute = createRouteMatcher(["/admin(.*)"]);

// Storefront, product pages and the 3D viewer stay public; only account + admin are gated.
const withClerk = clerkMiddleware(async (auth, req) => {
  if (!isProtected(req)) return;
  const { userId, sessionClaims } = await auth.protect();
  if (isAdminRoute(req)) {
    // needs the session-token claim  { "metadata": "{{user.public_metadata}}" }  in the Clerk dashboard
    const role = (sessionClaims as { metadata?: { role?: string } } | null)?.metadata?.role;
    if (!userId || role !== "admin") return NextResponse.rewrite(new URL("/not-found", req.url));
  }
});

// Before Clerk is configured the app still runs; /admin simply does not exist.
function withoutClerk(req: NextRequest) {
  return isAdminRoute(req) ? NextResponse.rewrite(new URL("/not-found", req.url)) : NextResponse.next();
}

export default process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? withClerk : withoutClerk;

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest|mp4|webm)).*)",
    "/(api|trpc)(.*)",
  ],
};
