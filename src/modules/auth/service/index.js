import 'server-only';
import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { readDb, updateDb } from '@/lib/db';
import { SESSION_COOKIE, SESSION_DAYS } from '../constants';

const hash = (password, salt) => scryptSync(password, salt, 64).toString('hex');
const publicUser = ({ id, name, email, role, active, createdAt }) => ({ id, name, email, role, active: active !== false, createdAt: createdAt ?? null });

export async function createUser({ email, password }) {
  return updateDb((db) => {
    if (db.users.some((u) => u.email === email)) return { error: 'An account with this login already exists.' };
    const salt = randomBytes(16).toString('hex');
    // First account becomes the admin who creates tests.
    const role = db.users.length === 0 ? 'admin' : 'student';
    const user = { id: randomUUID(), email, name: email.split('@')[0], role, active: true, createdAt: new Date().toISOString(), salt, hash: hash(password, salt) };
    db.users.push(user);
    return { user: publicUser(user) };
  });
}

export async function verifyUser({ email, password }) {
  const user = (await readDb()).users.find((u) => u.email === email);
  if (!user) return null;
  const ok = timingSafeEqual(Buffer.from(hash(password, user.salt), 'hex'), Buffer.from(user.hash, 'hex'));
  return ok ? publicUser(user) : null;
}

export async function startSession(userId, remember) {
  const token = randomBytes(32).toString('hex');
  const expires = Date.now() + SESSION_DAYS * 864e5;
  await updateDb((db) => { db.sessions[token] = { userId, expires }; });
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    ...(remember && { expires: new Date(expires) }),
  });
}

export async function endSession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await updateDb((db) => { delete db.sessions[token]; });
  jar.delete(SESSION_COOKIE);
}

export async function getCurrentUser() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const db = await readDb();
  const session = db.sessions[token];
  if (!session || session.expires < Date.now()) return null;
  const user = db.users.find((u) => u.id === session.userId);
  return user && user.active !== false ? publicUser(user) : null; // deactivated = logged out everywhere
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== 'admin') redirect('/dashboard');
  return user;
}

export async function listUsers() {
  return (await readDb()).users.map(publicUser);
}

export async function getUser(id) {
  const user = (await readDb()).users.find((u) => u.id === id);
  return user ? publicUser(user) : null;
}

// Deactivating also ends the user's sessions.
export async function setUserActive(id, active) {
  return updateDb((db) => {
    const user = db.users.find((u) => u.id === id);
    if (!user) return false;
    user.active = active;
    if (!active) for (const [token, sess] of Object.entries(db.sessions)) if (sess.userId === id) delete db.sessions[token];
    return true;
  });
}
