'use client';
import Link from 'next/link';
import { useAddStudent, useToggleUser } from './hooks';
import s from './style/index.module.scss';

const pct = (n) => (n === null ? '—' : `${Math.round(n)}%`);

export function StatusBadge({ active }) {
  return <span className={`${s.badge} ${active ? s.badgeOn : s.badgeOff}`}>{active ? 'Active' : 'Deactivated'}</span>;
}

function AddStudent() {
  const a = useAddStudent();
  const c = a.state.created;
  return (
    <section className={s.card}>
      <h2>Add a student</h2>
      {/* key resets the input after each successful add */}
      <form action={a.formAction} className={s.addRow} key={c?.email}>
        <input name="email" type="email" required placeholder="student@email.com" aria-label="Student email" className={s.input} />
        <button className={s.primary} disabled={a.pending}>{a.pending ? 'Adding…' : 'Add student'}</button>
      </form>
      {a.state.error && <p className={s.errors} role="alert">{a.state.error}</p>}
      {c && (
        <div className={s.created} role="status">
          <p><strong>Account created.</strong> Share these login details with the student. The password is shown only once.</p>
          <dl>
            <dt>Login</dt><dd className="mono">{c.email}</dd>
            <dt>Password</dt><dd className="mono">{c.password}</dd>
          </dl>
          <button type="button" className={s.secondary} onClick={a.copy}>{a.copied ? 'Copied' : 'Copy details'}</button>
        </div>
      )}
    </section>
  );
}

export default function StudentsList({ students }) {
  const t = useToggleUser();
  const active = students.filter((u) => u.active).length;

  return (
    <main className={s.page}>
      <header className={s.head}>
        <div>
          <p className={s.kicker}>Admin</p>
          <h1>Students</h1>
        </div>
        <span className={s.muted}>{students.length} students · {active} active</span>
      </header>

      <AddStudent />

      <section className={s.card}>
        {students.length === 0 ? (
          <p className={s.muted}>No students yet. Add one above.</p>
        ) : (
          <div className={s.tableWrap}>
            <table className={s.table}>
              <thead>
                <tr><th>Student</th><th>Mocks taken</th><th>Avg score</th><th>Last mock</th><th>Status</th><th><span className={s.srOnly}>Actions</span></th></tr>
              </thead>
              <tbody>
                {students.map((u) => (
                  <tr key={u.id} className={u.active ? undefined : s.rowOff}>
                    <td><Link href={`/admin/users/${u.id}`} className={s.userLink}>{u.email}</Link></td>
                    <td className="mono">{u.attempts}</td>
                    <td className="mono">{pct(u.avgPct)}</td>
                    <td>{u.lastAt ? u.lastAt.slice(0, 10) : '—'}</td>
                    <td><StatusBadge active={u.active} /></td>
                    <td className={s.rowActions}>
                      <Link href={`/admin/users/${u.id}`}>View</Link>
                      <button type="button" onClick={() => t.toggle(u)} disabled={t.pending} className={u.active ? undefined : s.activate}>
                        {u.active ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
