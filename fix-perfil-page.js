const fs = require('fs');

let pageContent = fs.readFileSync('src/app/dashboard/perfil/page.tsx', 'utf8');

// Replace the manual XP calculation with getLevelInfo and fetch badges
pageContent = pageContent.replace(
  `  // XP para siguiente nivel
  const xpForNextLevel = user.level * 500;
  const xpProgress = Math.min((user.xp / xpForNextLevel) * 100, 100);
  const totalXp = (user.level - 1) * 500 + user.xp;`,
  `  // XP y Nivel (Gamification Engine)
  const { getLevelInfo } = await import('@/lib/gamification');
  const levelInfo = getLevelInfo(user.xp); // Nota: user.xp ahora es el totalXp
  
  // Obtener logros reales
  const { userBadges, badges } = await import('@/lib/schema');
  const earnedBadges = await db.select({
    id: badges.id,
    name: badges.name,
    description: badges.description,
    icon: badges.icon,
    color: badges.color,
    grantedAt: userBadges.grantedAt
  })
  .from(userBadges)
  .innerJoin(badges, eq(userBadges.badgeId, badges.id))
  .where(eq(userBadges.userId, user.id));`
);

// Modify userData to use levelInfo
pageContent = pageContent.replace(
  `    xp: user.xp,
    totalXp,
    level: user.level,
    streakCurrent: user.streakCurrent,
    streakBest: user.streakBest,
    xpForNextLevel,
    xpProgress,`,
  `    xp: user.xp,
    totalXp: user.xp,
    level: levelInfo.level,
    levelName: levelInfo.name,
    streakCurrent: user.streakCurrent,
    streakBest: user.streakBest,
    xpIntoCurrentLevel: levelInfo.xpIntoCurrentLevel,
    xpNeededForNext: levelInfo.xpNeededForNext,
    xpProgress: levelInfo.progress,
    isMaxLevel: levelInfo.isMaxLevel,`
);

// Pass badges to PerfilClient
pageContent = pageContent.replace(
  `      feed={feedItems.slice(0, 20)}
      posts={postsWithDetails}
    />`,
  `      feed={feedItems.slice(0, 20)}
      posts={postsWithDetails}
      earnedBadges={earnedBadges}
    />`
);

fs.writeFileSync('src/app/dashboard/perfil/page.tsx', pageContent);
console.log('Fixed perfil/page.tsx');
