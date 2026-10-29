import type { Metadata } from "next";
import AccountTabs from "@/components/site/AccountTabs";
import { HAS_CLERK } from "@/lib/env";

export const metadata: Metadata = { title: "Account" };

export default function AccountPage() {
  return (
    <>
      <h1 className="font-display text-4xl font-extrabold uppercase tracking-tight md:text-5xl">Account</h1>
      {HAS_CLERK ? <AccountTabs /> : <p className="mt-6 text-lg">Accounts are not switched on for this environment yet.</p>}
    </>
  );
}
