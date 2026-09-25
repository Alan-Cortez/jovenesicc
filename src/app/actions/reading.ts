'use server';

import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth';
import { db } from '@/lib/db';
import { readingProgress, readingPlanDays, users, devotionals, xpLog } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function startPlanAction(planId: number) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session')?.value;
  if (!sessionToken) return { error: 'No autenticado' };
  
  let user;
  try {
    user = await decrypt(sessionToken);
  } catch {
    return { error: 'No autenticado' };
  }

  try {
    // 1. Fetch all days for this plan
    const days = await db.select().from(readingPlanDays).where(eq(readingPlanDays.planId, planId));
    if (days.length === 0) return { error: 'Este plan no tiene contenido aún.' };

    // 2. Check if already started
    const existing = await db.select().from(readingProgress)
      .where(and(eq(readingProgress.userId, user.id), eq(readingProgress.planId, planId)))
      .limit(1);

    if (existing.length > 0) return { success: true }; // Already started

    // 3. Create progress records for all days. First day is available, rest are locked.
    const progressInserts = days.map((day, index) => ({
      userId: user.id,
      planId,
      planDayId: day.id,
      status: index === 0 ? 'available' : 'locked', // Day 1 available immediately
    }));

    await db.insert(readingProgress).values(progressInserts);
    
    revalidatePath(`/dashboard/planes/${planId}`);
    return { success: true };
  } catch (error) {
    console.error('Error starting plan:', error);
    return { error: 'Error interno al iniciar el plan' };
  }
}

export async function finishDayAction(
  planId: number, 
  planDayId: number, 
  whatIRead: string, 
  whatIUnderstood: string, 
  whatGodToldMe: string, 
  whatIPractice: string
) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session')?.value;
  if (!sessionToken) return { error: 'No autenticado' };
  
  let user;
  try {
    user = await decrypt(sessionToken);
  } catch {
    return { error: 'No autenticado' };
  }

  try {
    // 1. Get the progress record
    const progress = await db.select().from(readingProgress)
      .where(and(
        eq(readingProgress.userId, user.id), 
        eq(readingProgress.planDayId, planDayId)
      )).limit(1);

    if (progress.length === 0) return { error: 'Registro de progreso no encontrado' };
    if (progress[0].status === 'completed') return { error: 'Este día ya fue completado' };

    // 2. Save the devotional (journal entry)
    await db.insert(devotionals).values({
      userId: user.id,
      planDayId,
      whatIRead: whatIRead || 'Completó la lectura.',
      whatIUnderstood,
      whatGodToldMe,
      whatIPractice,
      status: 'submitted',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // 3. Get XP Reward for this day
    const dayResult = await db.select({ xpReward: readingPlanDays.xpReward }).from(readingPlanDays).where(eq(readingPlanDays.id, planDayId)).limit(1);
    const xpReward = dayResult[0]?.xpReward || 10;

    // 4. Update progress to completed
    await db.update(readingProgress)
      .set({ status: 'completed', completedAt: new Date().toISOString() })
      .where(eq(readingProgress.id, progress[0].id));

    // 5. Add XP to User
    const { sql } = await import('drizzle-orm');
    await db.update(users).set({ xp: sql`${users.xp} + ${xpReward}` }).where(eq(users.id, user.id));

    // 6. Log XP
    await db.insert(xpLog).values({
      userId: user.id,
      amount: xpReward,
      reason: 'Lectura diaria completada',
      sourceType: 'reading',
      sourceId: planDayId,
      createdAt: new Date().toISOString()
    });

    // 7. Unlock the next day
    // We need to find the day with the next DayNumber
    const allDays = await db.select().from(readingPlanDays).where(eq(readingPlanDays.planId, planId));
    const currentDay = allDays.find(d => d.id === planDayId);
    if (currentDay) {
      const nextDay = allDays.find(d => d.dayNumber === currentDay.dayNumber + 1);
      if (nextDay) {
        await db.update(readingProgress)
          .set({ status: 'available' })
          .where(and(eq(readingProgress.userId, user.id), eq(readingProgress.planDayId, nextDay.id), eq(readingProgress.status, 'locked')));
      }
    }

    revalidatePath(`/dashboard/planes/${planId}`);
    return { success: true };
  } catch (error) {
    console.error('Error finishing day:', error);
    return { error: 'Error interno al completar el día' };
  }
}
