"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { makeFunctionReference } from "convex/server";
import type { Product } from "@/lib/catalog";

type Review = { _id: string; authorName: string; rating: number; body: string };
type Order = { _id: string; email: string; status: string; totalCents: number; createdAt: number };
const STATUSES = ["pending", "paid", "shipped", "cancelled"] as const;

const listAll = makeFunctionReference<"query", Record<string, never>, (Product & { _id: string })[]>("products:listAll");
const upsert = makeFunctionReference<"mutation", Product, string>("products:upsert");
const pending = makeFunctionReference<"query", Record<string, never>, Review[]>("reviews:listPending");
const approve = makeFunctionReference<"mutation", { id: string }, null>("reviews:approve");
const orders = makeFunctionReference<"query", Record<string, never>, Order[]>("orders:listAll");
const setStatus = makeFunctionReference<"mutation", { id: string; status: string }, null>("orders:setStatus");

function ProductRow({ p }: { p: Product & { _id: string } }) {
  const save = useMutation(upsert);
  const [draft, setDraft] = useState({ name: p.name, summary: p.summary, price: String(p.priceCents / 100), active: p.active });
  const [saved, setSaved] = useState(false);
  const field = "mt-1 w-full rounded-lg border border-navy/25 p-2 text-base font-normal";
  return (
    <form
      className="grid gap-3 rounded-card bg-white p-5 shadow-soft"
      onSubmit={async (e) => {
        e.preventDefault();
        const { _id, ...rest } = p;
        void _id;
        await save({ ...rest, name: draft.name, summary: draft.summary, active: draft.active, priceCents: Math.round(Number(draft.price) * 100) || 0 });
        setSaved(true);
        setTimeout(() => setSaved(false), 1800);
      }}
    >
      <h3 className="text-lg font-bold">{p.slug}</h3>
      <label className="text-sm font-semibold">Name<input className={field} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></label>
      <label className="text-sm font-semibold">Summary<textarea className={field} rows={2} value={draft.summary} onChange={(e) => setDraft({ ...draft, summary: e.target.value })} /></label>
      <label className="text-sm font-semibold">Price (USD)<input className={field} inputMode="decimal" value={draft.price} onChange={(e) => setDraft({ ...draft, price: e.target.value })} /></label>
      <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={draft.active} onChange={(e) => setDraft({ ...draft, active: e.target.checked })} /> Active</label>
      <button className="w-fit rounded-full bg-navy px-6 py-2.5 text-sm font-semibold text-white">{saved ? "Saved" : "Save"}</button>
    </form>
  );
}

export default function AdminPanel() {
  const products = useQuery(listAll, {});
  const reviews = useQuery(pending, {});
  const allOrders = useQuery(orders, {});
  const doApprove = useMutation(approve);
  const doStatus = useMutation(setStatus);
  const h2 = "mt-12 font-display text-2xl font-extrabold uppercase tracking-tight";
  return (
    <>
      <h2 className={h2}>Products</h2>
      <div className="mt-4 grid gap-5 md:grid-cols-2">{products?.map((p) => <ProductRow key={p._id} p={p} />)}</div>

      <h2 className={h2}>Reviews awaiting approval</h2>
      <ul className="mt-4 space-y-4">
        {reviews?.length === 0 && <li>None.</li>}
        {reviews?.map((r) => (
          <li key={r._id} className="rounded-card bg-white p-4 shadow-soft">
            <p className="font-bold">{r.authorName} — {r.rating}/5</p>
            <p>{r.body}</p>
            <button onClick={() => doApprove({ id: r._id })} className="mt-2 rounded-full bg-forest px-5 py-2 text-sm font-semibold text-white">Approve</button>
          </li>
        ))}
      </ul>

      <h2 className={h2}>Orders</h2>
      <ul className="mt-4 space-y-3">
        {allOrders?.length === 0 && <li>None.</li>}
        {allOrders?.map((o) => (
          <li key={o._id} className="flex flex-wrap items-center justify-between gap-3 rounded-card bg-white p-4 shadow-soft">
            <span>{new Date(o.createdAt).toLocaleDateString("en-US")} · {o.email} · ${(o.totalCents / 100).toFixed(2)}</span>
            <label className="text-sm font-semibold">
              Status{" "}
              <select value={o.status} onChange={(e) => doStatus({ id: o._id, status: e.target.value })} className="rounded border border-navy/25 p-1">
                {STATUSES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </label>
          </li>
        ))}
      </ul>
    </>
  );
}
