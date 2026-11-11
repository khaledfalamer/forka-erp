// Settings come from environment variables. The defaults are for a local development machine only.
const env = process.env;
const db = env.PEOPLE_DB_NAME || 'forka_people';
const host = env.PGHOST || 'localhost';

export const config = {
  env: env.NODE_ENV || 'development',
  port: Number(env.PORT || 8080),
  dbName: db,
  // Superuser connection, used only by scripts/setup-db.ts to create the database and roles.
  adminUrl: env.ADMIN_DATABASE_URL || `postgres://postgres:postgres@${host}:5432/postgres`,
  // Owner: runs migrations. App: what the server uses at run time (row-level security applies).
  ownerUrl: env.OWNER_DATABASE_URL || `postgres://people_owner:owner_dev_only@${host}:5432/${db}`,
  appUrl: env.DATABASE_URL || `postgres://people_app:app_dev_only@${host}:5432/${db}`,
  sessionSecret: env.SESSION_SECRET || 'dev-only-session-secret-change-me-0123456789',
  // The demo sign-in screen exists only outside production.
  devLogin: (env.NODE_ENV || 'development') !== 'production',
};

if (config.env === 'production' && !env.SESSION_SECRET) {
  throw new Error('SESSION_SECRET must be set in production');
}
