const fs = require('fs');

let c = fs.readFileSync('src/app/actions/notifications.ts', 'utf8');

c = c.replace(
  "export async function createNotification(data: {",
  "export async function createNotification(data: {\n  title?: string;"
);

c = c.replace(
  "content: data.content,",
  "content: data.content,\n      title: data.title || 'Sistema',"
);

// Wait, I also need to update the SELECT to fetch 'title' maybe? No, the client doesn't use it right now.
// Let's add it to the select just in case.
c = c.replace(
  "content: notifications.content,",
  "content: notifications.content,\n        title: notifications.title,"
);

fs.writeFileSync('src/app/actions/notifications.ts', c);
