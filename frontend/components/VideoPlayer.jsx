'use client';

import { useEffect, useRef, useState } from 'react';
import { useWhepPlayer } from '@/lib/useWhepPlayer';

const statusColor = {
  connecting: 'text-sky-400',
  connected: 'text-emerald-400',
  error: 'text-red-400',
};

export default function VideoPlayer({ path }) {
  const videoRef = useRef(null);
  const wrapRef = useRef(null);
  const { state, message, reconnect } = useWhepPlayer(path, videoRef);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    function handleFullscreenChange() {
      setIsFullscreen(Boolean(document.fullscreenElement));
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
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
    <div>
      <div
        ref={wrapRef}
        className="relative aspect-video w-full overflow-hidden rounded-lg bg-black [&:fullscreen]:flex [&:fullscreen]:items-center [&:fullscreen]:justify-center"
      >
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="h-full w-full object-contain"
        />
        <button
          onClick={toggleFullscreen}
          aria-label="เต็มจอ"
          title="เต็มจอ"
          className="absolute bottom-2.5 right-2.5 flex h-10 w-10 items-center justify-center rounded-md bg-black/55 text-white hover:bg-black/80"
        >
          {isFullscreen ? <CompressIcon /> : <ExpandIcon />}
        </button>
      </div>
      <div className={`mt-3 text-sm ${statusColor[state]}`}>{message}</div>
      <button
        onClick={reconnect}
        className="mt-3 rounded-md bg-neutral-200 px-4 py-2 text-sm text-neutral-900 hover:bg-white"
      >
        เชื่อมต่อใหม่
      </button>
    </div>
  );
}

function ExpandIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M8 3H5a2 2 0 0 0-2 2v3" />
      <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
      <path d="M3 16v3a2 2 0 0 0 2 2h3" />
      <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
    </svg>
  );
}

function CompressIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M8 3v3a2 2 0 0 1-2 2H3" />
      <path d="M21 8h-3a2 2 0 0 1-2-2V3" />
      <path d="M3 16h3a2 2 0 0 1 2 2v3" />
      <path d="M16 21v-3a2 2 0 0 1 2-2h3" />
    </svg>
  );
}
