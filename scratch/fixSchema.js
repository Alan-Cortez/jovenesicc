const fs = require('fs');
let content = fs.readFileSync('src/lib/schema.ts', 'utf8');

// The issue is strings like: sql`role IN ('joven','lider','admin'`
// We need them to be: sql`role IN ('joven','lider','admin')`
content = content.replace(/IN \(([^`]+)`/g, "IN ($1)`");
content = content.replace(/IN \(([^`]+)`/g, "IN ($1)`"); // wait if it replaces incorrectly

// Actually let's just replace all occurrences of `'` before the backtick with `')`
content = content.replace(/IN \('([^`]+)'`/g, "IN ('$1')`");

fs.writeFileSync('src/lib/schema.ts', content);
