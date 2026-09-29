
import { db } from '@/lib/db';
import { users, xpLog, badges, userBadges, notifications } from '@/lib/schema';
import { eq, sql, and, count, inArray } from 'drizzle-orm';

// ═══════════════════════════════════════════════════════════════
//  TABLA DE NIVELES
// ═══════════════════════════════════════════════════════════════

export const LEVEL_TABLE = [
  { level: 1,  name: 'Semilla',      xpRequired: 0,     xpAccum: 0 },
  { level: 2,  name: 'Brote',        xpRequired: 100,   xpAccum: 100 },
  { level: 3,  name: 'Raíz',         xpRequired: 250,   xpAccum: 350 },
  { level: 4,  name: 'Tallo',        xpRequired: 450,   xpAccum: 800 },
  { level: 5,  name: 'Hoja',         xpRequired: 700,   xpAccum: 1500 },
  { level: 6,  name: 'Rama',         xpRequired: 1000,  xpAccum: 2500 },
  { level: 7,  name: 'Flor',         xpRequired: 1400,  xpAccum: 3900 },
  { level: 8,  name: 'Fruto',        xpRequired: 1900,  xpAccum: 5800 },
  { level: 9,  name: 'Árbol',        xpRequired: 2500,  xpAccum: 8300 },
  { level: 10, name: 'Roble',        xpRequired: 3200,  xpAccum: 11500 },
  { level: 11, name: 'Centinela',    xpRequired: 4000,  xpAccum: 15500 },
  { level: 12, name: 'Guardián',     xpRequired: 5000,  xpAccum: 20500 },
  { level: 13, name: 'Maestro',      xpRequired: 6200,  xpAccum: 26700 },
  { level: 14, name: 'Siervo Fiel',  xpRequired: 7500,  xpAccum: 34200 },
  { level: 15, name: 'Discípulo',    xpRequired: 9000,  xpAccum: 43200 },
];

// ═══════════════════════════════════════════════════════════════
//  HELPERS DE NIVEL
// ═══════════════════════════════════════════════════════════════

export function getLevelFromTotalXP(totalXp: number) {
  let currentLevel = LEVEL_TABLE[0];
  for (const entry of LEVEL_TABLE) {
    if (totalXp >= entry.xpAccum) {
      currentLevel = entry;
    } else {
      break;
    }
  }
  return currentLevel;
}

export function getLevelInfo(totalXp: number) {
  const current = getLevelFromTotalXP(totalXp);
  const nextIdx = LEVEL_TABLE.findIndex(l => l.level === current.level + 1);
  const next = nextIdx !== -1 ? LEVEL_TABLE[nextIdx] : null;

  const xpIntoCurrentLevel = totalXp - current.xpAccum;
  const xpNeededForNext = next ? next.xpRequired : 0;
  const progress = next ? Math.min((xpIntoCurrentLevel / xpNeededForNext) * 100, 100) : 100;

  return {
    level: current.level,
    name: current.name,
    totalXp,
    xpIntoCurrentLevel,
    xpNeededForNext,
    progress: Math.round(progress),
    isMaxLevel: !next,
  };
}

// ═══════════════════════════════════════════════════════════════
//  GRANT XP — Función central de gamificación
// ═══════════════════════════════════════════════════════════════

export async function grantXP(data: {
  userId: number;
  amount: number;
  reason: string;
  sourceType: string;
  sourceId?: number;
  grantedBy?: number;
}) {
  if (data.amount <= 0) return;

  try {
    // 1. Sumar XP al usuario
    await db.update(users)
      .set({ xp: sql`${users.xp} + ${data.amount}` })
      .where(eq(users.id, data.userId));

    // 2. Registrar en xpLog
    await db.insert(xpLog).values({
      userId: data.userId,
      amount: data.amount,
      reason: data.reason,
      sourceType: data.sourceType,
      sourceId: data.sourceId,
      grantedBy: data.grantedBy,
      createdAt: new Date().toISOString()
    });

    // 3. Verificar subida de nivel
    await checkAndLevelUp(data.userId);

    // 4. Verificar logros
    await checkAchievements(data.userId);
  } catch (error) {
    console.error('Error in grantXP:', error);
  }
}

// ═══════════════════════════════════════════════════════════════
//  CHECK AND LEVEL UP
// ═══════════════════════════════════════════════════════════════

