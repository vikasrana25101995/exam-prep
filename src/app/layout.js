import { Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import { APP_NAME } from '@/constants';
import './globals.scss';

const jakarta = Plus_Jakarta_Sans({ variable: '--font-jakarta', subsets: ['latin'] });
const jetbrains = JetBrains_Mono({ variable: '--font-jetbrains', subsets: ['latin'] });

export const metadata = {
  title: APP_NAME,
  description: 'Full-length mock tests with section-wise analysis.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${jakarta.variable} ${jetbrains.variable}`}>
      {/* Extensions like ColorZilla add attributes to <body> before hydration. */}
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
