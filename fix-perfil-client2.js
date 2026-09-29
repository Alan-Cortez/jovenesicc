const fs = require('fs');
let p = fs.readFileSync('src/app/dashboard/perfil/PerfilClient.tsx', 'utf8');

p = p.replace(
  `export default function PerfilClient({
  user,
  currentTheme,
  feed,
  posts,
}: {
  user: UserData;
  currentTheme: string;
  feed: FeedItem[];
  posts?: any[];
}) {`,
  `export default function PerfilClient({
  user,
  currentTheme,
  feed,
  posts,
  earnedBadges = [],
}: {
  user: UserData;
  currentTheme: string;
  feed: FeedItem[];
  posts?: any[];
  earnedBadges?: any[];
}) {`
);

p = p.replace(
  `<p className={styles.xpSub}>
                  {user.xp.toLocaleString()} / {user.xpForNextLevel.toLocaleString()} XP
                </p>
                <div className={styles.xpTrack}>
                  <div className={styles.xpFill} style={{ width: \`\${user.xpProgress}%\` }} />
                </div>
                <p className={styles.xpPct}>{Math.round(user.xpProgress)}% hacia el nivel {user.level + 1}</p>`,
  `<p className={styles.xpSub}>
                  {user.levelName && <span style={{display: 'block', fontWeight: 600, color: 'var(--color-text-main)', marginBottom: '4px'}}>{user.levelName}</span>}
                  {user.isMaxLevel ? '¡Nivel Máximo!' : \`\${user.xpIntoCurrentLevel?.toLocaleString()} / \${user.xpNeededForNext?.toLocaleString()} XP\`}
                </p>
                <div className={styles.xpTrack}>
                  <div className={styles.xpFill} style={{ width: \`\${user.xpProgress}%\` }} />
                </div>
                <p className={styles.xpPct}>{user.isMaxLevel ? 'Has alcanzado la cima' : \`\${Math.round(user.xpProgress)}% hacia el nivel \${user.level + 1}\`}</p>`
);

p = p.replace(
  `<h3 className={styles.panelTitle}>Logros ({unlocked.length}/{allBadges.length})</h3>`,
  `<h3 className={styles.panelTitle}>Logros ({unlocked.length})</h3>`
);

fs.writeFileSync('src/app/dashboard/perfil/PerfilClient.tsx', p);
console.log('Fixed PerfilClient.tsx rendering');