async function checkAndLevelUp(userId: number) {
  try {
    const [user] = await db.select({ xp: users.xp, level: users.level })
      .from(users).where(eq(users.id, userId)).limit(1);
    if (!user) return;

    const totalXp = user.xp;
    const newLevelInfo = getLevelFromTotalXP(totalXp);

    if (newLevelInfo.level > user.level) {
      // Subió de nivel
      await db.update(users)
        .set({ level: newLevelInfo.level })
        .where(eq(users.id, userId));

      // Notificar
      await db.insert(notifications).values({
        userId,
        type: 'success',
        title: 'Subiste de nivel',
        content: `Has alcanzado el nivel ${newLevelInfo.level}: ${newLevelInfo.name}`,
        link: '/dashboard/perfil',
        isRead: 0,
      });
    }
  } catch (error) {
    console.error('Error in checkAndLevelUp:', error);
  }
}

// ═══════════════════════════════════════════════════════════════
//  UPDATE STREAK
// ═══════════════════════════════════════════════════════════════

export async function updateStreak(userId: number) {
  try {
    const [user] = await db.select({
      streakCurrent: users.streakCurrent,
      streakBest: users.streakBest,
      lastReadDate: users.lastReadDate,
    }).from(users).where(eq(users.id, userId)).limit(1);
    if (!user) return;

    // Fecha de hoy en zona horaria México (UTC-6)
    const now = new Date();
    const mexicoOffset = -6 * 60;
    const localNow = new Date(now.getTime() + (mexicoOffset + now.getTimezoneOffset()) * 60000);
    const todayStr = localNow.toISOString().split('T')[0]; // YYYY-MM-DD

    const yesterdayDate = new Date(localNow);
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayStr = yesterdayDate.toISOString().split('T')[0];

    const lastDate = user.lastReadDate;

    if (lastDate === todayStr) {
      // Ya contó hoy, no hacer nada
      return;
    }

    let newStreak: number;
    if (lastDate === yesterdayStr) {
      // Día consecutivo
      newStreak = (user.streakCurrent || 0) + 1;
    } else {
      // Se rompió la racha o es la primera vez
      newStreak = 1;
    }

    const newBest = Math.max(newStreak, user.streakBest || 0);

    await db.update(users).set({
      streakCurrent: newStreak,
      streakBest: newBest,
      lastReadDate: todayStr,
    }).where(eq(users.id, userId));

    // Verificar hitos de racha
    const streakMilestones = [
      { days: 7, xp: 50, badge: 'Fiel por una semana' },
      { days: 14, xp: 100, badge: 'Perseverante' },
      { days: 30, xp: 200, badge: 'Inquebrantable' },
      { days: 60, xp: 400, badge: 'Fuego que no se apaga' },
      { days: 100, xp: 750, badge: 'Centenario' },
    ];

    for (const milestone of streakMilestones) {
      if (newStreak === milestone.days) {
        // Dar bonus XP (sin recursión infinita — inserta directo)
        await db.update(users)
          .set({ xp: sql`${users.xp} + ${milestone.xp}` })
          .where(eq(users.id, userId));

        await db.insert(xpLog).values({
          userId,
          amount: milestone.xp,
          reason: `Racha de ${milestone.days} días`,
          sourceType: 'badge',
          createdAt: new Date().toISOString()
        });

        await db.insert(notifications).values({
          userId,
          type: 'success',
          title: 'Hito de racha',
          content: `${milestone.days} días de racha. +${milestone.xp} XP`,
          link: '/dashboard/perfil',
          isRead: 0,
        });

        // Verificar nivel después del bonus
        await checkAndLevelUp(userId);
        break;
      }
    }
  } catch (error) {
    console.error('Error in updateStreak:', error);
  }
}

// ═══════════════════════════════════════════════════════════════
//  CHECK ACHIEVEMENTS
// ═══════════════════════════════════════════════════════════════

