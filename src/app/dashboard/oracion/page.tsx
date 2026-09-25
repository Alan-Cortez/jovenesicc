import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth';
import { db } from '@/lib/db';
import { prayerRequests } from '@/lib/schema';
import { eq, desc } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import OracionClient from './OracionClient';

export default async function OracionPage() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session')?.value;
  if (!sessionToken) redirect('/login');

  let user;
  try {
    user = await decrypt(sessionToken);
  } catch {
    redirect('/login');
  }

  // Solo las peticiones del usuario actual
  const requests = await db
    .select()
    .from(prayerRequests)
    .where(eq(prayerRequests.userId, user.id))
    .orderBy(desc(prayerRequests.createdAt));

  return (
    <OracionClient
      userId={user.id}
      requests={requests.map((r) => ({
        id: r.id,
        content: r.content,        // FIX: era req.request — campo correcto es content
        isAnonymous: r.isAnonymous,
        isPublic: r.isPublic,
        status: r.status,
        createdAt: r.createdAt,
        answeredAt: r.answeredAt ?? null,
      }))}
    />
  );
}
