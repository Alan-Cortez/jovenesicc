const fs = require('fs');

// Fix NotificationBell.tsx (formatTime)
let n = fs.readFileSync('src/app/dashboard/NotificationBell.tsx', 'utf8');

const newFormatTime = `  const formatTime = (dateStr: string) => {
    if (!dateStr) return '';
    let isoStr = dateStr;
    if (!isoStr.includes('T')) isoStr = isoStr.replace(' ', 'T');
    if (!isoStr.endsWith('Z')) isoStr += 'Z';
    const date = new Date(isoStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    if (isNaN(diffMs) || diffMs < 0) return 'Hace un momento';
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return \`Hace \${diffMins || 1} m\`;
    if (diffHours < 24) return \`Hace \${diffHours} h\`;
    if (diffDays === 1) return \`Ayer\`;
    return \`Hace \${diffDays} d\`;
  };`;

n = n.replace(/const formatTime = \(dateStr: string\) => \{[\s\S]*?return `Hace \$\{diffDays\} d`;\n  \};/, newFormatTime);

fs.writeFileSync('src/app/dashboard/NotificationBell.tsx', n);

// Fix notification.module.css
let c = fs.readFileSync('src/app/dashboard/notification.module.css', 'utf8');
c = c.replace(
  "color: #1da1f2;\n  font-size: 0.85rem;\n  font-weight: 600;",
  "color: var(--color-text-muted);\n  font-size: 0.8rem;\n  font-weight: 500;"
);
c = c.replace(
  "font-size: 1.4rem;\n  font-weight: 800;",
  "font-size: 1.5rem;\n  font-weight: 700;\n  letter-spacing: -0.02em;"
);
c = c.replace(
  "font-size: 0.9rem;",
  "font-size: 0.95rem;"
);
// Adjust spacing in .item
c = c.replace(
  ".item {\n  display: flex;\n  gap: 14px;\n  padding: 16px 20px;",
  ".item {\n  display: flex;\n  gap: 16px;\n  padding: 18px 24px;"
);
c = c.replace(
  "width: 44px;\n  height: 44px;",
  "width: 48px;\n  height: 48px;"
);
c = c.replace(
  "width: 44px;\n  height: 44px;",
  "width: 48px;\n  height: 48px;"
);

// We can hide the footer to make it cleaner like Instagram
c = c.replace(
  ".footer {\n  padding: 16px;\n  text-align: center;\n  border-top: 1px solid var(--glass-border);\n  background: rgba(0,0,0,0.2);\n}",
  ".footer {\n  display: none;\n}"
);

fs.writeFileSync('src/app/dashboard/notification.module.css', c);
