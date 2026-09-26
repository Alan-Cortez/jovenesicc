import { createClient } from '@libsql/client';

async function main() {
  const client = createClient({
    url: "libsql://jct-valcordigitalsolutions.aws-us-west-2.turso.io",
    authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODkxODg4NDYsImlkIjoiMDFhMDkzYTUtZTkwMS03ZDJhLTkyYzYtZGI0YjQ3NDM4Y2FmIiwia2lkIjoiVkFDWjFOMjhQUVZ4MVNQb21aanB1YUt1Wm9kcG9JYndNY21NbGVJTnQtOCIsInJpZCI6ImYwZmI2OWMzLWEwNDMtNDI1Yy04YmYzLTJkNGI3YjAyZmI5MCJ9.ep91xqJH1S9lMvdzrAxAAVYUjFDGeiz3F1cNl_xrvvIceXUfmCm4bPaiGWo2y3jh5fMUDk18Fy7Lp7yJMzs3Aw",
  });

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
