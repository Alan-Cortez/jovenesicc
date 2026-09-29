const fs = require('fs');

let p = fs.readFileSync('src/app/dashboard/perfil/PerfilClient.tsx', 'utf8');

// Add import
p = p.replace(
  "import SocialFeed from '../SocialFeed';",
  "import SocialFeed from '../SocialFeed';\nimport LevelAvatar from '@/components/gamification/LevelAvatar';"
);

// Replace "Progreso de nivel" section
p = p.replace(
  `<div className={styles.xpHeader}>
                  <h3 className={styles.panelTitle} style={{ marginBottom: 0 }}>Nivel</h3>
                  <span className={styles.levelPill}>Nivel {user.level}</span>
                </div>
                <p className={styles.xpSub}>
                  {user.xp.toLocaleString()} / {user.xpNeededForNext?.toLocaleString()} XP
                </p>
                <div className={styles.xpTrack}>
                  <div className={styles.xpFill} style={{ width: \`\${user.xpProgress}%\` }} />
                </div>
                <p className={styles.xpPct}>{Math.round(user.xpProgress)}% hacia el nivel {user.level + 1}</p>`,
  `<LevelAvatar level={user.level} levelName={user.levelName || 'Semilla'} />
                
                <div style={{ marginTop: '1.5rem' }}>
                  <div className={styles.xpHeader}>
                    <h3 className={styles.panelTitle} style={{ marginBottom: 0, fontSize: '0.9rem' }}>Progreso de XP</h3>
                    <span className={styles.levelPill} style={{ background: 'rgba(255,100,0,0.1)', color: '#ff9800' }}>
                      {user.streakCurrent} 🔥 Racha
                    </span>
                  </div>
                  <p className={styles.xpSub} style={{ fontSize: '0.85rem' }}>
                    {user.isMaxLevel ? '¡Nivel Máximo!' : \`\${user.xpIntoCurrentLevel?.toLocaleString()} / \${user.xpNeededForNext?.toLocaleString()} XP\`}
                  </p>
                  <div className={styles.xpTrack}>
                    <div className={styles.xpFill} style={{ width: \`\${user.xpProgress}%\`, background: 'linear-gradient(90deg, #ff9800, #ff5722)' }} />
                  </div>
                  <p className={styles.xpPct} style={{ fontSize: '0.75rem', marginTop: '4px' }}>
                    {user.isMaxLevel ? 'Has alcanzado la cima' : \`\${Math.round(user.xpProgress)}% hacia el nivel \${user.level + 1}\`}
                  </p>
                </div>`
);

fs.writeFileSync('src/app/dashboard/perfil/PerfilClient.tsx', p);
console.log('Fixed PerfilClient.tsx to include LevelAvatar');
