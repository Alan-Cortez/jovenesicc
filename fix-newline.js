const fs = require('fs');
let c = fs.readFileSync('src/app/dashboard/perfil/PerfilClient.tsx', 'utf8');

c = c.replace(/initialName=\{user\.name\}\\n\s*initialBio=\{user\.bio\}/, "initialName={user.name}\n                    initialBio={user.bio}");

fs.writeFileSync('src/app/dashboard/perfil/PerfilClient.tsx', c);
