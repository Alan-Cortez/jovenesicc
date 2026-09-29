const fs = require('fs');
let c = fs.readFileSync('src/app/dashboard/perfil/PerfilClient.tsx', 'utf8');

c = c.replace(
  /\{ROLE_LABELS\[user\.role\] \?\? user\.role\}\s*\{' · '\}\{user\.groupName\}/g,
  "{user.bio || 'Sin descripción'}"
);

// We also need to remove 'Rol', 'Miembro desde', 'Privacidad' from 'ACERCA DE MI'
c = c.replace(/<li>\s*<span className=\{styles\.infoLabel\}>Rol<\/span>\s*<span className=\{styles\.infoValue\}>.*?<\/span>\s*<\/li>/g, "");
c = c.replace(/<li>\s*<span className=\{styles\.infoLabel\}>Miembro desde<\/span>\s*<span className=\{styles\.infoValue\}>.*?<\/span>\s*<\/li>/g, "");
c = c.replace(/<li>\s*<span className=\{styles\.infoLabel\}>Privacidad<\/span>\s*<span className=\{styles\.infoValue\}>.*?<\/span>\s*<\/li>/g, "");

fs.writeFileSync('src/app/dashboard/perfil/PerfilClient.tsx', c);
