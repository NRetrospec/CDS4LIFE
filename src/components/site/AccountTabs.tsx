"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { makeFunctionReference } from "convex/server";
import { UserProfile } from "@clerk/nextjs";
import { HAS_CONVEX } from "@/lib/env";
import { formatPrice } from "@/lib/format";
import { wishlistList } from "./WishlistButton";

type Order = { _id: string; status: string; totalCents: number; createdAt: number; items: { name: string; qty: number }[] };
const ordersRef = makeFunctionReference<"query", Record<string, never>, Order[]>("orders:listMine");

function Orders() {
  const orders = useQuery(ordersRef, {});
  if (orders === undefined) return null;
  if (!orders.length) return <p className="text-lg">No orders yet.</p>;
  return (
    <ul className="divide-y divide-navy/15">
      {orders.map((o) => (
        <li key={o._id} className="py-4">
          <p className="font-bold">{new Date(o.createdAt).toLocaleDateString("en-US")} — {o.status}</p>
          <p>{o.items.map((i) => `${i.qty} × ${i.name}`).join(", ")}</p>
          <p className="font-semibold">{formatPrice(o.totalCents)}</p>
        </li>
      ))}
    </ul>
  );
}

function Wishlist() {
  const list = useQuery(wishlistList, {});
  if (list === undefined) return null;
  if (!list.length) return <p className="text-lg">Nothing saved yet.</p>;
  return (
    <ul className="space-y-3">
      {list.map((w) => (
        <li key={w.slug}>
          <a href={`/products/${w.slug}`} className="text-lg font-bold underline">{w.name}</a>
          <span className="ml-2 text-navy/70">{w.subtitle} · {w.volume}</span>
        </li>
      ))}
    </ul>
  );
}

const TABS = ["Profile", "Orders", "Wishlist"] as const;

export default function AccountTabs() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Profile");
  return (
    <div className="mt-8">
      <div role="tablist" aria-label="Account sections" className="flex gap-2">
        {TABS.map((t) => (
          <button
            key={t}
            role="tab"
            id={`tab-${t}`}
            aria-selected={tab === t}
            aria-controls={`panel-${t}`}
            onClick={() => setTab(t)}
            className="rounded-full border border-navy/25 px-5 py-2 text-sm font-semibold aria-selected:bg-navy aria-selected:text-white"
          >
            {t}
          </button>
        ))}
      </div>
      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} className="mt-8">
        {tab === "Profile" && <UserProfile routing="hash" />}
        {tab === "Orders" && (HAS_CONVEX ? <Orders /> : <p className="text-lg">No orders yet.</p>)}
        {tab === "Wishlist" && (HAS_CONVEX ? <Wishlist /> : <p className="text-lg">Nothing saved yet.</p>)}
      </div>
    </div>
  );
}
