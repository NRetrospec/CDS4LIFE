import type { Metadata } from "next";
import { VALUES } from "@/lib/site-content";

export const metadata: Metadata = { title: "Our Story" };

export default function About() {
  return (
    <div className="on-light mx-auto max-w-4xl px-5 pb-24 pt-32 md:px-8">
      <h1 className="font-display text-5xl font-extrabold uppercase tracking-tight md:text-7xl">About us</h1>
      <p className="mt-3 text-xl font-bold text-forest">Our Story. Our Mission. Your Wellness.</p>
      <p className="mt-8 max-w-prose text-lg leading-relaxed">
        CDS 4 LIFE was created with a simple but powerful mission: to provide accessible, high-quality wellness solutions.
      </p>
      <h2 className="mt-16 font-display text-3xl font-extrabold uppercase tracking-tight">What we stand for</h2>
      <dl className="mt-6 grid gap-x-10 gap-y-6 sm:grid-cols-2">
        {VALUES.map((v) => (
          <div key={v.title}>
            <dt className="tracked text-sm font-bold">{v.title}</dt>
            <dd className="mt-1 text-lg">{v.body}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
