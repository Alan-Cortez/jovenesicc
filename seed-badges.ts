import { createClient } from '@libsql/client';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf8').split('\n');
for (const line of env) {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    process.env[match[1]] = match[2].trim().replace(/^['"](.*)['"]$/, '$1');
  }
}

const BADGES = [
  // ── Primeros Pasos (5) ──
  { name: 'Bienvenido', description: 'Te uniste a la comunidad', icon: 'UserPlus', color: '#4ae290', trigger_type: 'auto', trigger_condition: '{"type":"welcome"}' },
  { name: 'Primera Lectura', description: 'Completar tu primer día de lectura', icon: 'BookOpen', color: '#1da1f2', trigger_type: 'auto', trigger_condition: '{"type":"firstReading"}' },
  { name: 'Primera Misión', description: 'Completar tu primera misión', icon: 'Target', color: '#ff9800', trigger_type: 'auto', trigger_condition: '{"type":"firstMission"}' },
  { name: 'Mi Voz', description: 'Publicar tu primer devocional o post', icon: 'MessageCircle', color: '#e040fb', trigger_type: 'auto', trigger_condition: '{"type":"firstPost"}' },
  { name: 'Foto de Perfil', description: 'Subir tu foto de perfil', icon: 'Camera', color: '#00bcd4', trigger_type: 'auto', trigger_condition: '{"type":"avatar"}' },

  // ── Constancia (6) ──
  { name: 'Fiel por una semana', description: 'Mantener una racha de 7 días', icon: 'Flame', color: '#ff5722', trigger_type: 'auto', trigger_condition: '{"type":"streak","value":7}' },
  { name: 'Perseverante', description: 'Mantener una racha de 14 días', icon: 'Flame', color: '#ff5722', trigger_type: 'auto', trigger_condition: '{"type":"streak","value":14}' },
  { name: 'Inquebrantable', description: 'Mantener una racha de 30 días', icon: 'Flame', color: '#e0245e', trigger_type: 'auto', trigger_condition: '{"type":"streak","value":30}' },
  { name: 'Fuego que no se apaga', description: 'Mantener una racha de 60 días', icon: 'Flame', color: '#e0245e', trigger_type: 'auto', trigger_condition: '{"type":"streak","value":60}' },
  { name: 'Centenario', description: 'Mantener una racha de 100 días', icon: 'Flame', color: '#ffd700', trigger_type: 'auto', trigger_condition: '{"type":"streak","value":100}' },
  { name: 'Madrugador espiritual', description: 'Completar una lectura antes de las 7am', icon: 'Sunrise', color: '#ffab40', trigger_type: 'manual', trigger_condition: null },

  // ── Crecimiento (5) ──
  { name: 'Nivel 5 - Hoja', description: 'Alcanzar el nivel 5', icon: 'TrendingUp', color: '#4ae290', trigger_type: 'auto', trigger_condition: '{"type":"level","value":5}' },
  { name: 'Nivel 10 - Roble', description: 'Alcanzar el nivel 10', icon: 'TrendingUp', color: '#1da1f2', trigger_type: 'auto', trigger_condition: '{"type":"level","value":10}' },
  { name: 'Nivel 15 - Discípulo', description: 'Alcanzar el nivel máximo', icon: 'Crown', color: '#ffd700', trigger_type: 'auto', trigger_condition: '{"type":"level","value":15}' },
  { name: 'Mil puntos', description: 'Acumular 1,000 XP en total', icon: 'Zap', color: '#ff9800', trigger_type: 'auto', trigger_condition: '{"type":"xp","value":1000}' },
  { name: 'Cinco mil', description: 'Acumular 5,000 XP en total', icon: 'Zap', color: '#ffd700', trigger_type: 'auto', trigger_condition: '{"type":"xp","value":5000}' },

  // ── Lector (5) ──
  { name: '10 Lecturas', description: 'Completar 10 días de lectura', icon: 'BookOpen', color: '#4ae290', trigger_type: 'auto', trigger_condition: '{"type":"readings","value":10}' },
  { name: '50 Lecturas', description: 'Completar 50 días de lectura', icon: 'BookOpen', color: '#1da1f2', trigger_type: 'auto', trigger_condition: '{"type":"readings","value":50}' },
  { name: '100 Lecturas', description: 'Completar 100 días de lectura', icon: 'BookOpen', color: '#ffd700', trigger_type: 'auto', trigger_condition: '{"type":"readings","value":100}' },
  { name: 'Plan Completo', description: 'Terminar un plan de lectura entero', icon: 'CheckCircle', color: '#4ae290', trigger_type: 'manual', trigger_condition: null },
  { name: 'Devorador de planes', description: 'Terminar 3 planes de lectura', icon: 'Library', color: '#e040fb', trigger_type: 'manual', trigger_condition: null },

  // ── Misionero (5) ──
  { name: '5 Misiones', description: 'Completar 5 misiones aprobadas', icon: 'Target', color: '#4ae290', trigger_type: 'auto', trigger_condition: '{"type":"missions","value":5}' },
  { name: '15 Misiones', description: 'Completar 15 misiones aprobadas', icon: 'Target', color: '#1da1f2', trigger_type: 'auto', trigger_condition: '{"type":"missions","value":15}' },
  { name: '30 Misiones', description: 'Completar 30 misiones aprobadas', icon: 'Target', color: '#ffd700', trigger_type: 'auto', trigger_condition: '{"type":"missions","value":30}' },
  { name: 'Misión Perfecta', description: 'Completar una misión con evidencia fotográfica', icon: 'Camera', color: '#00bcd4', trigger_type: 'manual', trigger_condition: null },
  { name: 'Misionero Veloz', description: 'Completar una misión el mismo día que se publicó', icon: 'Zap', color: '#ff9800', trigger_type: 'manual', trigger_condition: null },

  // ── Comunidad (4) ──
  { name: 'DJ de la Fe', description: 'Sugerir 5 canciones', icon: 'Music', color: '#1db954', trigger_type: 'auto', trigger_condition: '{"type":"songs","value":5}' },
  { name: 'Escritor Fiel', description: 'Publicar 10 devocionales', icon: 'PenTool', color: '#e040fb', trigger_type: 'auto', trigger_condition: '{"type":"devotionals","value":10}' },
  { name: 'Comentarista', description: 'Dejar 10 comentarios en publicaciones', icon: 'MessageSquare', color: '#1da1f2', trigger_type: 'auto', trigger_condition: '{"type":"comments","value":10}' },
  { name: 'Popular', description: 'Recibir 20 likes en tus publicaciones', icon: 'Heart', color: '#e0245e', trigger_type: 'auto', trigger_condition: '{"type":"likesReceived","value":20}' },
];

async function main() {
  const client = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  // Clear existing badges
  await client.execute('DELETE FROM user_badges');
  await client.execute('DELETE FROM badges');

  for (const badge of BADGES) {
    await client.execute({
      sql: 'INSERT INTO badges (name, description, icon, color, trigger_type, trigger_condition, is_active) VALUES (?, ?, ?, ?, ?, ?, 1)',
      args: [badge.name, badge.description, badge.icon, badge.color, badge.trigger_type, badge.trigger_condition]
    });
  }

  console.log(`Seeded ${BADGES.length} badges successfully!`);

  // Verify
  const result = await client.execute('SELECT id, name, trigger_type FROM badges ORDER BY id');
  for (const row of result.rows) {
    console.log(`  #${row.id}: ${row.name} (${row.trigger_type})`);
  }
}

main();
