# Mobile Clinic Viewer (prototype)

Web app that lets a doctor watch a real-time video feed from the camera/NVR
inside the mobile patient-screening vehicle, without needing to be in the
vehicle. Built to grow into multiple vehicles/cameras with doctor login.

## How it works

Browsers cannot play an RTSP stream directly (RTSP is what almost all
IP cameras and NVRs speak). So there needs to be a relay in the middle that
speaks RTSP on one side and WebRTC (which browsers *can* play, with sub-second
latency) on the other.

```
[Camera / NVR]  --RTSP-->  [MediaMTX relay]  --WebRTC-->  [Doctor's browser]
```

This repo has two parts:

- **`mediamtx.yml` / `mediamtx_bin/`** — runs
  [MediaMTX](https://github.com/bluenviron/mediamtx) (open source,
  self-hosted) as that relay.
- **`frontend/`** — a Next.js app that's the doctor-facing website: pick a
  vehicle/camera, then watch its feed live with a fullscreen toggle
  (`/`, `/viewer/[camId]`, and a dev-only `/test-publisher` for testing
  without a real camera).

**Why this approach:** almost every NVR/IP camera (Hikvision, Dahua, and
most others) exposes an RTSP URL, so this doesn't depend on knowing the exact
camera model yet. Once we get the real RTSP URL from the sensor team, we
only change one line in `mediamtx.yml` — nothing else needs to change.

**Why Next.js:** the plan is to grow this into doctor login plus a picker
across multiple vehicles/cameras, which needs routing and (eventually)
server-side logic — Next.js covers that without switching frameworks later.
The camera list currently lives in `frontend/lib/cameras.js` as a hardcoded
array; that's the one place to swap for a real API/database call once there's
more than one vehicle.

## Running it

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
2. Start the Next.js app:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
3. Open two browser tabs:
   - `http://localhost:3000/test-publisher` — click "เริ่ม Publish", allow
     camera access. This simulates the vehicle's camera. (If no camera is
     available — e.g. denied permission, no webcam, or a sandboxed browser —
     it automatically falls back to a synthetic animated test pattern
     instead, so the rest of the pipeline can still be verified.)
   - `http://localhost:3000/viewer/cam1` (or just `http://localhost:3000/`
     and click the vehicle) — this is the doctor's screen. It should show
     the feed live within ~1 second, with a fullscreen button bottom-right
     of the video.

## Switching to the real camera

Once we have the NVR/camera's RTSP URL (ask the sensor team — it usually
looks like `rtsp://user:pass@192.168.x.x:554/stream1`, found in the NVR's
network/RTSP settings, or supplied by whoever installed it):

1. Open [mediamtx.yml](mediamtx.yml) and add under `paths: cam1:`:
   ```yaml
   source: rtsp://<user>:<password>@<nvr-ip>:554/<stream-path>
   ```
2. Restart `mediamtx.exe` (or `docker compose restart mediamtx`).
3. `/test-publisher` is no longer needed — `/viewer/cam1` will now show the
   real camera, since it pulls from the same MediaMTX path either way.

## Roadmap (agreed direction, not yet built)

- **Multiple vehicles/cameras**: add entries to `frontend/lib/cameras.js`
  (one MediaMTX `path:` per camera in `mediamtx.yml` too). Once there are
  more than a handful, or vehicles need to be added without a code deploy,
  move that list into a real database instead.
- **Doctor login**: not implemented yet — needs a decision on *who*
  provisions accounts (IT staff/admin creates logins for doctors, vs.
  doctors self-register) before building it, since that determines whether
  this needs an admin panel or just an auth provider. Worth deciding
  together with the professor.
- **Patient scheduling/records tie-in**: explicitly out of scope for now per
  the professor's brief — this is a camera viewer, not a booking system.
- **Deploying `frontend/` to Vercel**: holding off until the MediaMTX relay
  has a publicly reachable address — deploying the frontend alone now would
  render fine but fail to connect to any camera, since `NEXT_PUBLIC_MEDIAMTX_WHEP_URL`
  would have nothing real to point at yet.

## Open questions to confirm with the professor / sensor team

- ~~Does the camera/NVR support RTSP?~~ **Confirmed yes** (2026-09-14) — this
  plan holds. Still need the exact RTSP URL and credentials (ask the sensor
  team — see "Switching to the real camera" above for the expected format).
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
- Who is expected to log in / provision doctor accounts (see Roadmap above).
