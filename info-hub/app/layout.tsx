import type {Metadata} from 'next';
import './globals.css';
import { AppLayout } from '@/features/layout/AppLayout';

export const metadata: Metadata = {
  title: 'InfoHub',
  description: "Інфо-хаб, де інформація є базовою одиницею, а типи, теми, стани, зрілість, призначення та зв'язки формують її структуру.",
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="uk">
      <body suppressHydrationWarning>
        <AppLayout>
          {children}
        </AppLayout>
      </body>
    </html>
  );
}
