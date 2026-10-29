"use client";

import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from "react";
import { usePathname } from "next/navigation";

type Ctx = { ready: boolean; skipMotion: boolean; setReady: (instant: boolean) => void };
const HeroReadyContext = createContext<Ctx>({ ready: true, skipMotion: false, setReady: () => {} });

/** Single source of truth for "video 2 has started, reveal the content". Non-home routes are always ready. */
export function HeroReadyProvider({ children }: { children: ReactNode }) {
  const onHome = usePathname() === "/";
  const [state, setState] = useState({ ready: false, skipMotion: false });
  const setReady = useCallback((instant: boolean) => setState({ ready: true, skipMotion: instant }), []);
  const value = useMemo(
    () => ({ ready: !onHome || state.ready, skipMotion: !onHome || state.skipMotion, setReady }),
    [onHome, state, setReady]
  );
  return <HeroReadyContext.Provider value={value}>{children}</HeroReadyContext.Provider>;
}

export const useHeroReady = () => useContext(HeroReadyContext);
