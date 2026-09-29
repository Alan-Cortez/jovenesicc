import { createClient } from '@libsql/client';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf8').split('\n');
for (const line of env) {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    process.env[match[1]] = match[2].trim().replace(/^['"](.*)['"]$/, '$1');
  }
}

async function main() {
  const client = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  try {
    await client.execute('ALTER TABLE notifications ADD COLUMN actor_id INTEGER');
  } catch (e) {}
  
  try {
    await client.execute("ALTER TABLE notifications ADD COLUMN content TEXT NOT NULL DEFAULT ''");
  } catch (e) {}
  
  try {
    await client.execute('ALTER TABLE notifications ADD COLUMN link TEXT');
  } catch (e) {}

  console.log('Columns added (or already existed)');
}
main();
