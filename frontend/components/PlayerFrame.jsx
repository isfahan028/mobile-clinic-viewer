'use client';

import { useEffect, useRef, useState } from 'react';

// Wraps the platform's live-video player page in an iframe and adds a
// YouTube-style fullscreen toggle over it. View-only — no mic/talk controls
// are surfaced by us.
export default function PlayerFrame({ src, title }) {
  const wrapRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    function onChange() {
      setIsFullscreen(Boolean(document.fullscreenElement));
    }
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  async function toggleFullscreen() {
    if (!wrapRef.current) return;
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else {
      await wrapRef.current.requestFullscreen();
    }
  }

  return (
    <div
      ref={wrapRef}
      className="relative aspect-video w-full overflow-hidden rounded-lg bg-black [&:fullscreen]:rounded-none"
    >
      <iframe
        src={src}
        title={title}
        className="h-full w-full border-0"
        allow="fullscreen"
      />
      <button
        onClick={toggleFullscreen}
        aria-label="เต็มจอ"
        title="เต็มจอ"
        className="absolute bottom-2.5 right-2.5 flex h-10 w-10 items-center justify-center rounded-md bg-black/55 text-white hover:bg-black/80"
      >
        {isFullscreen ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
            <path d="M8 3v3a2 2 0 0 1-2 2H3" />
            <path d="M21 8h-3a2 2 0 0 1-2-2V3" />
            <path d="M3 16h3a2 2 0 0 1 2 2v3" />
            <path d="M16 21v-3a2 2 0 0 1 2-2h3" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
            <path d="M8 3H5a2 2 0 0 0-2 2v3" />
            <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
            <path d="M3 16v3a2 2 0 0 0 2 2h3" />
            <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
          </svg>
        )}
      </button>
    </div>
  );
}
