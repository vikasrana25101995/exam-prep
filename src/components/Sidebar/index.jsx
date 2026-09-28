'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Logo from '@/components/Logo';
import { APP_NAME } from '@/constants';
import { logoutAction } from '@/modules/auth/action';
import s from './style/index.module.scss';

const icon = (d) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>
);

const NAV = [
  { href: '/dashboard', label: 'Dashboard', d: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z' },
  { href: '/tests', label: 'Take a test', d: 'M7 3h10v18H7zM10 8h4M10 12h4M10 16h2', student: true },
  { href: '/dashboard#recent', label: 'Mock history', d: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7v5l3 2', student: true },
  { href: '/admin', label: 'Admin', d: 'M12 3l8 4v5c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V7z', admin: true },
  { href: '/admin/users', label: 'Students', d: 'M16 19v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1M9 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6M22 19v-1a4 4 0 0 0-3-3.9M16 4.1a3 3 0 0 1 0 5.8', admin: true },
];

export default function AppShell({ user, children }) {
  const path = usePathname();
  const nav = NAV.filter((n) => (user.role === 'admin' ? !n.student : !n.admin));
  // Most specific match wins, so /admin/users lights up Students, not Admin.
  const active = nav.map((n) => n.href).filter((h) => path === h || path.startsWith(`${h}/`)).sort((a, b) => b.length - a.length)[0];
  return (
    <div className={s.shell}>
      <aside className={s.side}>
        <Link href="/dashboard" className={s.brand}><Logo /> {APP_NAME}</Link>
        <nav className={s.nav}>
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className={n.href === active ? s.active : undefined} aria-label={n.label}>
              {icon(n.d)}<span>{n.label}</span>
            </Link>
          ))}
        </nav>
        <form action={logoutAction} className={s.logout}>
          <button aria-label="Log out">{icon('M10 17l-5-5 5-5M5 12h11M14 4h5v16h-5')}<span>Log out</span></button>
        </form>
      </aside>
      <div className={s.content}>{children}</div>
    </div>
  );
}
