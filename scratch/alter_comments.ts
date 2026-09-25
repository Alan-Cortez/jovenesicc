import {createClient} from '@libsql/client';

const client = createClient({
  url:'libsql://jct-valcordigitalsolutions.aws-us-west-2.turso.io',
  authToken:'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODkxODg4NDYsImlkIjoiMDFhMDkzYTUtZTkwMS03ZDJhLTkyYzYtZGI0YjQ3NDM4Y2FmIiwia2lkIjoiVkFDWjFOMjhQUVZ4MVNQb21aanB1YUt1Wm9kcG9JYndNY21NbGVJTnQtOCIsInJpZCI6ImYwZmI2OWMzLWEwNDMtNDI1Yy04YmYzLTJkNGI3YjAyZmI5MCJ9.ep91xqJH1S9lMvdzrAxAAVYUjFDGeiz3F1cNl_xrvvIceXUfmCm4bPaiGWo2y3jh5fMUDk18Fy7Lp7yJMzs3Aw'
});

async function main() {
  console.log('Adding parent_id to post_comments...');
  try {
    await client.execute(`ALTER TABLE post_comments ADD COLUMN parent_id INTEGER`);
    console.log('parent_id added.');
  } catch(e) {
    console.log('Column might already exist:', e);
  }

  console.log('Creating comment_reactions table...');
  await client.execute(`
    CREATE TABLE IF NOT EXISTS comment_reactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      comment_id INTEGER NOT NULL REFERENCES post_comments(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  console.log('Done!');
}

main().catch(console.error);
