import React from 'react';
import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth';
import { db } from '@/lib/db';
import { readingPlans, readingPlanDays } from '@/lib/schema';
import { eq, asc } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { getAllPlanDevotionalsAction } from '@/app/actions/diario';
import AdminPlanRespuestasClient from './AdminPlanRespuestasClient';

export default async function AdminPlanRespuestasPage({ params }: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session')?.value;
  if (!sessionToken) redirect('/login');
  
  let admin;
  try {
    admin = await decrypt(sessionToken);
    if (admin.role !== 'admin' && admin.role !== 'lider') redirect('/dashboard');
  } catch {
    redirect('/login');
  }

  const { id } = await params;
  const planId = parseInt(id, 10);
  if (isNaN(planId)) redirect('/dashboard/admin/planes');

  // Buscar el plan
  const planResult = await db.select().from(readingPlans).where(eq(readingPlans.id, planId)).limit(1);
  const plan = planResult[0];

  if (!plan) {
    redirect('/dashboard/admin/planes');
  }

  // Buscar los días del plan
  const days = await db.select().from(readingPlanDays).where(eq(readingPlanDays.planId, planId)).orderBy(asc(readingPlanDays.dayNumber));

  // Buscar todas las respuestas de este plan
  const diariosResult = await getAllPlanDevotionalsAction(planId);
  const diarios = diariosResult.success && diariosResult.data ? diariosResult.data : [];

  return <AdminPlanRespuestasClient diarios={diarios} plan={plan} days={days} />;
}
