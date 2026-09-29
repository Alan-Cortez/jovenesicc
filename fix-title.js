const fs = require('fs');
let c = fs.readFileSync('src/app/actions/notifications.ts', 'utf8');

c = c.replace(/      title: '',\r?\n/g, "");
fs.writeFileSync('src/app/actions/notifications.ts', c);
