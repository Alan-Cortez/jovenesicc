const fs = require('fs');

let p = fs.readFileSync('src/app/actions/grupos.ts', 'utf8');
p = p.replace(
  "const res = await db.insert(groups).values({ name: '_SIN_GRUPO_', description: 'Virtual' }).returning();",
  "const res = await db.insert(groups).values({ name: '_SIN_GRUPO_', description: 'Virtual', leaderId: admin.id }).returning();"
);
fs.writeFileSync('src/app/actions/grupos.ts', p);

let c = fs.readFileSync('src/app/dashboard/admin/grupos/GruposClient.tsx', 'utf8');
console.log(c.substring(0, 1000));
