const fs = require('fs');
let p = fs.readFileSync('src/app/dashboard/perfil/PerfilClient.tsx', 'utf8');

// 1. Modify UserData type
p = p.replace(
  `  xp: number;\n  totalXp: number;\n  level: number;\n  streakCurrent: number;\n  streakBest: number;\n  xpForNextLevel: number;\n  xpProgress: number;`,
  `  xp: number;
  totalXp: number;
  level: number;
  levelName?: string;
  streakCurrent: number;
  streakBest: number;
  xpIntoCurrentLevel?: number;
  xpNeededForNext?: number;
  xpProgress: number;
  isMaxLevel?: boolean;`
);

// 2. Add earnedBadges to props
p = p.replace(
  `  feed: FeedItem[];\n  posts?: any[];\n}) {`,
  `  feed: FeedItem[];
  posts?: any[];
  earnedBadges?: any[];
}) {`
);
p = p.replace(
  `  feed,\n  posts,\n}: {`,
  `  feed,\n  posts,\n  earnedBadges = [],\n}: {`
);

// 3. Replace allBadges logic with earnedBadges
p = p.replace(
  `  // Logros basados en datos reales
  const allBadges = [
    { label: 'Bienvenido', desc: 'Te uniste a la comunidad', unlocked: true },
    { label: 'Primer nivel', desc: 'Alcanzaste el nivel 1', unlocked: user.level >= 1 },
    { label: 'Racha de 7 dias', desc: 'Mantuviste 7 dias seguidos', unlocked: user.streakBest >= 7 },
    { label: 'Racha de 30 dias', desc: 'Mantuviste 30 dias seguidos', unlocked: user.streakBest >= 30 },
    { label: 'Nivel 5', desc: 'Alcanzaste el nivel 5', unlocked: user.level >= 5 },
    { label: '1000 XP', desc: 'Acumulaste 1000 puntos', unlocked: user.totalXp >= 1000 },
    { label: '5000 XP', desc: 'Acumulaste 5000 puntos', unlocked: user.totalXp >= 5000 },
  ];

  const unlocked = allBadges.filter((b) => b.unlocked);
  const locked = allBadges.filter((b) => !b.unlocked);`,
  `  // Logros obtenidos desde la DB
  const unlocked = earnedBadges.map(b => ({ label: b.name, desc: b.description, unlocked: true, icon: b.icon, color: b.color }));`
);

// 4. Fix Level Display in UI
p = p.replace(
  `            <div className={styles.levelHeader}>
              <h3 className={styles.levelTitle}>NIVEL</h3>
              <span className={styles.levelBadge}>Nivel {user.level}</span>
            </div>
            
            <p className={styles.levelXp}>{user.xp} / {user.xpForNextLevel} XP</p>
            
            <div className={styles.progressTrack}>
              <div 
                className={styles.progressFill} 
                style={{ width: \`\${user.xpProgress}%\` }}
              />
            </div>
            
            <p className={styles.levelHint}>
              {Math.round(user.xpProgress)}% hacia el nivel {user.level + 1}
            </p>`,
  `            <div className={styles.levelHeader}>
              <h3 className={styles.levelTitle}>NIVEL</h3>
              <span className={styles.levelBadge}>Nivel {user.level}</span>
            </div>
            
            <p className={styles.levelXp}>
              {user.levelName && <span style={{display: 'block', fontWeight: 600, color: 'var(--color-text-main)', marginBottom: '4px'}}>{user.levelName}</span>}
              {user.isMaxLevel ? '¡Nivel Máximo!' : \`\${user.xpIntoCurrentLevel} / \${user.xpNeededForNext} XP\`}
            </p>
            
            <div className={styles.progressTrack}>
              <div 
                className={styles.progressFill} 
                style={{ width: \`\${user.xpProgress}%\` }}
              />
            </div>
            
            <p className={styles.levelHint}>
              {user.isMaxLevel ? 'Has alcanzado la cima' : \`\${user.xpProgress}% hacia el nivel \${user.level + 1}\`}
            </p>`
);

// 5. Fix Badges UI text
p = p.replace(
  `LOGROS ({unlocked.length}/{allBadges.length})`,
  `LOGROS ({unlocked.length})`
);

fs.writeFileSync('src/app/dashboard/perfil/PerfilClient.tsx', p);
console.log('Fixed PerfilClient.tsx');
