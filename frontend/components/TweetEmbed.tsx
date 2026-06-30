"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    twttr?: { widgets?: { load: (el?: HTMLElement | null) => void } };
  }
}

const SCRIPT_ID = "twitter-widgets-js";

// Renderuje X (Twitter) objavu — uključujući video — preko zvaničnog widgeta.
export default function TweetEmbed({ url }: { url: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const render = () => window.twttr?.widgets?.load(ref.current);

    if (window.twttr?.widgets) {
      render();
      return;
    }
    let script = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (script) {
      script.addEventListener("load", render);
      return () => script?.removeEventListener("load", render);
    }
    script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = "https://platform.twitter.com/widgets.js";
    script.async = true;
    script.addEventListener("load", render);
    document.body.appendChild(script);
  }, [url]);

  return (
    <div
      ref={ref}
      className="media-embed media-embed-twitter"
      style={{ margin: "24px auto", maxWidth: 550 }}
    >
      <blockquote className="twitter-tweet" data-dnt="true" data-lang="bs">
        <a href={url}>Pogledaj objavu na X</a>
      </blockquote>
    </div>
  );
}
