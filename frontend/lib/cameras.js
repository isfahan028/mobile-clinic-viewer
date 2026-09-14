// Single source of truth for which vehicles/cameras exist and which
// MediaMTX path each one streams on. Today this is a static list; once
// there's more than one vehicle in the field, swap this for a fetch from
// an API/database instead (the rest of the app doesn't need to change —
// every page just calls getCameras() / getCamera()).

const CAMERAS = [
  {
    id: 'cam1',
    path: 'cam1',
    vehicleName: 'รถตรวจ 1',
    label: 'กล้องหลัก',
  },
];

export function getCameras() {
  return CAMERAS;
}

export function getCamera(id) {
  return CAMERAS.find((cam) => cam.id === id) ?? null;
}
