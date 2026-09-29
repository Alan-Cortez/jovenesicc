const fs = require('fs');

let c = fs.readFileSync('src/app/dashboard/NotificationBell.tsx', 'utf8');

c = c.replace(
  "import { Bell, Heart, MessageSquare, Gift, Award, ShieldAlert, CheckCircle, Info } from 'lucide-react';",
  "import { Bell, Heart, MessageSquare, Gift, Award, ShieldAlert, CheckCircle, Info, ArrowLeft } from 'lucide-react';"
);

c = c.replace(
  /<div className=\{styles\.header\}>\s*<h3 className=\{styles\.title\}>Notificaciones<\/h3>/,
  `<div className={styles.header}>
            <div className={styles.headerLeft}>
              <button className={styles.backBtn} onClick={() => setIsOpen(false)}>
                <ArrowLeft size={24} />
              </button>
              <h3 className={styles.title}>Notificaciones</h3>
            </div>`
);

fs.writeFileSync('src/app/dashboard/NotificationBell.tsx', c);
