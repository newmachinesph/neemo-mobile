/**
 * Web shim for src/db/index.ts
 * op-sqlite is native-only. On web, the DB layer is a no-op.
 * Metro automatically resolves *.web.ts over *.ts for web builds.
 */

export function initDatabase(): void {
  // no-op on web
}

export function getDb(): any {
  throw new Error('SQLite is not available on web');
}

export function getSqlite(): any {
  throw new Error('SQLite is not available on web');
}

export function isDbReady(): boolean {
  return false;
}

export function closeDatabase(): void {
  // no-op on web
}

export function isVecLoaded(): boolean {
  return false;
}

export type DrizzleDb = any;
