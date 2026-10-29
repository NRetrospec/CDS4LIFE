"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import type { ComponentType } from "react";
import { BOTTLE_ART } from "@/lib/catalog";
import type { BottleViewerProps } from "./BottleViewerImpl";

function Placeholder({ productId }: { productId: string }) {
  const art = BOTTLE_ART[productId];
  return (
    <div className="relative mx-auto aspect-[1/1.16] max-h-[78svh] w-full">
      {art && (
        <Image
          src={`/bottles/${productId}@2x.webp`}
          alt={art.alt}
          width={art.w}
          height={art.h}
          priority
          className="absolute inset-0 m-auto h-[88%] w-auto object-contain"
        />
      )}
    </div>
  );
}

/**
 * three.js lives only behind these dynamic imports, so it is split out of every non-product route.
 * `loading` is the static bottle image, which is server-rendered: it is the LCP element and the no-JS view.
 */
const IMPLS: Record<string, ComponentType<BottleViewerProps>> = Object.fromEntries(
  Object.keys(BOTTLE_ART).map((id) => [
    id,
    dynamic(() => import("./BottleViewerImpl"), { ssr: false, loading: () => <Placeholder productId={id} /> }),
  ])
);
const Generic = dynamic(() => import("./BottleViewerImpl"), { ssr: false, loading: () => null });

export default function BottleViewer(props: BottleViewerProps) {
  const Impl = IMPLS[props.productId] ?? Generic;
  return <Impl {...props} />;
}
