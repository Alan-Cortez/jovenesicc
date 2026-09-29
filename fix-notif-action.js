const fs = require('fs');
let c = fs.readFileSync('src/app/actions/notifications.ts', 'utf8');

c = c.replace(
  "content: data.content,",
  "content: data.content,\n      title: '',"
);

fs.writeFileSync('src/app/actions/notifications.ts', c);
