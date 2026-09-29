const fs = require('fs');

let c = fs.readFileSync('src/app/dashboard/layout.tsx', 'utf8');

const replacement = `import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { tasks, taskSubmissions } from '@/lib/schema';
import { eq, count } from 'drizzle-orm';
import SidebarClient from './SidebarClient';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session')?.value;
  if (!sessionToken) redirect('/login');

  let user;
  try {
    user = await decrypt(sessionToken);
  } catch {
    redirect('/login');
  }

  // Badge: revisiones pendientes (solo para admin/lider)
  let pendingCount = 0;
  if (user.role === 'admin' || user.role === 'lider') {
    const result = await db
      .select({ count: count() })
      .from(taskSubmissions)
      .where(eq(taskSubmissions.status, 'submitted'));
    pendingCount = result[0]?.count ?? 0;
  }

  // Badge: misiones pendientes (para todos los usuarios)
  let activeMissionsCount = 0;
  const activeTasks = await db.select().from(tasks).where(eq(tasks.isActive, 1));
  const relevantTasks = activeTasks.filter((t) => {
    if (t.assignedTo === 'all') return true;
    if (t.assignedTo === 'individual' && t.userId === user.id) return true;
    if (t.assignedTo === 'group' && user.groupId && t.groupId === user.groupId) return true;
    return false;
  });

  if (relevantTasks.length > 0) {
    const submissions = await db.select().from(taskSubmissions).where(eq(taskSubmissions.userId, user.id));
    const submissionMap = new Map(submissions.map((s) => [s.taskId, s.status]));
    activeMissionsCount = relevantTasks.filter(t => {
      const status = submissionMap.get(t.id);
      return !status || status === 'rejected';
    }).length;
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--color-tertiary)' }}>
      <SidebarClient
        userName={user.name}
        userRole={user.role}
        pendingCount={pendingCount}
        activeMissionsCount={activeMissionsCount}
      />
      <main style={{ flex: 1, height: '100vh', overflowY: 'auto' }}>
        {children}
      </main>
    </div>
  );
}
`;

fs.writeFileSync('src/app/dashboard/layout.tsx', replacement);
