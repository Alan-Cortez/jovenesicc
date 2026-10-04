const fs = require('fs');

let p = fs.readFileSync('src/app/dashboard/admin/grupos/[id]/evaluar/page.tsx', 'utf8');

p = p.replace(
  "from(users).where(eq(users.groupId, groupId));",
  "from(users).where(groupData.name === '_SIN_GRUPO_' ? isNull(users.groupId) : eq(users.groupId, groupId));"
);

p = p.replace(
  "import { eq } from 'drizzle-orm';",
  "import { eq, isNull } from 'drizzle-orm';"
);

fs.writeFileSync('src/app/dashboard/admin/grupos/[id]/evaluar/page.tsx', p);
