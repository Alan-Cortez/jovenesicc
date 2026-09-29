const fs = require('fs');
let c = fs.readFileSync('src/app/actions/user.ts', 'utf8');

c = c.replace(
  "const name = formData.get('name') as string;",
  "const name = formData.get('name') as string;\n  const bio = formData.get('bio') as string;"
);

c = c.replace(
  "const updates: any = { name };",
  "const updates: any = { name, bio };"
);

fs.writeFileSync('src/app/actions/user.ts', c);
