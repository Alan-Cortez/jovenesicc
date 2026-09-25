import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { taskSubmissions } from '@/lib/schema';
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
      .where(eq(taskSubmissions.status, 'pending'));
    pendingCount = result[0]?.count ?? 0;
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--color-tertiary)' }}>
      <SidebarClient
        userName={user.name}
        userRole={user.role}
        pendingCount={pendingCount}
      />
      <main style={{ flex: 1, height: '100vh', overflowY: 'auto' }}>
        {children}
      </main>
    </div>
  );
}
