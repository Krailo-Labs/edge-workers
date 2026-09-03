'use client';
export default function Error({ error, reset }: { error: Error & { digest?: string }, reset: () => void }) {
  return (
    <div className="p-4 flex flex-col items-center">
      <h2>Сталася помилка</h2>
      <button onClick={() => reset()}>Спробувати знову</button>
    </div>
  );
}
