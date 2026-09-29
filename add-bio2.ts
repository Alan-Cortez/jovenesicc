import { createClient } from '@libsql/client';
import fs from 'fs';

// simple dotenv load
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
    console.log('Adding bio column...');
    await client.execute('ALTER TABLE users ADD COLUMN bio TEXT;');
    console.log('Done!');
  } catch (e) {
    console.error('Error adding bio column:', e);
  }
}
main();
