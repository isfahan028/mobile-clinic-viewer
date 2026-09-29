import 'server-only';

// Server-only client for the V-Track / CMSV6 vehicle-video cloud platform
// (JT/T 808 + 1078). Credentials live in the environment and are read only
// here on the server — they are never sent to the browser. The browser only
// ever receives a jsession (a short-lived view token) embedded in the player
// iframe URL.
//
// Env:
//   VTRACK_BASE  base URL of the platform      (default http://103.233.193.79)
//   VTRACK_USER  account name
//   VTRACK_PASS  account password

const BASE = (process.env.VTRACK_BASE || 'http://103.233.193.79').replace(/\/+$/, '');
const USER = process.env.VTRACK_USER;
const PASS = process.env.VTRACK_PASS;

// From the API doc's error-code table — turns a bare number into something readable.
const ERRORS = {
  1: 'username or password incorrect',
  2: 'username or password incorrect',
  3: 'user disabled',
  4: 'user expired',
  5: 'session expired',
  6: 'system exception',
  7: 'request parameter incorrect',
  13: 'no operating authority',
};

// Re-use one login across requests; re-login proactively before the ~30min
// server session lapses, and reactively if any call returns result:5.
let sessionCache = { jsession: null, at: 0 };
const SESSION_TTL_MS = 25 * 60 * 1000;

function apiUrl(action, params) {
  const url = new URL(`${BASE}/StandardApiAction_${action}.action`);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
  }
  return url;
}

async function rawGet(action, params) {
  const res = await fetch(apiUrl(action, params), { cache: 'no-store' });
  if (!res.ok) throw new Error(`${action}: HTTP ${res.status}`);
  return res.json();
}

async function login() {
  if (!USER || !PASS) {
    throw new Error('VTRACK_USER / VTRACK_PASS are not set (see frontend/.env.example)');
  }
  const json = await rawGet('login', { account: USER, password: PASS });
  if (json.result !== 0 || !json.jsession) {
    throw new Error(`login failed: result=${json.result} (${ERRORS[json.result] || 'see API doc'})`);
  }
  sessionCache = { jsession: json.jsession, at: Date.now() };
  return json.jsession;
}

export async function getSession() {
  if (sessionCache.jsession && Date.now() - sessionCache.at < SESSION_TTL_MS) {
    return sessionCache.jsession;
  }
  return login();
}

// Call an authenticated action; if the session expired mid-flight, re-login once and retry.
async function authedGet(action, params) {
  let jsession = await getSession();
  let json = await rawGet(action, { ...params, jsession });
  if (json.result === 5) {
    jsession = await login();
    json = await rawGet(action, { ...params, jsession });
  }
  if (json.result !== 0) {
    throw new Error(`${action} failed: result=${json.result} (${ERRORS[json.result] || 'see API doc'})`);
  }
  return json;
}

// Returns the vehicles this account can see, each flattened to what the UI needs,
// with a live online flag merged in.
export async function getVehicles() {
  const [vehData, onlineData] = await Promise.all([
    authedGet('queryUserVehicle', { language: 'en' }),
    authedGet('getDeviceOlStatus', {}),
  ]);
  const onlineByDev = new Map((onlineData.onlines || []).map((o) => [o.did, o.online === 1]));

  return (vehData.vehicles || []).map((v) => {
    const dev = (v.dl || [])[0] || {};
    return {
      id: v.id, // internal vehicle id, used as the route param
      name: v.nm,
      deviceNo: dev.id ?? null, // device number that goes into the player URL
      channelCount: dev.cc ?? 0,
      channelNames: (dev.cn || '').split(',').filter(Boolean),
      online: dev.id ? onlineByDev.get(dev.id) ?? false : false,
    };
  });
}

export async function getVehicle(id) {
  const vehicles = await getVehicles();
  return vehicles.find((v) => String(v.id) === String(id)) ?? null;
}

// Build the platform's ready-made live-video player page URL for one device.
// View-only: we never pass talk/mic params (professor's instruction).
export function buildPlayerUrl(deviceNo, jsession, { channel } = {}) {
  const url = new URL(`${BASE}/808gps/open/player/video.html`);
  url.searchParams.set('lang', 'en');
  url.searchParams.set('devIdno', deviceNo);
  url.searchParams.set('sessid', jsession);
  if (channel != null) url.searchParams.set('channel', String(channel));
  return url.toString();
}
