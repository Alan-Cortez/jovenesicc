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
    const result = await client.execute("SELECT id FROM users WHERE name LIKE '%Alan%' LIMIT 1");
    if (result.rows.length > 0) {
      const userId = result.rows[0].id;
      console.log('Found user Alan, ID:', userId);

      await client.execute({
        sql: "INSERT INTO notifications (user_id, type, title, content, is_read, created_at) VALUES (?, ?, ?, ?, ?, datetime('now'))",
        args: [userId, 'success', 'Sistema', '¡Bienvenido! Tu panel de notificaciones ahora funciona correctamente.', 0]
      });

      await client.execute({
        sql: "INSERT INTO notifications (user_id, type, title, content, is_read, created_at) VALUES (?, ?, ?, ?, ?, datetime('now', '-2 hours'))",
        args: [userId, 'mission', 'Sistema', 'La misión "Asistencia a la evangelización" ha sido aprobada. ¡Buen trabajo!', 0]
      });

      console.log('Dummy notifications created!');
    }
  } catch (e) {
    console.error('Error creating notification:', e);
  }
}
main();
