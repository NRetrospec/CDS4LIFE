"use client";

import { ReactNode, useMemo } from "react";
import { ConvexReactClient, ConvexProvider } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { useAuth } from "@clerk/nextjs";
import { HAS_CLERK, HAS_CONVEX } from "@/lib/env";

function useClient() {
  return useMemo(() => new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!), []);
}

function WithClerk({ children }: { children: ReactNode }) {
  const client = useClient();
  return (
    <ConvexProviderWithClerk client={client} useAuth={useAuth}>
      {children}
    </ConvexProviderWithClerk>
  );
}

function Anonymous({ children }: { children: ReactNode }) {
  const client = useClient();
  return <ConvexProvider client={client}>{children}</ConvexProvider>;
}

export default function ConvexClientProvider({ children }: { children: ReactNode }) {
  if (!HAS_CONVEX) return <>{children}</>;
  return HAS_CLERK ? <WithClerk>{children}</WithClerk> : <Anonymous>{children}</Anonymous>;
}
