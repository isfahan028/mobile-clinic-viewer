import Link from 'next/link';
import { getVehicles } from '@/lib/vtrack';

export const dynamic = 'force-dynamic'; // always fetch live vehicle/online status

export default async function HomePage() {
  let vehicles = [];
  let error = null;
  try {
    vehicles = await getVehicles();
  } catch (e) {
    error = e.message;
  }

  const onlineCount = vehicles.filter((v) => v.online).length;

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="text-xl font-semibold text-neutral-100">Mobile Clinic Viewer</h1>
      <p className="mt-1 text-sm text-neutral-400">
        เลือกรถที่ต้องการดูวิดีโอสด{' '}
        {!error && (
          <span className="text-neutral-500">
            ({onlineCount} ออนไลน์ / {vehicles.length} คัน)
          </span>
        )}
      </p>

      {error && (
        <div className="mt-6 rounded-lg border border-red-900 bg-red-950/50 p-4 text-sm text-red-300">
          โหลดรายการรถไม่สำเร็จ: {error}
        </div>
      )}

      <div className="mt-6 flex flex-col gap-3">
        {vehicles.map((v) => {
          const card = (
            <div
              className={`flex items-center justify-between rounded-lg p-4 ${
                v.online
                  ? 'bg-neutral-900 text-neutral-100 hover:bg-neutral-800'
                  : 'bg-neutral-900/50 text-neutral-500'
              }`}
            >
              <div>
                <div className="font-medium">{v.name}</div>
                <div className="text-sm text-neutral-500">
                  {v.channelCount} ช่อง · device {v.deviceNo ?? '-'}
                </div>
              </div>
              <span className="flex items-center gap-2 text-sm">
                <span
                  className={`inline-block h-2.5 w-2.5 rounded-full ${
                    v.online ? 'bg-emerald-500' : 'bg-neutral-600'
                  }`}
                />
                {v.online ? 'ออนไลน์' : 'ออฟไลน์'}
              </span>
            </div>
          );

          // Only online vehicles can be viewed; offline ones render as a dimmed, non-clickable card.
          return v.online ? (
            <Link key={v.id} href={`/viewer/${v.id}`}>
              {card}
            </Link>
          ) : (
            <div key={v.id}>{card}</div>
          );
        })}
      </div>
    </main>
  );
}
