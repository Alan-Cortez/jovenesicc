import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth';
import { db } from '@/lib/db';
import { readingPlans, readingPlanDays, readingProgress } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import LecturaClient from './LecturaClient';

export default async function LecturaPage({ params }: { params: Promise<{ id: string, dayId: string }> }) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session')?.value;
  if (!sessionToken) redirect('/login');
  
  let user;
  try {
    user = await decrypt(sessionToken);
  } catch {
    redirect('/login');
  }

  const { id, dayId: dId } = await params;
  const planId = parseInt(id, 10);
  const dayId = parseInt(dId, 10);
  if (isNaN(planId) || isNaN(dayId)) redirect('/dashboard/planes');

  const planResult = await db.select().from(readingPlans).where(eq(readingPlans.id, planId)).limit(1);
  const plan = planResult[0];

  const dayResult = await db.select().from(readingPlanDays).where(eq(readingPlanDays.id, dayId)).limit(1);
  const day = dayResult[0];

  if (!plan || !day) redirect('/dashboard/planes');

  const progress = await db.select().from(readingProgress).where(and(eq(readingProgress.userId, user.id), eq(readingProgress.planDayId, dayId))).limit(1);
  const isCompleted = progress[0]?.status === 'completed';

  return <LecturaClient plan={plan} day={day} isCompleted={isCompleted} />;
}
