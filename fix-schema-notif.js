const fs = require('fs');
let c = fs.readFileSync('src/lib/schema.ts', 'utf8');

c = c.replace(
  "type: text().notNull(), // 'like', 'comment', 'mission', 'level', 'system', etc.",
  "type: text().notNull(),\n\ttitle: text().notNull().default(''),\n\tbody: text(),"
);

fs.writeFileSync('src/lib/schema.ts', c);
