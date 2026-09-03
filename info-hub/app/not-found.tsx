import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h2 className="text-2xl font-bold mb-4">404 - Сторінку не знайдено</h2>
      <Link href="/" className="text-blue-500 hover:underline">
        Повернутися на головну
      </Link>
    </div>
  );
}
