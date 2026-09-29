const fs = require('fs');

let c = fs.readFileSync('src/app/actions/notifications.ts', 'utf8');

c = c.replace(
  "userId?: number | null;",
  "userId?: number | null;\n  actorId?: number;"
);

c = c.replace(
  "if (targetUsers.length > 0) {",
  "if (data.actorId) {\n      targetUsers = targetUsers.filter(id => id !== data.actorId);\n    }\n\n    if (targetUsers.length > 0) {"
);

fs.writeFileSync('src/app/actions/notifications.ts', c);
