import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getCamera } from '@/lib/cameras';
import VideoPlayer from '@/components/VideoPlayer';

export default async function ViewerPage({ params }) {
  const { camId } = await params;
  const camera = getCamera(camId);
  if (!camera) notFound();

  return (
    <main className="mx-auto max-w-3xl p-6">
      <Link href="/" className="text-sm text-neutral-400 hover:text-neutral-200">
        &larr; กลับไปเลือกรถ/กล้อง
      </Link>
      <h1 className="mt-2 text-xl font-semibold text-neutral-100">
        {camera.vehicleName} — {camera.label}
      </h1>
      <div className="mt-4">
        <VideoPlayer path={camera.path} />
      </div>
    </main>
  );
}
