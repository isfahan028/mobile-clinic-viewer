import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getVehicle, getSession, buildPlayerUrl } from '@/lib/vtrack';
import PlayerFrame from '@/components/PlayerFrame';

export const dynamic = 'force-dynamic';

export default async function ViewerPage({ params }) {
  const { camId } = await params;
  const vehicle = await getVehicle(camId);
  if (!vehicle) notFound();

  const jsession = await getSession();
  const src = buildPlayerUrl(vehicle.deviceNo, jsession);

  return (
    <main className="mx-auto max-w-4xl p-6">
      <Link href="/" className="text-sm text-neutral-400 hover:text-neutral-200">
        &larr; กลับไปเลือกรถ
      </Link>
      <h1 className="mt-2 text-xl font-semibold text-neutral-100">
        {vehicle.name}
        <span className="ml-2 align-middle text-sm font-normal text-emerald-400">● สด</span>
      </h1>
      <p className="mt-1 text-sm text-neutral-500">
        {vehicle.channelCount} ช่อง · device {vehicle.deviceNo}
      </p>

      <div className="mt-4">
        <PlayerFrame src={src} title={`วิดีโอสด ${vehicle.name}`} />
      </div>
    </main>
  );
}
