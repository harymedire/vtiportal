"use client";

import { useEffect } from "react";

type Props = { id: number };

declare global {
  interface Window {
    ezstandalone?: {
      cmd: Array<() => void>;
      showAds: (...ids: number[]) => void;
    };
  }
}

export default function EzoicAd({ id }: Props) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.ezstandalone = window.ezstandalone || { cmd: [], showAds: () => {} };
    window.ezstandalone.cmd = window.ezstandalone.cmd || [];
    window.ezstandalone.cmd.push(() => {
      window.ezstandalone?.showAds(id);
    });
  }, [id]);

  return <div id={`ezoic-pub-ad-placeholder-${id}`} />;
}
