const fs = require('fs');

let c = fs.readFileSync('src/app/dashboard/perfil/page.tsx', 'utf8');

c = c.replace(
  /matricula: user\.matricula \?\? '',/g,
  "matricula: user.matricula ?? '',\n    bio: user.bio ?? null,"
);

fs.writeFileSync('src/app/dashboard/perfil/page.tsx', c);
