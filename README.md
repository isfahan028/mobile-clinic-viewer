# Mobile Clinic Viewer (prototype)

Web app that lets a doctor watch a real-time video feed from the camera/NVR
inside the mobile patient-screening vehicle, without needing to be in the
vehicle.

## How it works

Browsers cannot play an RTSP stream directly (RTSP is what almost all
IP cameras and NVRs speak). So there needs to be a relay in the middle that
speaks RTSP on one side and WebRTC (which browsers *can* play, with sub-second
latency) on the other.

```
[Camera / NVR]  --RTSP-->  [MediaMTX relay]  --WebRTC-->  [Doctor's browser]
```

This repo runs [MediaMTX](https://github.com/bluenviron/mediamtx) (open
source, self-hosted) as that relay, plus a minimal static web page
([web/viewer.html](web/viewer.html)) that pulls the stream via WebRTC (WHEP)
and displays it.

**Why this approach:** almost every NVR/IP camera (Hikvision, Dahua, and
most others) exposes an RTSP URL, so this doesn't depend on knowing the exact
camera model yet. Once we get the real RTSP URL from the sensor team, we
only change one line in `mediamtx.yml` — nothing else in this repo needs to
change.

## Prototype mode (no real camera yet)

Since we don't have the NVR's RTSP URL yet, `mediamtx.yml` currently accepts
a stream pushed in from a browser instead, so the whole pipeline can be
tested end-to-end using a laptop webcam as a stand-in for the vehicle's
camera.

1. Download the MediaMTX Windows binary (not committed to the repo — it's a
   ~56 MB executable) from
   https://github.com/bluenviron/mediamtx/releases/latest (grab the
   `windows_amd64.zip`), extract it into `mediamtx_bin/` at the project
   root, then start the relay with our config:
   ```powershell
   .\mediamtx_bin\mediamtx.exe mediamtx.yml
   ```
   A `docker-compose.yml` is also included as an alternative for later
   deployment on a Linux server.
2. Serve the web pages (any static file server works — for convenience, from
   this folder):
   ```bash
   python -m http.server 5500 --directory web
   ```
3. Open two browser tabs:
   - `http://localhost:5500/publish-test.html` — click "เริ่ม Publish", allow
     camera access. This simulates the vehicle's camera. (If no camera is
     available — e.g. denied permission, no webcam, or a sandboxed browser —
     it automatically falls back to a synthetic animated test pattern
     instead, so the rest of the pipeline can still be verified.)
   - `http://localhost:5500/viewer.html` — this is the doctor's screen. It
     should show the webcam feed live within ~1 second.

## Switching to the real camera

Once we have the NVR/camera's RTSP URL (ask the sensor team — it usually
looks like `rtsp://user:pass@192.168.x.x:554/stream1`, found in the NVR's
network/RTSP settings, or supplied by whoever installed it):

1. Open [mediamtx.yml](mediamtx.yml) and add under `paths: cam1:`:
   ```yaml
   source: rtsp://<user>:<password>@<nvr-ip>:554/<stream-path>
   ```
2. `docker compose restart mediamtx`
3. `publish-test.html` is no longer needed — `viewer.html` will now show the
   real camera, since it pulls from the same `cam1` path either way.

## Open questions to confirm with the professor / sensor team

- Exact RTSP URL / credentials for the NVR (or confirm it doesn't support
  RTSP, in which case we'd need its vendor SDK instead — different from this
  plan).
- Where will the doctor actually be relative to the vehicle:
  - **Same local network** (e.g. parked at a clinic/hospital campus with
    shared WiFi) — this setup works as-is on the local network.
  - **Remote, over the internet** (doctor elsewhere, vehicle on
    cellular/4G-5G) — the MediaMTX relay needs to run somewhere with a public
    address (a small cloud VPS) instead of on a laptop, and the vehicle needs
    a stable internet connection to push its stream to it. Same software,
    different deployment target.
- Does the doctor need two-way audio/video (telemedicine-style call) or just
  one-way viewing? This prototype is one-way (camera → doctor). Two-way is a
  straightforward extension of the same WebRTC approach if needed.
