'use client';
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }, reset: () => void }) {
  return (
    <html>
      <body>
        <div className="p-4 flex flex-col items-center">
          <h2>Критична помилка</h2>
          <button onClick={() => reset()}>Спробувати знову</button>
        </div>
      </body>
    </html>
  );
}
