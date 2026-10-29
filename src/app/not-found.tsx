import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center px-5 text-center">
      <div>
        <h1 className="font-display text-5xl font-extrabold uppercase tracking-tight">Not found</h1>
        <Link href="/" className="mt-6 inline-block rounded-full bg-navy px-7 py-3 text-sm font-semibold text-white">Back to CDS 4 Life</Link>
      </div>
    </main>
  );
}
