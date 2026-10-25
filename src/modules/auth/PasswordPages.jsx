'use client';
import Link from 'next/link';
import Logo from '@/components/Logo';
import { APP_NAME } from '@/constants';
import { changePasswordAction, requestPasswordResetAction, resetPasswordAction } from './action';
import { MIN_PASSWORD } from './constants';
import { usePasswordForm } from './hooks';
import s from './style/index.module.scss';

function Solo({ children }) {
  return (
    <main className={s.solo}>
      <div className={s.brand}><Logo /> {APP_NAME}</div>
      {children}
    </main>
  );
}

// New password + confirmation, shared by reset and change.
function NewPasswordFields() {
  return (
    <>
      <div className={s.gap} />
      <label className={s.label} htmlFor="password">New password</label>
      <input id="password" name="password" type="password" className={s.input} autoComplete="new-password" minLength={MIN_PASSWORD} maxLength={72} required />
      <p className={s.hint}>At least {MIN_PASSWORD} characters.</p>
      <div className={s.gap} />
      <label className={s.label} htmlFor="confirm">Confirm new password</label>
      <input id="confirm" name="confirm" type="password" className={s.input} autoComplete="new-password" minLength={MIN_PASSWORD} maxLength={72} required />
      <div className={s.gap} />
    </>
  );
}

export function ForgotPassword({ expired }) {
  const { state, formAction, pending } = usePasswordForm(requestPasswordResetAction);
  return (
    <Solo>
      <form action={formAction} className={s.card}>
        <h2 className={s.title}>Forgot password</h2>
        <p className={s.sub}>Enter your email and we’ll send you a link to set a new password.</p>
        {expired && !state.sent && <p className={s.error} role="alert">That reset link is invalid or has expired. Request a new one.</p>}
        {state.sent ? (
          <p className={s.success} role="status">
            If an account exists for <strong>{state.email}</strong>, a reset link is on its way. Check your inbox and spam folder. The link works once and expires after an hour.
          </p>
        ) : (
          <>
            <label className={s.label} htmlFor="email">Email</label>
            <input id="email" name="email" type="email" className={s.input} placeholder="you@example.com" autoComplete="username" defaultValue={state.email} required />
            <div className={s.gap} />
            {state.error && <p className={s.error} role="alert">{state.error}</p>}
            <button className={s.primary} disabled={pending}>{pending ? 'Sending…' : 'Send reset link'}</button>
          </>
        )}
        <p className={s.back}><Link href="/login" className={s.link}>Back to log in</Link></p>
      </form>
    </Solo>
  );
}

// valid: the email link signed the user in. Without it the page only offers a new link.
export function ResetPassword({ valid }) {
  const { state, formAction, pending } = usePasswordForm(resetPasswordAction);
  return (
    <Solo>
      <form action={formAction} className={s.card}>
        <h2 className={s.title}>Set a new password</h2>
        {state.done ? (
          <>
            <p className={s.success} role="status">Your password has been changed. You’re logged in.</p>
            <Link href="/dashboard" className={`${s.primary} ${s.linkBtn}`}>Go to dashboard</Link>
          </>
        ) : !valid ? (
          <>
            <p className={s.error} role="alert">This page needs a valid reset link from your email.</p>
            <Link href="/forgot-password" className={s.link}>Request a new link</Link>
          </>
        ) : (
          <>
            <p className={s.sub}>Choose a new password for your account.</p>
            <NewPasswordFields />
            {state.error && <p className={s.error} role="alert">{state.error}</p>}
            <button className={s.primary} disabled={pending}>{pending ? 'Saving…' : 'Save new password'}</button>
          </>
        )}
      </form>
    </Solo>
  );
}

// Inside the app (sidebar → Change password).
export function ChangePassword() {
  const { state, formAction, pending } = usePasswordForm(changePasswordAction);
  return (
    <div className={s.inApp}>
      <form action={formAction} className={s.card} key={state.done ? 'done' : 'form'}>
        <h2 className={s.title}>Change password</h2>
        <p className={s.sub}>Enter your current password, then the new one.</p>
        {state.done && <p className={s.success} role="status">Password changed. Use it next time you log in.</p>}
        <label className={s.label} htmlFor="current">Current password</label>
        <input id="current" name="current" type="password" className={s.input} autoComplete="current-password" required />
        <NewPasswordFields />
        {state.error && <p className={s.error} role="alert">{state.error}</p>}
        <button className={s.primary} disabled={pending}>{pending ? 'Saving…' : 'Change password'}</button>
        <p className={s.back}><Link href="/forgot-password" className={s.link}>Forgot your current password?</Link></p>
      </form>
    </div>
  );
}
