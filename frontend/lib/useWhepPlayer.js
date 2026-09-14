'use client';

import { useEffect, useRef, useState } from 'react';

function whepBaseUrl() {
  if (process.env.NEXT_PUBLIC_MEDIAMTX_WHEP_URL) {
    return process.env.NEXT_PUBLIC_MEDIAMTX_WHEP_URL;
  }
  if (typeof window === 'undefined') return '';
  return `http://${window.location.hostname}:8889`;
}

function waitIceGatheringComplete(pc) {
  if (pc.iceGatheringState === 'complete') return Promise.resolve();
  return new Promise((resolve) => {
    function check() {
      if (pc.iceGatheringState === 'complete') {
        pc.removeEventListener('icegatheringstatechange', check);
        resolve();
      }
    }
    pc.addEventListener('icegatheringstatechange', check);
  });
}

// Connects a <video> ref to a MediaMTX path over WHEP (WebRTC playback).
// Returns connection status text/state and a reconnect() you can wire to a button.
export function useWhepPlayer(path, videoRef) {
  const [state, setState] = useState('connecting'); // connecting | connected | error
  const [message, setMessage] = useState('กำลังเชื่อมต่อ...');
  const pcRef = useRef(null);
  const [reconnectToken, setReconnectToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function connect() {
      if (pcRef.current) pcRef.current.close();
      setState('connecting');
      setMessage('กำลังเชื่อมต่อ...');

      const pc = new RTCPeerConnection();
      pcRef.current = pc;
      pc.addTransceiver('video', { direction: 'recvonly' });
      pc.addTransceiver('audio', { direction: 'recvonly' });

      pc.ontrack = (event) => {
        if (videoRef.current && videoRef.current.srcObject !== event.streams[0]) {
          videoRef.current.srcObject = event.streams[0];
        }
      };

      pc.onconnectionstatechange = () => {
        if (cancelled) return;
        if (pc.connectionState === 'connected') {
          setState('connected');
          setMessage('เชื่อมต่อแล้ว — สดจากรถตรวจ');
        } else if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
          setState('error');
          setMessage('การเชื่อมต่อขาดหาย กด "เชื่อมต่อใหม่"');
        }
      };

      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        await waitIceGatheringComplete(pc);
        if (cancelled) return;

        const res = await fetch(`${whepBaseUrl()}/${path}/whep`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/sdp' },
          body: pc.localDescription.sdp,
        });
        if (!res.ok) {
          throw new Error(
            res.status === 404
              ? 'ยังไม่มีสตรีมเข้ามา (กล้องยังไม่ได้เชื่อมต่อ)'
              : `WHEP POST failed: ${res.status}`
          );
        }
        const answerSdp = await res.text();
        if (cancelled) return;
        await pc.setRemoteDescription({ type: 'answer', sdp: answerSdp });
      } catch (err) {
        if (cancelled) return;
        setState('error');
        setMessage('เชื่อมต่อไม่สำเร็จ: ' + err.message);
      }
    }

    connect();

    return () => {
      cancelled = true;
      if (pcRef.current) pcRef.current.close();
    };
  }, [path, videoRef, reconnectToken]);

  const reconnect = () => setReconnectToken((n) => n + 1);

  return { state, message, reconnect };
}
