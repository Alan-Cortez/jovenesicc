const fs = require('fs');

let p = fs.readFileSync('src/app/dashboard/perfil/PerfilClient.tsx', 'utf8');

// The replacement must be exact string matching regardless of \r or \n
p = p.replace(/xp:\s*number;[\s\S]*?shareDevotionals:\s*number;/m, 
`xp: number;
  totalXp: number;
  level: number;
  levelName?: string;
  streakCurrent: number;
  streakBest: number;
  xpIntoCurrentLevel?: number;
  xpNeededForNext?: number;
  xpProgress: number;
  isMaxLevel?: boolean;
  joinedAt: string;
  shareDevotionals: number;`);

fs.writeFileSync('src/app/dashboard/perfil/PerfilClient.tsx', p);
console.log('Fixed PerfilClient.tsx interface');
