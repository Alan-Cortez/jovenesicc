import { createClient } from '@libsql/client';

process.loadEnvFile('.env');

async function main() {
  try {
    const client = createClient({
      url: process.env.TURSO_DATABASE_URL as string,
      authToken: process.env.TURSO_AUTH_TOKEN as string,
    });
    
    await client.execute(`ALTER TABLE reading_plan_days ADD COLUMN content text;`);
    console.log('Column added successfully');
  } catch (error) {
    console.error('Error:', error);
  }
}

main();
