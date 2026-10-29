"use client";

import Link from "next/link";
import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { HAS_CLERK } from "@/lib/env";
import { UserIcon } from "./Icons";

const btn = "grid h-10 w-10 place-items-center rounded-full hover:bg-white/10";

export default function AccountMenu() {
  if (!HAS_CLERK) {
    return (
      <Link href="/account" aria-label="Account" className={btn}>
        <UserIcon />
      </Link>
    );
  }
  return (
    <>
      <Show when="signed-out">
        <SignInButton mode="modal">
          <button aria-label="Sign in" className={btn}>
            <UserIcon />
          </button>
        </SignInButton>
        <SignUpButton mode="modal">
          <button className="ml-1 hidden rounded-full bg-white px-4 py-2 text-sm font-bold text-navy hover:bg-sky sm:block">Sign up</button>
        </SignUpButton>
      </Show>
      <Show when="signed-in">
        <UserButton />
      </Show>
    </>
  );
}