async function checkAchievements(userId: number) {
  try {
    // Obtener datos del usuario
    const [user] = await db.select({
      xp: users.xp,
      level: users.level,
      streakBest: users.streakBest,
      avatar: users.avatar,
    }).from(users).where(eq(users.id, userId)).limit(1);
    if (!user) return;

    // Obtener logros ya obtenidos
    const earned = await db.select({ badgeId: userBadges.badgeId })
      .from(userBadges).where(eq(userBadges.userId, userId));
    const earnedIds = new Set(earned.map(e => e.badgeId));

    // Obtener todos los logros auto
    const allBadges = await db.select()
      .from(badges)
      .where(and(eq(badges.triggerType, 'auto'), eq(badges.isActive, 1)));

    // Obtener estadísticas adicionales
    const { readingProgress, posts, postReactions, postComments, songSuggestions, taskSubmissions } = await import('@/lib/schema');

    const [readingsCount] = await db.select({ c: count() }).from(readingProgress)
      .where(and(eq(readingProgress.userId, userId), eq(readingProgress.status, 'completed')));

    const [postsCount] = await db.select({ c: count() }).from(posts)
      .where(eq(posts.userId, userId));

    const [commentsCount] = await db.select({ c: count() }).from(postComments)
      .where(eq(postComments.userId, userId));

    const [songsCount] = await db.select({ c: count() }).from(songSuggestions)
      .where(eq(songSuggestions.userId, userId));

    const [missionsCount] = await db.select({ c: count() }).from(taskSubmissions)
      .where(and(eq(taskSubmissions.userId, userId), eq(taskSubmissions.status, 'approved')));

    // Contar likes recibidos en mis posts
    const myPosts = await db.select({ id: posts.id }).from(posts).where(eq(posts.userId, userId));
    let likesReceived = 0;
    if (myPosts.length > 0) {
      const postIds = myPosts.map(p => p.id);
      const [lc] = await db.select({ c: count() }).from(postReactions).where(inArray(postReactions.postId, postIds));
      likesReceived = lc.c;
    }

    // Contar planes completos
    // (Un plan está completo si todas sus lecturas tienen status 'completed')
    // Simplificamos: contamos cuántos planes distintos tiene con progreso
    const { readingPlanDays, readingPlans } = await import('@/lib/schema');

    // Contar devocionales escritos
    const { devotionals } = await import('@/lib/schema');
    const [devoCount] = await db.select({ c: count() }).from(devotionals)
      .where(eq(devotionals.userId, userId));

    const stats = {
      totalXp: user.xp,
      level: user.level,
      streakBest: user.streakBest || 0,
      hasAvatar: !!user.avatar,
      readings: readingsCount.c,
      posts: postsCount.c,
      comments: commentsCount.c,
      songs: songsCount.c,
      missions: missionsCount.c,
      likesReceived,
      devotionals: devoCount.c,
    };

    // Evaluar cada logro
    for (const badge of allBadges) {
      if (earnedIds.has(badge.id)) continue; // Ya lo tiene

      const condition = badge.triggerCondition;
      if (!condition) continue;

      let unlocked = false;
      try {
        // triggerCondition es un JSON string: {"type": "xp", "value": 1000}
        const cond = JSON.parse(condition);
        switch (cond.type) {
          case 'welcome': unlocked = true; break;
          case 'level': unlocked = stats.level >= cond.value; break;
          case 'xp': unlocked = stats.totalXp >= cond.value; break;
          case 'streak': unlocked = stats.streakBest >= cond.value; break;
          case 'avatar': unlocked = stats.hasAvatar; break;
          case 'readings': unlocked = stats.readings >= cond.value; break;
          case 'firstReading': unlocked = stats.readings >= 1; break;
          case 'missions': unlocked = stats.missions >= cond.value; break;
          case 'firstMission': unlocked = stats.missions >= 1; break;
          case 'firstPost': unlocked = (stats.posts + stats.devotionals) >= 1; break;
          case 'songs': unlocked = stats.songs >= cond.value; break;
          case 'devotionals': unlocked = stats.devotionals >= cond.value; break;
          case 'comments': unlocked = stats.comments >= cond.value; break;
          case 'likesReceived': unlocked = stats.likesReceived >= cond.value; break;
        }
      } catch {
        continue;
      }

      if (unlocked) {
        // Otorgar logro
        await db.insert(userBadges).values({
          userId,
          badgeId: badge.id,
          grantedAt: new Date().toISOString(),
        });

        // Notificar
        await db.insert(notifications).values({
          userId,
          type: 'success',
          title: 'Logro desbloqueado',
          content: `Has desbloqueado: ${badge.name}`,
          link: '/dashboard/perfil',
          isRead: 0,
        });

        // Dar XP del logro (si tiene color que indica XP reward... usamos un campo)
        // Por ahora XP fija de 15 por logro
        const badgeXp = 15;
        await db.update(users)
          .set({ xp: sql`${users.xp} + ${badgeXp}` })
          .where(eq(users.id, userId));

        await db.insert(xpLog).values({
          userId,
          amount: badgeXp,
          reason: `Logro: ${badge.name}`,
          sourceType: 'badge',
          sourceId: badge.id,
          createdAt: new Date().toISOString()
        });
      }
    }

    // Re-check level after badge XP
    await checkAndLevelUp(userId);
  } catch (error) {
    console.error('Error in checkAchievements:', error);
  }
}
