import 'server-only';
import { promises as fs } from 'fs';
import path from 'path';

// ponytail: single JSON file + in-process write queue. Fine for one server;
// swap for Postgres/Mongo before running more than one instance.
const FILE = path.join(process.cwd(), 'data', 'db.json');
const EMPTY = { users: [], sessions: {}, tests: [], attempts: [] };

let queue = Promise.resolve();

export async function readDb() {
  try {
    return { ...EMPTY, ...JSON.parse(await fs.readFile(FILE, 'utf8')) };
  } catch (e) {
    if (e.code === 'ENOENT') return structuredClone(EMPTY);
    throw e;
  }
}

// Serialises read-modify-write so concurrent requests don't clobber each other.
export function updateDb(fn) {
  const run = queue.then(async () => {
    const db = await readDb();
    const result = await fn(db);
    await fs.mkdir(path.dirname(FILE), { recursive: true });
    const tmp = `${FILE}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(db, null, 2));
    await fs.rename(tmp, FILE);
    return result;
  });
  queue = run.catch(() => {});
  return run;
}
