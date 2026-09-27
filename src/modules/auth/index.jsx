'use client';
import Logo from '@/components/Logo';
import { APP_NAME } from '@/constants';
import { HERO } from './constants';
import { useAuthForm } from './hooks';
import s from './style/index.module.scss';

export default function LoginPage() {
  const { mode, copy, toggleMode, state, formAction, pending } = useAuthForm();

  return (
    <main className={s.page}>
      <section className={s.hero}>
        <div className={s.brand}><Logo /> {APP_NAME}</div>
        <div className={s.heroBody}>
          <span className={s.tag}>{HERO.tag}</span>
          <h1 className={s.heroTitle}>{HERO.title[0]}<br />{HERO.title[1]}</h1>
          <p className={s.heroText}>{HERO.body}</p>
        </div>
        <ol className={s.steps}>
          {HERO.steps.map((step, i) => (
            <li key={step} className={s.step}>
              <span className="mono">{String(i + 1).padStart(2, '0')}</span>
              {step}
            </li>
          ))}
        </ol>
      </section>

      <section className={s.formWrap}>
        <form action={formAction} className={s.card}>
          <h2 className={s.title}>{copy.title}</h2>
          <p className={s.sub}>{copy.sub}</p>
          <input type="hidden" name="mode" value={mode} />

          <label className={s.label} htmlFor="email">Email or mobile number</label>
          <input id="email" name="email" className={s.input} placeholder="you@example.com"
            autoComplete="username" defaultValue={state.email} required />

          <div className={s.labelRow}>
            <label className={s.label} htmlFor="password">Password</label>
            {/* ponytail: reset flow not built yet */}
            {mode === 'login' && <a href="#" className={s.link}>Forgot password?</a>}
          </div>
          <input id="password" name="password" type="password" className={s.input} placeholder="••••••••"
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required />

          {mode === 'login' && (
            <label className={s.check}><input type="checkbox" name="remember" /> Keep me logged in</label>
          )}

          {state.error && <p className={s.error} role="alert">{state.error}</p>}

          <button className={s.primary} disabled={pending}>{pending ? 'Please wait…' : copy.submit}</button>

          {mode === 'login' && (
            <>
              <div className={s.divider}><span>or</span></div>
              {/* ponytail: OTP login needs an SMS provider; button is a placeholder */}
              <button type="button" className={s.secondary} disabled title="Coming soon">Log in with OTP</button>
            </>
          )}

          <p className={s.switch}>
            {copy.switchText}{' '}
            <button type="button" className={s.link} onClick={toggleMode}>{copy.switchLink}</button>
          </p>
        </form>
      </section>
    </main>
  );
}
