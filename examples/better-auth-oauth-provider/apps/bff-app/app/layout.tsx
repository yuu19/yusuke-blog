import type { Metadata } from 'next';
import './styles.css';

export const metadata: Metadata = {
  title: 'Cloud Notes BFF',
  description: 'OAuth tokenをブラウザへ渡さないNext.js + Hono BFF',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ja"><body>{children}</body></html>;
}
