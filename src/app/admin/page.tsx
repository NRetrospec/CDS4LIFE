import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import AdminPanel from "@/components/site/AdminPanel";
import { HAS_CLERK, HAS_CONVEX } from "@/lib/env";

export const metadata = { title: "Admin", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  // middleware already gates this; re-check here, and again in every Convex admin function
  if (!HAS_CLERK) notFound();
  const { sessionClaims } = await auth();
  if ((sessionClaims as { metadata?: { role?: string } } | null)?.metadata?.role !== "admin") notFound();
  return (
    <main className="on-light mx-auto max-w-5xl px-5 py-12 md:px-8">
      <h1 className="font-display text-4xl font-extrabold uppercase tracking-tight">Admin</h1>
      {HAS_CONVEX ? <AdminPanel /> : <p className="mt-6 text-lg">Convex is not configured.</p>}
    </main>
  );
}
