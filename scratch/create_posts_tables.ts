import {createClient} from '@libsql/client';

const client = createClient({
  url:'libsql://jct-valcordigitalsolutions.aws-us-west-2.turso.io',
  authToken:'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODkxODg4NDYsImlkIjoiMDFhMDkzYTUtZTkwMS03ZDJhLTkyYzYtZGI0YjQ3NDM4Y2FmIiwia2lkIjoiVkFDWjFOMjhQUVZ4MVNQb21aanB1YUt1Wm9kcG9JYndNY21NbGVJTnQtOCIsInJpZCI6ImYwZmI2OWMzLWEwNDMtNDI1Yy04YmYzLTJkNGI3YjAyZmI5MCJ9.ep91xqJH1S9lMvdzrAxAAVYUjFDGeiz3F1cNl_xrvvIceXUfmCm4bPaiGWo2y3jh5fMUDk18Fy7Lp7yJMzs3Aw'
});

async function main() {
  console.log('Creating posts table...');
  await client.execute(`
    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      content TEXT NOT NULL,
      image_url TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  console.log('Creating post_reactions table...');
  await client.execute(`
    CREATE TABLE IF NOT EXISTS post_reactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id),
      type TEXT NOT NULL DEFAULT 'heart',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  console.log('Creating post_comments table...');
  await client.execute(`
    CREATE TABLE IF NOT EXISTS post_comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id),
      content TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  console.log('Tables created successfully!');
}

main().catch(console.error);
