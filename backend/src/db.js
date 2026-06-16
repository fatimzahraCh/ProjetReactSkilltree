import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, '..', 'synapse.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    email       TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    password    TEXT NOT NULL,
    dark_mode   INTEGER DEFAULT 0,
    streak_count INTEGER DEFAULT 0,
    last_active DATE DEFAULT NULL,
    tutorial_done INTEGER DEFAULT 0,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS trees (
    email      TEXT PRIMARY KEY,
    xp         INTEGER DEFAULT 0,
    nodes      TEXT DEFAULT '[]',
    edges      TEXT DEFAULT '[]',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (email) REFERENCES users(email) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS activity_log (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    email     TEXT NOT NULL,
    date      DATE NOT NULL,
    action    TEXT NOT NULL DEFAULT 'visit',
    FOREIGN KEY (email) REFERENCES users(email) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS certificates (
    id        TEXT PRIMARY KEY,
    email     TEXT NOT NULL,
    issued_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (email) REFERENCES users(email) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_activity_email ON activity_log(email);
  CREATE INDEX IF NOT EXISTS idx_activity_date ON activity_log(date);
`);

// Add missing columns safely
function addCol(table, col, def) {
  try { db.exec(`ALTER TABLE ${table} ADD COLUMN ${col} ${def}`); } catch {}
}
addCol('users', 'dark_mode', 'INTEGER DEFAULT 0');
addCol('users', 'streak_count', 'INTEGER DEFAULT 0');
addCol('users', 'last_active', 'DATE DEFAULT NULL');
addCol('users', 'tutorial_done', 'INTEGER DEFAULT 0');

export default db;
