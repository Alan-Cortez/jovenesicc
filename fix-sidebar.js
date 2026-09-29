const fs = require('fs');

let c = fs.readFileSync('src/app/dashboard/SidebarClient.tsx', 'utf8');

c = c.replace(
  "export default function SidebarClient({\n  userName,\n  userRole,\n  pendingCount,\n}: {\n  userName: string;\n  userRole: string;\n  pendingCount: number;\n}) {",
  "export default function SidebarClient({\n  userName,\n  userRole,\n  pendingCount,\n  activeMissionsCount = 0,\n}: {\n  userName: string;\n  userRole: string;\n  pendingCount: number;\n  activeMissionsCount?: number;\n}) {"
);

const navLinkOld = `{item.label}`;
const navLinkNew = `<span>{item.label}</span>
              {item.href === '/dashboard/misiones' && activeMissionsCount > 0 && (
                <span className={styles.badge}>{activeMissionsCount > 99 ? '99+' : activeMissionsCount}</span>
              )}`;

c = c.replace(navLinkOld, navLinkNew);

fs.writeFileSync('src/app/dashboard/SidebarClient.tsx', c);
