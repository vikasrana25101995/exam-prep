'use client';
import { useActionState, useState } from 'react';
import { authAction } from '../action';
import { COPY } from '../constants';

export function useAuthForm() {
  const [mode, setMode] = useState('login');
  const [state, formAction, pending] = useActionState(authAction, {});
  return {
    mode,
    copy: COPY[mode],
    toggleMode: () => setMode((m) => (m === 'login' ? 'signup' : 'login')),
    state,
    formAction,
    pending,
  };
}
