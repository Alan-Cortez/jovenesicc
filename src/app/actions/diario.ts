'use server';

import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth';
import { db } from '@/lib/db';
import { devotionals, readingPlanDays, readingPlans, users } from '@/lib/schema';
import { eq, desc, and } from 'drizzle-orm';

// Obtiene los devocionales de un usuario para un plan específico
export async function getPlanDevotionalsByUserAction(planId: number) {
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
    const results = await db.select({
      id: devotionals.id,
      whatIRead: devotionals.whatIRead,
      whatIUnderstood: devotionals.whatIUnderstood,
      whatGodToldMe: devotionals.whatGodToldMe,
      whatIPractice: devotionals.whatIPractice,
      createdAt: devotionals.createdAt,
      dayNumber: readingPlanDays.dayNumber,
      dayTitle: readingPlanDays.title,
    })
    .from(devotionals)
    .innerJoin(readingPlanDays, eq(devotionals.planDayId, readingPlanDays.id))
    .where(and(eq(devotionals.userId, user.id), eq(readingPlanDays.planId, planId)))
    .orderBy(desc(readingPlanDays.dayNumber)); // Order by day instead of date to be cleaner

    return { success: true, data: results };
  } catch (error) {
    console.error('Error fetching plan devotionals:', error);
    return { error: 'Error al cargar tus reflexiones.' };
  }
}

// Obtiene todos los devocionales de todos los usuarios para un plan especifico
export async function getAllPlanDevotionalsAction(planId: number) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session')?.value;
  if (!sessionToken) return { error: 'No autenticado' };
  
  let user;
  try {
    user = await decrypt(sessionToken);
  } catch {
    return { error: 'No autenticado' };
  }

  if (user.role !== 'admin' && user.role !== 'lider') {
    return { error: 'No autorizado' };
  }

  try {
    const results = await db.select({
      id: devotionals.id,
      userId: devotionals.userId,
      whatIRead: devotionals.whatIRead,
      whatIUnderstood: devotionals.whatIUnderstood,
      whatGodToldMe: devotionals.whatGodToldMe,
      whatIPractice: devotionals.whatIPractice,
      createdAt: devotionals.createdAt,
      dayNumber: readingPlanDays.dayNumber,
      userName: users.name,
      userAvatar: users.avatar,
    })
    .from(devotionals)
    .innerJoin(readingPlanDays, eq(devotionals.planDayId, readingPlanDays.id))
    .innerJoin(users, eq(devotionals.userId, users.id))
    .where(eq(readingPlanDays.planId, planId))
    .orderBy(desc(devotionals.createdAt));

    return { success: true, data: results };
  } catch (error) {
    console.error('Error fetching all plan devotionals:', error);
    return { error: 'Error al cargar las respuestas del plan.' };
  }
}

// Actualizar un devocional existente (Edición)
export async function updateDevotionalAction(
  devotionalId: number, 
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
    // 1. Check if devotional belongs to user
    const existing = await db.select().from(devotionals).where(and(eq(devotionals.id, devotionalId), eq(devotionals.userId, user.id))).limit(1);
    if (existing.length === 0) return { error: 'No se encontró la reflexión o no tienes permiso para editarla.' };

    // 2. Update it
    await db.update(devotionals).set({
      whatIRead,
      whatIUnderstood,
      whatGodToldMe,
      whatIPractice,
      updatedAt: new Date().toISOString(),
    }).where(eq(devotionals.id, devotionalId));

    return { success: true };
  } catch (error) {
    console.error('Error updating devotional:', error);
    return { error: 'Error al actualizar la reflexión.' };
  }
}
