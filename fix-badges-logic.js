const fs = require('fs');
let p = fs.readFileSync('src/app/dashboard/perfil/PerfilClient.tsx', 'utf8');

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

fs.writeFileSync('src/app/dashboard/perfil/PerfilClient.tsx', p);
console.log('Fixed badges logic in PerfilClient.tsx');
