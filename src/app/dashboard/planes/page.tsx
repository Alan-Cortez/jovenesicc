import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth';
import { db } from '@/lib/db';
import { readingPlans } from '@/lib/schema';
import { eq, desc } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import PlanSearchClient from './PlanSearchClient';

export default async function PlanesPage() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session')?.value;
  if (!sessionToken) redirect('/login');
  
  try {
    await decrypt(sessionToken);
  } catch {
    redirect('/login');
  }

  // Traer todos los planes activos (excluyendo el plan "Personal")
  const { and, not } = await import('drizzle-orm');
  const planes = await db
    .select()
    .from(readingPlans)
    .where(and(eq(readingPlans.isActive, 1), not(eq(readingPlans.title, 'Personal'))))
    .orderBy(desc(readingPlans.createdAt));

  return (
    <div style={{ padding: '40px 24px', maxWidth: '800px', margin: '0 auto' }}>
      <h2 style={{ fontSize: '2rem', marginBottom: '32px' }}>Descubrir Planes</h2>
      <PlanSearchClient planes={planes} />
    </div>
  );
}
