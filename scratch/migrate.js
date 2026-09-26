const { createClient } = require('@libsql/client');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function main() {
  await client.execute(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      actor_id INTEGER REFERENCES users(id),
      type TEXT NOT NULL,
      content TEXT NOT NULL,
      link TEXT,
      is_read INTEGER DEFAULT 0 NOT NULL,
      created_at TEXT DEFAULT (datetime('now')) NOT NULL
    );
  `);
  console.log("Table notifications created!");
}

main().catch(console.error);
