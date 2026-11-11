// Creates the roles and the database (local development and tests). Production uses Terraform instead.
import pg from 'pg';
import { config } from '../src/config.js';

const ownerPw = new URL(config.ownerUrl).password;
const appPw = new URL(config.appUrl).password;
const admin = new pg.Client({ connectionString: config.adminUrl });
await admin.connect();
const q = (s: string) => admin.query(s);
const lit = (s: string) => "'" + s.replace(/'/g, "''") + "'";

for (const [role, pw] of [['people_owner', ownerPw], ['people_app', appPw]] as const) {
  const r = await admin.query('select 1 from pg_roles where rolname = $1', [role]);
  if (!r.rowCount) await q(`create role ${role} login password ${lit(pw)}`);
  else await q(`alter role ${role} login password ${lit(pw)}`);
}
// The app role must never bypass row-level security.
await q('alter role people_app nobypassrls nosuperuser');

if (process.argv.includes('--fresh')) await q(`drop database if exists ${config.dbName} with (force)`);
const exists = await admin.query('select 1 from pg_database where datname = $1', [config.dbName]);
if (!exists.rowCount) await q(`create database ${config.dbName} owner people_owner`);
await admin.end();

// Extensions need a superuser once per database.
const adminDb = new pg.Client({ connectionString: config.adminUrl.replace(/\/[^/]*$/, '/' + config.dbName) });
await adminDb.connect();
await adminDb.query('create extension if not exists pgcrypto; create extension if not exists citext;');
await adminDb.end();
console.log(`Database ${config.dbName} is ready.`);
