import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const dbPath = process.env.DB_PATH ?? resolve(process.cwd(), 'data/tizao.sqlite');
mkdirSync(dirname(dbPath), { recursive: true });

export const db = new DatabaseSync(dbPath);

db.exec('PRAGMA journal_mode = WAL;');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL,
    points INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS tokens (
    token TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    started_at TEXT NOT NULL,
    finished_at TEXT,
    total_score REAL NOT NULL DEFAULT 0,
    current_step_id TEXT NOT NULL DEFAULT 'S01',
    profile_json TEXT
  );

  CREATE TABLE IF NOT EXISTS step_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL,
    step_id TEXT NOT NULL,
    input_json TEXT NOT NULL,
    output_json TEXT NOT NULL,
    score REAL NOT NULL,
    max_score REAL NOT NULL DEFAULT 0,
    duration_ms INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL,
    content_md TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS ai_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER,
    agent TEXT NOT NULL,
    model TEXT,
    prompt_hash TEXT,
    response TEXT,
    latency_ms INTEGER,
    created_at TEXT NOT NULL
  );
`);

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, 'hex');
  if (candidate.length !== expected.length) return false;
  return timingSafeEqual(candidate, expected);
}

function seed(): void {
  const row = db.prepare('SELECT COUNT(*) AS c FROM users').get() as { c: number } | undefined;
  if ((row?.c ?? 0) > 0) return;

  const insert = db.prepare(
    'INSERT INTO users (username, password_hash, role, points, created_at) VALUES (?, ?, ?, ?, ?)'
  );
  const now = new Date().toISOString();
  insert.run('admin', hashPassword('admin123'), 'admin', 0, now);
  insert.run('teacher', hashPassword('teacher123'), 'teacher', 0, now);
  insert.run('student', hashPassword('student123'), 'student', 100, now);
}

seed();

export function nowIso(): string {
  return new Date().toISOString();
}
