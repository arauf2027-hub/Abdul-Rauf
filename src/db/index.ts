import path from 'path';
import fs from 'fs';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { SCHEMA_DDL } from './ddl.ts';
import * as schema from './schema.ts';

declare global {
  var _ehsDbInstance: any;
  var _ehsClientInstance: any;
  var _ehsDbInitialized: boolean;
}

const dataDir = path.resolve(process.cwd(), 'data', 'pgdata');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

export const client: PGlite = global._ehsClientInstance || new PGlite(dataDir);
global._ehsClientInstance = client;

export const db = global._ehsDbInstance || drizzle(client, { schema });
global._ehsDbInstance = db;

// Schema DDL and Initial Seeding
export async function initializeDatabase() {
  if (global._ehsDbInitialized) return;
  try {
    await client.exec(SCHEMA_DDL);
    try {
      await client.exec(`ALTER TABLE events ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';`);
    } catch {}
    const { seedDatabaseIfEmpty, seedPtwIfEmpty } = await import('./seed.ts');
    await seedDatabaseIfEmpty();
    await seedPtwIfEmpty();

    // Synchronize PostgreSQL sequences with existing IDs
    const tablesWithSerial = [
      'organizations',
      'departments',
      'locations',
      'sub_locations',
      'users',
      'events',
      'incident_reports',
      'five_whys',
      'key_findings',
      'action_items',
      'hazard_reports',
      'inspection_events',
      'inspection_observations',
      'meetings',
      'meeting_attendees',
      'training_sessions',
      'training_attendance',
      'emergency_drills',
      'documents',
      'notifications',
      'audit_events',
      'ptw_permits',
      'ptw_extensions',
    ];

    for (const t of tablesWithSerial) {
      try {
        await client.exec(`
          SELECT setval(
            pg_get_serial_sequence('${t}', 'id'),
            COALESCE((SELECT MAX(id) FROM ${t}), 0) + 1,
            false
          );
        `);
      } catch {}
    }

    global._ehsDbInitialized = true;
    console.log('[EHS DB] PostgreSQL database initialized and verified successfully');
  } catch (error) {
    console.error('[EHS DB] Error during schema/seed initialization:', error);
  }
}

// Automatically trigger initialization
initializeDatabase().catch((err) => {
  console.error('[EHS DB] Background initialization error:', err);
});
