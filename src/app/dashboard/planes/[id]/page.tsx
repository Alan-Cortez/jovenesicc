import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth';
import { db } from '@/lib/db';
import { readingPlans, readingPlanDays, readingProgress } from '@/lib/schema';
import { eq, asc, and } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import PlanDetailClient from './PlanDetailClient';

import { getPlanDevotionalsByUserAction } from '@/app/actions/diario';

export default async function PlanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session')?.value;
  if (!sessionToken) redirect('/login');
  
  let user;
  try {
    user = await decrypt(sessionToken);
  } catch {
    redirect('/login');
  }

  const { id } = await params;
  const planId = parseInt(id, 10);
  if (isNaN(planId)) redirect('/dashboard/planes');

  // Buscar el plan
  const planResult = await db.select().from(readingPlans).where(eq(readingPlans.id, planId)).limit(1);
  const plan = planResult[0];

  if (!plan) {
    redirect('/dashboard/planes');
  }

  // Buscar los días del plan
  const days = await db.select().from(readingPlanDays).where(eq(readingPlanDays.planId, planId)).orderBy(asc(readingPlanDays.dayNumber));

  // Buscar progreso del usuario en este plan
  const progress = await db.select().from(readingProgress).where(and(eq(readingProgress.userId, user.id), eq(readingProgress.planId, planId)));

  // Buscar devocionales del usuario para este plan
  const diariosResult = await getPlanDevotionalsByUserAction(planId);
  const diarios = diariosResult.success && diariosResult.data ? diariosResult.data : [];

  return (
    <div style={{ padding: '24px' }}>
      <PlanDetailClient plan={plan} days={days} progress={progress} diarios={diarios} />
    </div>
  );
}
