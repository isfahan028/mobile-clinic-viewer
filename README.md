# Mobile Clinic Viewer

Web app that lets a doctor watch the real-time video feed from the camera
inside a mobile patient-screening vehicle, without being in the vehicle.

## How it works

The vehicle's MDVR/camera streams over 4G to a **CMSV6-style vehicle-video
cloud platform** ("V-Track", JT/T 808 + 1078) that the professor's team
already operates. That cloud handles ingest, storage, and — importantly —
serves a ready-made live-video player page. So this app does **not** need
any RTSP relay, MediaMTX, or a media server of its own: it is a thin,
doctor-friendly wrapper around the platform.

```
[MDVR/camera in vehicle] --4G / JT-1078--> [V-Track cloud] --HTTP API + player--> [this app] --> [doctor]
```

What this app adds on top of the platform:

- **Server-side login** — logs into the platform with one shared account
  (credentials stay on the server, never in the browser) and reuses the
  session token, re-logging in when it expires. See `frontend/lib/vtrack.js`.
- **Vehicle picker** (`/`) — lists the vehicles the account can see with a
  live online/offline indicator; only online vehicles are viewable.
- **Viewer** (`/viewer/[id]`) — embeds the platform's live player for the
  chosen vehicle, with a fullscreen toggle. View-only: no mic/talkback.

## Running it locally

1. Install deps and set credentials:
   ```bash
   cd frontend
   npm install
   cp .env.example .env.local   # then fill in VTRACK_USER / VTRACK_PASS
   ```
   `.env.local` is gitignored — never commit real credentials.
2. Start the dev server:
   ```bash
   npm run dev
   ```
3. Open `http://localhost:3000/` — pick an online vehicle to watch it live.

## Environment variables (`frontend/.env.local`)

| var          | meaning                                   |
| ------------ | ----------------------------------------- |
| `VTRACK_BASE`| platform base URL (e.g. `http://103.233.193.79`) |
| `VTRACK_USER`| account name                              |
| `VTRACK_PASS`| account password                          |

These are read server-side only. Do **not** prefix them with `NEXT_PUBLIC_`
or they would be exposed in the browser bundle.

## Known constraints / open items

- **Mixed content on HTTPS deploy**: the platform's player page is served
  over plain `http://`. If this app is deployed over `https://` (e.g.
  Vercel), browsers will block the `http://` iframe. Needs the platform to
  offer `https`, or a same-origin proxy, before a production HTTPS deploy.
  Works fine over local `http://localhost`.
- **Doctor login / who provisions accounts** — not built yet; needs a
  decision with the professor (staff-provisioned vs. self-register).
- **PDPA / patient consent & whether video must be recorded** — this project
  has a real deployment plan, so these need to be confirmed with the
  professor early, before they force a redesign.
- **The real clinic vehicle** isn't in the demo account's vehicle list yet;
  it will use the same flow once added to the platform.

## Reference

- Platform API doc (image-only PDF): `V-Track API Document for dev.pdf`.
  Key endpoints used: `StandardApiAction_login`, `_queryUserVehicle`,
  `_getDeviceOlStatus`; live player at `/808gps/open/player/video.html`.
