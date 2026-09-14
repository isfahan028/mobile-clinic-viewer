'use client';

import { useRef, useState } from 'react';

function whipBaseUrl() {
  if (process.env.NEXT_PUBLIC_MEDIAMTX_WHEP_URL) {
    return process.env.NEXT_PUBLIC_MEDIAMTX_WHEP_URL;
  }
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

function makeSyntheticStream() {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 360;
  const ctx = canvas.getContext('2d');
  let angle = 0;
  setInterval(() => {
    angle += 0.05;
    ctx.fillStyle = '#0a2540';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const x = canvas.width / 2 + Math.cos(angle) * 200;
    const y = canvas.height / 2 + Math.sin(angle) * 100;
    ctx.fillStyle = '#4bd07a';
    ctx.beginPath();
    ctx.arc(x, y, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = '20px system-ui';
    ctx.fillText('SYNTHETIC TEST FEED — ' + new Date().toLocaleTimeString(), 16, 32);
  }, 40);
  return canvas.captureStream(25);
}

export default function TestPublisherPage() {
  const [path, setPath] = useState('cam1');
  const [status, setStatus] = useState('ยังไม่ได้เชื่อมต่อ');
  const [publishing, setPublishing] = useState(false);
  const videoRef = useRef(null);
  const pcRef = useRef(null);
  const streamRef = useRef(null);

  async function start() {
    setPublishing(true);
    try {
      let stream;
      try {
        setStatus('กำลังขอสิทธิ์กล้อง...');
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      } catch (camErr) {
        setStatus('เปิดกล้องไม่ได้ (' + camErr.message + ') — ใช้ภาพจำลองแทน');
        stream = makeSyntheticStream();
      }
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;

      const pc = new RTCPeerConnection();
      pcRef.current = pc;
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      await waitIceGatheringComplete(pc);

      setStatus('กำลังส่งสตรีมไปที่ MediaMTX (WHIP)...');
      const res = await fetch(`${whipBaseUrl()}/${path}/whip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/sdp' },
        body: pc.localDescription.sdp,
      });
      if (!res.ok) throw new Error(`WHIP POST failed: ${res.status} ${await res.text()}`);
      const answerSdp = await res.text();
      await pc.setRemoteDescription({ type: 'answer', sdp: answerSdp });

      setStatus(`กำลัง publish อยู่ ที่ path "${path}" — เปิด /viewer/${path} เพื่อดูสด`);
    } catch (err) {
      setStatus('เกิดข้อผิดพลาด: ' + err.message);
      setPublishing(false);
    }
  }

  function stop() {
    pcRef.current?.close();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    setPublishing(false);
    setStatus('หยุดแล้ว');
  }

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="text-lg font-semibold text-neutral-100">
        ตัวจำลองกล้อง (Publisher) — สำหรับทดสอบเท่านั้น
      </h1>
      <p className="mt-2 text-sm text-amber-400">
        หน้านี้ใช้ webcam ของเครื่องนี้ (หรือภาพจำลอง ถ้าไม่มีกล้อง/ไม่ได้รับสิทธิ์) แทนกล้อง NVR
        จริงในรถ เพื่อทดสอบว่า pipeline กล้อง → MediaMTX → เว็บหมอ ทำงานแบบ real-time ได้จริง
      </p>

      <label className="mt-4 block text-sm text-neutral-400">
        MediaMTX path ที่จะ publish ไป
        <input
          value={path}
          onChange={(e) => setPath(e.target.value)}
          disabled={publishing}
          className="mt-1 block w-full rounded-md bg-neutral-900 px-3 py-2 text-neutral-100"
        />
      </label>

      <video ref={videoRef} autoPlay muted playsInline className="mt-4 aspect-video w-full rounded-lg bg-black" />

      <div className="mt-4 flex gap-3">
        <button
          onClick={start}
          disabled={publishing}
          className="rounded-md bg-neutral-200 px-4 py-2 text-sm text-neutral-900 disabled:opacity-40"
        >
          เริ่ม Publish
        </button>
        <button
          onClick={stop}
          disabled={!publishing}
          className="rounded-md bg-neutral-700 px-4 py-2 text-sm text-neutral-100 disabled:opacity-40"
        >
          หยุด
        </button>
      </div>
      <div className="mt-3 text-sm text-sky-400">{status}</div>
    </main>
  );
}
