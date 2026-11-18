import fs from 'node:fs';
import path from 'node:path';
import {DatabaseSync} from 'node:sqlite';

let dbInstance: DatabaseSync | null = null;

export function getDbPath(): string {
  const configured = process.env.DB_PATH || './data/agri_advisory.db';
  return path.isAbsolute(configured) ? configured : path.resolve(process.cwd(), configured);
}

export function getDb(): DatabaseSync {
  if (dbInstance) {
    return dbInstance;
  }

  const dbPath = getDbPath();
  fs.mkdirSync(path.dirname(dbPath), {recursive: true});

  const db = new DatabaseSync(dbPath);
  db.exec('PRAGMA foreign_keys = ON;');
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA busy_timeout = 5000;');

  runMigrations(db);
  dbInstance = db;
  return db;
}

export function runMigrations(db: DatabaseSync): string[] {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  const migrationsDir = path.resolve(process.cwd(), 'server/migrations');
  if (!fs.existsSync(migrationsDir)) {
    return [];
  }

  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  const applied: string[] = [];
  const checkStmt = db.prepare('SELECT 1 FROM schema_migrations WHERE version = ?');
  const markStmt = db.prepare('INSERT INTO schema_migrations (version) VALUES (?)');

  for (const file of files) {
    const existing = checkStmt.get(file);
    if (existing) continue;

    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    db.exec('BEGIN IMMEDIATE;');
    try {
      db.exec(sql);
      markStmt.run(file);
      db.exec('COMMIT;');
      applied.push(file);
    } catch (err) {
      db.exec('ROLLBACK;');
      throw err;
    }
  }
  return applied;
}

export function closeDb(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}
