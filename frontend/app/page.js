import Link from 'next/link';
import { getCameras } from '@/lib/cameras';

export default function HomePage() {
  const cameras = getCameras();

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="text-xl font-semibold text-neutral-100">Mobile Clinic Viewer</h1>
      <p className="mt-1 text-sm text-neutral-400">เลือกรถ/กล้องที่ต้องการดู</p>

      <div className="mt-6 flex flex-col gap-3">
        {cameras.map((cam) => (
          <Link
            key={cam.id}
            href={`/viewer/${cam.id}`}
            className="rounded-lg bg-neutral-900 p-4 text-neutral-100 hover:bg-neutral-800"
          >
            <div className="font-medium">{cam.vehicleName}</div>
            <div className="text-sm text-neutral-400">{cam.label}</div>
          </Link>
        ))}
      </div>
    </main>
  );
}
