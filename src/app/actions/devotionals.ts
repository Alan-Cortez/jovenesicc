'use server';

import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth';
import { db } from '@/lib/db';
import { devotionals } from '@/lib/schema';
import { revalidatePath } from 'next/cache';

export async function createDevotionalAction(formData: FormData) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session')?.value;
  if (!sessionToken) return { error: 'No autenticado' };
  
  let user;
  try {
    user = await decrypt(sessionToken);
  } catch {
    return { error: 'No autenticado' };
  }

  const whatIRead = formData.get('whatIRead') as string;
  const whatIUnderstood = formData.get('whatIUnderstood') as string;
  const whatGodToldMe = formData.get('whatGodToldMe') as string;
  const whatIPractice = formData.get('whatIPractice') as string;
  const isPublic = formData.get('isPublic') === 'on' ? 1 : 0;
  
  let planDayId = 1; // Fallback
  try {
    const { readingPlanDays, readingPlans } = await import('@/lib/schema');
    const { eq } = await import('drizzle-orm');
    
    // Buscar si ya existe el plan Personal
    const personalPlan = await db.select().from(readingPlans).where(eq(readingPlans.title, 'Personal')).limit(1);
    
    if (personalPlan.length > 0) {
      const personalDay = await db.select().from(readingPlanDays).where(eq(readingPlanDays.planId, personalPlan[0].id)).limit(1);
      if (personalDay.length > 0) {
        planDayId = personalDay[0].id;
      }
    } else {
      // Si no existe, usamos null o el fallback. (Idealmente se crea por DB admin)
      // Como planDayId no puede ser nulo, usamos el fallback y en UI ocultamos si planTitle='Personal'
      // Pero si no existe 'Personal', dejemos que use 1. (O creémoslo on the fly).
      const newPlan = await db.insert(readingPlans).values({
        title: 'Personal',
        description: 'Devocionales libres',
        totalDays: 1,
        isActive: 0,
        createdBy: user.id
      }).returning({ id: readingPlans.id });
      
      const newDay = await db.insert(readingPlanDays).values({
        planId: newPlan[0].id,
        dayNumber: 1,
        title: 'Libre',
        bibleRefs: 'N/A',
        content: '',
        xpReward: 0
      }).returning({ id: readingPlanDays.id });
      
      planDayId = newDay[0].id;
    }
  } catch(e) {
    console.error("Error securing personal plan", e);
  }

  if (!whatIRead || !whatIUnderstood || !whatGodToldMe || !whatIPractice) {
    return { error: 'Todos los campos son obligatorios' };
  }

  try {
    await db.insert(devotionals).values({
      userId: user.id,
      planDayId: planDayId,
      whatIRead,
      whatIUnderstood,
      whatGodToldMe,
      whatIPractice,
      status: 'submitted',
      isPublic,
    });

    // Grant XP for devotional
    const { grantXP, updateStreak } = await import('@/lib/gamification');
    await grantXP({ userId: user.id, amount: 10, reason: 'Devocional publicado', sourceType: 'devotional' });
    await updateStreak(user.id);

    revalidatePath('/dashboard/devocionales');
    return { success: true };
  } catch (error) {
    console.error('Error creating devotional:', error);
    return { error: 'Error al guardar el devocional' };
  }
}

export async function deleteDevotionalAction(formData: FormData) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session')?.value;
  if (!sessionToken) return;
  
  let user;
  try {
    user = await decrypt(sessionToken);
  } catch {
    return;
  }

  const id = parseInt(formData.get('id') as string, 10);
  if (!id) return;

  try {
    const { eq, and } = await import('drizzle-orm');
    // Solo el dueno o un admin puede borrar
    if (user.role === 'admin') {
      await db.delete(devotionals).where(eq(devotionals.id, id));
    } else {
      await db.delete(devotionals).where(
        and(eq(devotionals.id, id), eq(devotionals.userId, user.id))
      );
    }
    revalidatePath('/dashboard/devocionales');
  } catch (error) {
    console.error('Error deleting devotional:', error);
  }
}
