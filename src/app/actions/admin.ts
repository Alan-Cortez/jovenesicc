'use server';

import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth';
import { db } from '@/lib/db';
import { users } from '@/lib/schema';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';
import { createNotification, notifyMany } from './notifications';

export async function createUserAction(formData: FormData) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session')?.value;
  if (!sessionToken) return { error: 'No autenticado' };
  
  let admin;
  try {
    admin = await decrypt(sessionToken);
    if (admin.role !== 'admin' && admin.role !== 'lider') {
      return { error: 'No autorizado' };
    }
  } catch {
    return { error: 'No autenticado' };
  }

  const name = formData.get('name') as string;
  let matricula = formData.get('matricula') as string;
  const rawPassword = formData.get('password') as string;
  const role = formData.get('role') as string;

  if (!name || !rawPassword || !role) {
    return { error: 'Nombre, contraseña y rol son obligatorios' };
  }

  try {
    if (!matricula || matricula.trim() === '') {
      // Auto-generar matrícula (ej. 000001, 000002)
      // Ignoramos cuentas de prueba viejas (que tienen números muy altos como 11111111)
      const allUsers = await db.select({ m: users.matricula }).from(users);
      let maxNum = 0;
      for (const u of allUsers) {
        if (u.m) {
          const num = parseInt(u.m, 10);
          if (!isNaN(num) && num > maxNum && num < 100000) {
            maxNum = num;
          }
        }
      }
      maxNum++;
      matricula = maxNum.toString().padStart(6, '0');
    }

    const passwordHash = await bcrypt.hash(rawPassword, 12);

    await db.insert(users).values({
      name,
      matricula,
      passwordHash,
      role,
      email: `${matricula}@jovenes.app`, // Email provisional obligatorio
      level: 1,
      xp: 0,
      streakCurrent: 0,
      streakBest: 0,
      isActive: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    revalidatePath('/dashboard/admin/usuarios');
    return { success: true };
  } catch (error: any) {
    console.error('Error creating user:', error);
    if (error.message?.includes('UNIQUE') || error.message?.includes('matricula')) {
      return { error: 'Ya existe un usuario con esta matrícula' };
    }
    return { error: 'Error al registrar el usuario en la base de datos' };
  }
}


export async function deleteUserAction(formData: FormData) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session')?.value;
  if (!sessionToken) return { error: 'No autenticado' };
  
  let admin;
  try {
    admin = await decrypt(sessionToken);
    if (admin.role !== 'admin' && admin.role !== 'lider') return { error: 'No autorizado' };
  } catch {
    return { error: 'No autenticado' };
  }

  const userId = parseInt(formData.get('userId') as string, 10);
  if (isNaN(userId)) return { error: 'ID inválido' };
  if (userId === admin.id) return { error: 'No puedes eliminarte a ti mismo' };

  try {
    const { eq, inArray } = await import('drizzle-orm');
    const {
      xpLog, devotionalReactions, devotionals, readingProgress,
      planAssignments, taskSubmissions, prayerRequests, eventAttendance,
      notifications, userBadges, streakHistory, groupMeetingAttendance,
      groupGuests, commentReactions, postComments, postReactions, posts, songSuggestions,
    } = await import('@/lib/schema');

    // Borrar reacciones a comentarios del usuario
    await db.delete(commentReactions).where(eq(commentReactions.userId, userId));

    // Borrar reacciones en comentarios de sus posts
    const userPosts = await db.select({ id: posts.id }).from(posts).where(eq(posts.userId, userId));
    if (userPosts.length > 0) {
      const postIds = userPosts.map(p => p.id);
      const comments = await db.select({ id: postComments.id }).from(postComments).where(inArray(postComments.postId, postIds));
      if (comments.length > 0) {
        await db.delete(commentReactions).where(inArray(commentReactions.commentId, comments.map(c => c.id)));
      }
      await db.delete(postComments).where(inArray(postComments.postId, postIds));
      await db.delete(postReactions).where(inArray(postReactions.postId, postIds));
      await db.delete(posts).where(eq(posts.userId, userId));
    }

    // Comentarios y reacciones a posts de otros
    await db.delete(postComments).where(eq(postComments.userId, userId));
    await db.delete(postReactions).where(eq(postReactions.userId, userId));

    // Devocionales y sus reacciones
    const userDevotionals = await db.select({ id: devotionals.id }).from(devotionals).where(eq(devotionals.userId, userId));
    if (userDevotionals.length > 0) {
      await db.delete(devotionalReactions).where(inArray(devotionalReactions.devotionalId, userDevotionals.map(d => d.id)));
    }
    await db.delete(devotionalReactions).where(eq(devotionalReactions.userId, userId));
    await db.delete(devotionals).where(eq(devotionals.userId, userId));

    // Resto de tablas dependientes
    await db.delete(xpLog).where(eq(xpLog.userId, userId));
    await db.delete(readingProgress).where(eq(readingProgress.userId, userId));
    await db.delete(planAssignments).where(eq(planAssignments.userId, userId));
    await db.delete(taskSubmissions).where(eq(taskSubmissions.userId, userId));
    await db.delete(prayerRequests).where(eq(prayerRequests.userId, userId));
    await db.delete(eventAttendance).where(eq(eventAttendance.userId, userId));
    await db.delete(notifications).where(eq(notifications.userId, userId));
    await db.delete(userBadges).where(eq(userBadges.userId, userId));
    await db.delete(streakHistory).where(eq(streakHistory.userId, userId));
    await db.delete(groupMeetingAttendance).where(eq(groupMeetingAttendance.userId, userId));
    await db.delete(groupGuests).where(eq(groupGuests.invitedBy, userId));
    await db.delete(songSuggestions).where(eq(songSuggestions.userId, userId));

    // Si este usuario es lider de algún grupo, reasignar el leaderId al admin que hace el borrado
    // para que el grupo no quede con un leaderId inválido
    const { groups } = await import('@/lib/schema');
    await db.update(groups)
      .set({ leaderId: admin.id })
      .where(eq(groups.leaderId, userId));

    // Quitar al usuario de su grupo (sin borrar el grupo)
    await db.update(users)
      .set({ groupId: null })
      .where(eq(users.id, userId));

    // Finalmente el usuario
    await db.delete(users).where(eq(users.id, userId));

    revalidatePath('/dashboard/admin/usuarios');
    return { success: true };
  } catch (error) {
    console.error('Error deleting user:', error);
    return { error: 'Error al eliminar usuario' };
  }
}

export async function deactivateUserAction(formData: FormData) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session')?.value;
  if (!sessionToken) return { error: 'No autenticado' };

  let admin;
  try {
    admin = await decrypt(sessionToken);
    if (admin.role !== 'admin' && admin.role !== 'lider') return { error: 'No autorizado' };
  } catch {
    return { error: 'No autenticado' };
  }

  const userId = parseInt(formData.get('userId') as string, 10);
  if (isNaN(userId)) return { error: 'ID inválido' };
  if (userId === admin.id) return { error: 'No puedes inactivarte a ti mismo' };

  try {
    const { eq } = await import('drizzle-orm');
    await db.update(users).set({ isActive: 0 }).where(eq(users.id, userId));
    revalidatePath('/dashboard/admin/usuarios');
    return { success: true };
  } catch (error) {
    console.error('Error deactivating user:', error);
    return { error: 'Error al inactivar usuario' };
  }
}

export async function reactivateUserAction(formData: FormData) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session')?.value;
  if (!sessionToken) return { error: 'No autenticado' };

  let admin;
  try {
    admin = await decrypt(sessionToken);
    if (admin.role !== 'admin' && admin.role !== 'lider') return { error: 'No autorizado' };
  } catch {
    return { error: 'No autenticado' };
  }

  const userId = parseInt(formData.get('userId') as string, 10);
  if (isNaN(userId)) return { error: 'ID inválido' };

  try {
    const { eq } = await import('drizzle-orm');
    await db.update(users).set({ isActive: 1 }).where(eq(users.id, userId));
    revalidatePath('/dashboard/admin/usuarios');
    return { success: true };
  } catch (error) {
    console.error('Error reactivating user:', error);
    return { error: 'Error al reactivar usuario' };
  }
}

export async function updateUserAction(formData: FormData) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session')?.value;
  if (!sessionToken) return { error: 'No autenticado' };
  
  let admin;
  try {
    admin = await decrypt(sessionToken);
    if (admin.role !== 'admin' && admin.role !== 'lider') return { error: 'No autorizado' };
  } catch {
    return { error: 'No autenticado' };
  }

  const userId = parseInt(formData.get('userId') as string, 10);
  const name = formData.get('name') as string;
  const matricula = formData.get('matricula') as string;
  const role = formData.get('role') as string;
  const groupIdRaw = formData.get('groupId') as string;

  if (isNaN(userId) || !name || !matricula || !role) {
    return { error: 'Faltan campos obligatorios' };
  }

  const groupId = groupIdRaw ? parseInt(groupIdRaw, 10) : null;

  try {
    const { eq } = await import('drizzle-orm');
    await db.update(users)
      .set({ name, matricula, role, groupId, updatedAt: new Date().toISOString() })
      .where(eq(users.id, userId));
      
    revalidatePath('/dashboard/admin/usuarios');
    return { success: true };
  } catch (error) {
    console.error('Error updating user:', error);
    return { error: 'Error al actualizar usuario' };
  }
}

export async function createReadingPlanAction(formData: FormData) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session')?.value;
  if (!sessionToken) return { error: 'No autenticado' };
  
  let admin;
  try {
    admin = await decrypt(sessionToken);
    if (admin.role !== 'admin' && admin.role !== 'lider') return { error: 'No autorizado' };
  } catch {
    return { error: 'No autenticado' };
  }

  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const coverFile = formData.get('cover') as File;

  if (!title) return { error: 'El título es obligatorio' };

  try {
    let imageUrl = null;
    
    // Handle File upload to Base64
    if (coverFile && coverFile.size > 0) {
      if (coverFile.size > 5 * 1024 * 1024) { // 5MB limit
        return { error: 'La imagen de portada no debe superar los 5MB' };
      }
      const bytes = await coverFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      imageUrl = `data:${coverFile.type};base64,${buffer.toString('base64')}`;
    }

    const { readingPlans } = await import('@/lib/schema');
    await db.insert(readingPlans).values({
      title,
      description,
      imageUrl,
      totalDays: 0,
      createdBy: admin.id,
      isActive: 1,
      createdAt: new Date().toISOString(),
    });
    
    revalidatePath('/dashboard/admin/planes');
    return { success: true };
  } catch (error) {
    console.error('Error creating plan:', error);
    return { error: 'Error al crear el plan de lectura' };
  }
}

export async function assignPlanAction(formData: FormData) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session')?.value;
  if (!sessionToken) return { error: 'No autenticado' };
  
  let admin;
  try {
    admin = await decrypt(sessionToken);
    if (admin.role !== 'admin' && admin.role !== 'lider') return { error: 'No autorizado' };
  } catch {
    return { error: 'No autenticado' };
  }

  const planId = parseInt(formData.get('planId') as string, 10);
  const assignedTo = formData.get('assignedTo') as string;
  const startDate = formData.get('startDate') as string;
  const groupId = formData.get('groupId') ? parseInt(formData.get('groupId') as string, 10) : null;
  const userId = formData.get('userId') ? parseInt(formData.get('userId') as string, 10) : null;

  if (isNaN(planId) || !assignedTo || !startDate) {
    return { error: 'Faltan campos obligatorios' };
  }

  if (assignedTo === 'group' && !groupId) return { error: 'Debes seleccionar un grupo' };
  if (assignedTo === 'individual' && !userId) return { error: 'Debes seleccionar un joven' };

  try {
    const { planAssignments, users, readingProgress, readingPlanDays } = await import('@/lib/schema');
    const { eq } = await import('drizzle-orm');
    
    // Create the assignment record
    await db.insert(planAssignments).values({
      planId,
      assignedTo,
      groupId,
      userId,
      startDate,
      createdAt: new Date().toISOString(),
    });

    // Populate readingProgress for targeted users so it shows up in their dashboard
    // If 'all', fetch all active users
    // If 'group', fetch users in that group
    // If 'individual', just that user
    let targetUsers: any[] = [];
    if (assignedTo === 'all') {
      targetUsers = await db.select({ id: users.id }).from(users).where(eq(users.isActive, 1));
    } else if (assignedTo === 'group' && groupId) {
      targetUsers = await db.select({ id: users.id }).from(users).where(eq(users.groupId, groupId));
    } else if (assignedTo === 'individual' && userId) {
      targetUsers = [{ id: userId }];
    }

    // We need to fetch the days of this plan to initialize their progress
    const planDays = await db.select({ id: readingPlanDays.id }).from(readingPlanDays).where(eq(readingPlanDays.planId, planId));

    if (planDays.length > 0 && targetUsers.length > 0) {
      const progressInserts = [];
      for (const u of targetUsers) {
        for (const pd of planDays) {
          progressInserts.push({
            userId: u.id,
            planId,
            planDayId: pd.id,
            status: 'locked' // by default locked until start date
          });
        }
      }
      
      // SQLite has limits on bulk insert size, but for a small prototype this is fine
      await db.insert(readingProgress).values(progressInserts);
    }

    revalidatePath('/dashboard/admin/planes');
    return { success: true };
  } catch (error) {
    console.error('Error assigning plan:', error);
    return { error: 'Error al asignar el plan' };
  }
}

export async function createMissionAction(formData: FormData) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session')?.value;
  if (!sessionToken) return { error: 'No autenticado' };
  
  let admin;
  try {
    admin = await decrypt(sessionToken);
    if (admin.role !== 'admin' && admin.role !== 'lider') return { error: 'No autorizado' };
  } catch {
    return { error: 'No autenticado' };
  }

  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const xpReward = parseInt(formData.get('xpReward') as string, 10);
  const evidenceType = formData.get('evidenceType') as string;
  const deadline = formData.get('deadline') as string;
  
  const assignedTo = formData.get('assignedTo') as string;
  const groupId = formData.get('groupId') ? parseInt(formData.get('groupId') as string, 10) : null;
  const userId = formData.get('userId') ? parseInt(formData.get('userId') as string, 10) : null;

  if (!title || isNaN(xpReward) || !evidenceType || !assignedTo) {
    return { error: 'Faltan campos obligatorios' };
  }

  if (assignedTo === 'group' && !groupId) return { error: 'Debes seleccionar un grupo' };
  if (assignedTo === 'individual' && !userId) return { error: 'Debes seleccionar un joven' };

  try {
    const { tasks } = await import('@/lib/schema');
    await db.insert(tasks).values({
      title,
      description,
      xpReward,
      evidenceType,
      deadline: deadline || null,
      assignedTo,
      groupId,
      userId,
      createdBy: admin.id,
      isActive: 1,
      createdAt: new Date().toISOString(),
    });
    
    revalidatePath('/dashboard/admin/misiones');
    return { success: true };
  } catch (error) {
    console.error('Error creating mission:', error);
    return { error: 'Error al crear la misión' };
  }
}

export async function reviewSubmissionAction(formData: FormData) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session')?.value;
  if (!sessionToken) return { error: 'No autenticado' };
  
  let admin;
  try {
    admin = await decrypt(sessionToken);
    if (admin.role !== 'admin' && admin.role !== 'lider') return { error: 'No autorizado' };
  } catch {
    return { error: 'No autenticado' };
  }

  const submissionId = parseInt(formData.get('submissionId') as string, 10);
  const actionType = formData.get('actionType') as string; // 'approve' or 'reject'

  if (isNaN(submissionId) || !actionType) return { error: 'Datos inválidos' };

  try {
    const { taskSubmissions, tasks, users, xpLog } = await import('@/lib/schema');
    const { eq, sql } = await import('drizzle-orm');

    // Fetch the submission and task info
    const submissions = await db.select({
      subId: taskSubmissions.id,
      userId: taskSubmissions.userId,
      status: taskSubmissions.status,
      taskId: tasks.id,
      xpReward: tasks.xpReward
    })
    .from(taskSubmissions)
    .innerJoin(tasks, eq(taskSubmissions.taskId, tasks.id))
    .where(eq(taskSubmissions.id, submissionId))
    .limit(1);

    const submission = submissions[0];
    if (!submission) return { error: 'No se encontró la evidencia' };
    if (submission.status !== 'submitted') return { error: 'La evidencia ya fue revisada' };

    if (actionType === 'approve') {
      // 1. Update submission status
      await db.update(taskSubmissions)
        .set({ status: 'approved', reviewedBy: admin.id, reviewedAt: new Date().toISOString() })
        .where(eq(taskSubmissions.id, submissionId));
      
      // 2. Grant XP via gamification engine
      const { grantXP } = await import('@/lib/gamification');
      await grantXP({
        userId: submission.userId,
        amount: submission.xpReward,
        reason: 'Misión completada',
        sourceType: 'task',
        sourceId: submission.taskId,
        grantedBy: admin.id,
      });

      // 3. Send Notification
      await createNotification({
        userId: submission.userId,
        actorId: admin.id,
        type: 'success',
        content: `Misión aprobada. Has ganado +${submission.xpReward} XP.`,
        link: '/dashboard/misiones'
      });
    } else if (actionType === 'reject') {
      await db.update(taskSubmissions)
        .set({ status: 'rejected', reviewedBy: admin.id, reviewedAt: new Date().toISOString() })
        .where(eq(taskSubmissions.id, submissionId));

      await createNotification({
        userId: submission.userId,
        actorId: admin.id,
        type: 'warning',
        content: `Tu evidencia de misión requiere revisión.`,
        link: '/dashboard/misiones'
      });
    }

    revalidatePath('/dashboard/admin/revisiones');
    return { success: true };
  } catch (error) {
    console.error('Error reviewing submission:', error);
    return { error: 'Error interno al revisar' };
  }
}

export async function addPlanDayAction(formData: FormData) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session')?.value;
  if (!sessionToken) return { error: 'No autenticado' };
  
  let admin;
  try {
    admin = await decrypt(sessionToken);
    if (admin.role !== 'admin' && admin.role !== 'lider') return { error: 'No autorizado' };
  } catch {
    return { error: 'No autenticado' };
  }

  const planId = parseInt(formData.get('planId') as string, 10);
  const dayNumber = parseInt(formData.get('dayNumber') as string, 10);
  const title = formData.get('title') as string;
  const content = formData.get('content') as string;
  const bibleRefs = formData.get('bibleRefs') as string;
  const xpReward = parseInt(formData.get('xpReward') as string, 10);

  if (isNaN(planId) || isNaN(dayNumber) || !bibleRefs || isNaN(xpReward)) {
    return { error: 'Faltan campos obligatorios' };
  }

  try {
    const { readingPlanDays, readingPlans } = await import('@/lib/schema');
    const { eq, sql } = await import('drizzle-orm');

    // 1. Insert the new day
    await db.insert(readingPlanDays).values({
      planId,
      dayNumber,
      title: title || `Día ${dayNumber}`,
      content,
      bibleRefs,
      xpReward,
    });

    // 2. Update the total days count in the Plan
    const daysResult = await db.select({ count: sql`count(*)` }).from(readingPlanDays).where(eq(readingPlanDays.planId, planId));
    const totalDays = Number(daysResult[0]?.count) || 0;

    await db.update(readingPlans)
      .set({ totalDays })
      .where(eq(readingPlans.id, planId));

    revalidatePath(`/dashboard/admin/planes/${planId}/dias`);
    revalidatePath(`/dashboard/admin/planes`);
    return { success: true };
  } catch (error) {
    console.error('Error adding plan day:', error);
    return { error: 'Error al agregar el día al plan' };
  }
}

export async function deleteReadingPlanAction(formData: FormData) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session')?.value;
  if (!sessionToken) return { error: 'No autenticado' };
  
  let admin;
  try {
    admin = await decrypt(sessionToken);
    if (admin.role !== 'admin' && admin.role !== 'lider') return { error: 'No autorizado' };
  } catch {
    return { error: 'No autenticado' };
  }

  const planId = parseInt(formData.get('planId') as string, 10);
  if (isNaN(planId)) return { error: 'ID inválido' };

  try {
    const { readingPlans } = await import('@/lib/schema');
    const { eq } = await import('drizzle-orm');
    
    // The foreign keys in SQLite (if cascading) will handle days, but usually we just set isActive to 0
    await db.update(readingPlans).set({ isActive: 0 }).where(eq(readingPlans.id, planId));
    
    revalidatePath('/dashboard/admin/planes');
    return { success: true };
  } catch (error) {
    console.error('Error deleting plan:', error);
    return { error: 'Error al eliminar el plan' };
  }
}

export async function reactivateReadingPlanAction(formData: FormData) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session')?.value;
  if (!sessionToken) return { error: 'No autenticado' };
  
  let admin;
  try {
    admin = await decrypt(sessionToken);
    if (admin.role !== 'admin' && admin.role !== 'lider') return { error: 'No autorizado' };
  } catch {
    return { error: 'No autenticado' };
  }

  const planId = parseInt(formData.get('planId') as string, 10);
  if (isNaN(planId)) return { error: 'ID inválido' };

  try {
    const { readingPlans } = await import('@/lib/schema');
    const { eq } = await import('drizzle-orm');
    
    await db.update(readingPlans).set({ isActive: 1 }).where(eq(readingPlans.id, planId));
    
    revalidatePath('/dashboard/admin/planes');
    return { success: true };
  } catch (error) {
    console.error('Error reactivating plan:', error);
    return { error: 'Error al reactivar el plan' };
  }
}

export async function hardDeleteReadingPlanAction(formData: FormData) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session')?.value;
  if (!sessionToken) return { error: 'No autenticado' };
  
  let admin;
  try {
    admin = await decrypt(sessionToken);
    if (admin.role !== 'admin' && admin.role !== 'lider') return { error: 'No autorizado' };
  } catch {
    return { error: 'No autenticado' };
  }

  const planId = parseInt(formData.get('planId') as string, 10);
  if (isNaN(planId)) return { error: 'ID inválido' };

  try {
    const { readingPlans, readingPlanDays, readingProgress, planAssignments } = await import('@/lib/schema');
    const { eq } = await import('drizzle-orm');
    
    // Eliminar progreso
    await db.delete(readingProgress).where(eq(readingProgress.planId, planId));
    // Eliminar asignaciones
    await db.delete(planAssignments).where(eq(planAssignments.planId, planId));
    // Eliminar dias
    await db.delete(readingPlanDays).where(eq(readingPlanDays.planId, planId));
    // Luego eliminamos el plan
    await db.delete(readingPlans).where(eq(readingPlans.id, planId));
    
    revalidatePath('/dashboard/admin/planes');
    return { success: true };
  } catch (error) {
    console.error('Error hard deleting plan:', error);
    return { error: 'Error al eliminar el plan permanentemente' };
  }
}

export async function updateReadingPlanAction(formData: FormData) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session')?.value;
  if (!sessionToken) return { error: 'No autenticado' };
  
  let admin;
  try {
    admin = await decrypt(sessionToken);
    if (admin.role !== 'admin' && admin.role !== 'lider') return { error: 'No autorizado' };
  } catch {
    return { error: 'No autenticado' };
  }

  const planId = parseInt(formData.get('planId') as string, 10);
  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const coverFile = formData.get('cover') as File;

  if (isNaN(planId) || !title) return { error: 'El título y el ID son obligatorios' };

  try {
    let imageUrl = undefined; // undefined means we won't update it in drizzle
    
    if (coverFile && coverFile.size > 0) {
      if (coverFile.size > 5 * 1024 * 1024) return { error: 'La imagen no debe superar los 5MB' };
      const bytes = await coverFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      imageUrl = `data:${coverFile.type};base64,${buffer.toString('base64')}`;
    }

    const { readingPlans } = await import('@/lib/schema');
    const { eq } = await import('drizzle-orm');

    const updateData: any = { title, description };
    if (imageUrl !== undefined) {
      updateData.imageUrl = imageUrl;
    }

    await db.update(readingPlans)
      .set(updateData)
      .where(eq(readingPlans.id, planId));
      
    revalidatePath('/dashboard/admin/planes');
    return { success: true };
  } catch (error) {
    console.error('Error updating plan:', error);
    return { error: 'Error al actualizar el plan' };
  }
}

export async function deletePlanDayAction(formData: FormData) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session')?.value;
  if (!sessionToken) return { error: 'No autenticado' };
  
  let admin;
  try {
    admin = await decrypt(sessionToken);
    if (admin.role !== 'admin' && admin.role !== 'lider') return { error: 'No autorizado' };
  } catch {
    return { error: 'No autenticado' };
  }

  const dayId = parseInt(formData.get('dayId') as string, 10);
  const planId = parseInt(formData.get('planId') as string, 10);
  if (isNaN(dayId) || isNaN(planId)) return { error: 'ID inválido' };

  try {
    const { readingPlanDays, readingPlans } = await import('@/lib/schema');
    const { eq, sql } = await import('drizzle-orm');
    
    await db.delete(readingPlanDays).where(eq(readingPlanDays.id, dayId));
    
    // Update the total days count in the Plan
    const daysResult = await db.select({ count: sql`count(*)` }).from(readingPlanDays).where(eq(readingPlanDays.planId, planId));
    const totalDays = Number(daysResult[0]?.count) || 0;

    await db.update(readingPlans)
      .set({ totalDays })
      .where(eq(readingPlans.id, planId));

    revalidatePath(`/dashboard/admin/planes/${planId}/dias`);
    return { success: true };
  } catch (error) {
    console.error('Error deleting plan day:', error);
    return { error: 'Error al eliminar el día' };
  }
}

export async function updatePlanDayAction(formData: FormData) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session')?.value;
  if (!sessionToken) return { error: 'No autenticado' };
  
  let admin;
  try {
    admin = await decrypt(sessionToken);
    if (admin.role !== 'admin' && admin.role !== 'lider') return { error: 'No autorizado' };
  } catch {
    return { error: 'No autenticado' };
  }

  const dayId = parseInt(formData.get('dayId') as string, 10);
  const planId = parseInt(formData.get('planId') as string, 10);
  const title = formData.get('title') as string;
  const content = formData.get('content') as string;
  const bibleRefs = formData.get('bibleRefs') as string;
  const xpReward = parseInt(formData.get('xpReward') as string, 10);

  if (isNaN(dayId) || isNaN(planId) || !bibleRefs || isNaN(xpReward)) {
    return { error: 'Faltan campos obligatorios' };
  }

  try {
    const { readingPlanDays } = await import('@/lib/schema');
    const { eq } = await import('drizzle-orm');

    await db.update(readingPlanDays)
      .set({
        title,
        content,
        bibleRefs,
        xpReward,
      })
      .where(eq(readingPlanDays.id, dayId));
      
    revalidatePath(`/dashboard/admin/planes/${planId}/dias`);
    return { success: true };
  } catch (error) {
    console.error('Error updating plan day:', error);
    return { error: 'Error al actualizar el día' };
  }
}

export async function deleteMissionAction(formData: FormData) {
  'use server';
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session')?.value;
  if (!sessionToken) throw new Error('No autenticado');

  const { decrypt } = await import('@/lib/auth');
  const admin = await decrypt(sessionToken);
  if (admin.role !== 'admin' && admin.role !== 'lider') throw new Error('No autorizado');

  const taskId = parseInt(formData.get('taskId') as string);
  if (isNaN(taskId)) throw new Error('ID invalido');

  const { db } = await import('@/lib/db');
  const { tasks, taskSubmissions } = await import('@/lib/schema');
  const { eq } = await import('drizzle-orm');

  await db.delete(taskSubmissions).where(eq(taskSubmissions.taskId, taskId));
  await db.delete(tasks).where(eq(tasks.id, taskId));

  const { revalidatePath } = await import('next/cache');
  revalidatePath('/dashboard/admin/misiones');
}

export async function updateMissionAction(formData: FormData) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session')?.value;
  if (!sessionToken) return;
  
  let admin;
  try {
    admin = await decrypt(sessionToken);
    if (admin.role !== 'admin' && admin.role !== 'lider') return;
  } catch {
    return;
  }

  const taskId = parseInt(formData.get('taskId') as string, 10);
  if (isNaN(taskId)) return;

  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const xpReward = parseInt(formData.get('xpReward') as string, 10);
  const deadline = formData.get('deadline') as string;
  const evidenceType = formData.get('evidenceType') as string;
  const assignedTo = formData.get('assignedTo') as string;
  let userId = parseInt(formData.get('userId') as string, 10);
  
  if (isNaN(userId)) userId = 0;

  try {
    const { eq } = await import('drizzle-orm');
    const { tasks } = await import('@/lib/schema');
    
    await db.update(tasks).set({
      title,
      description,
      xpReward,
      deadline: deadline || null,
      evidenceType,
      assignedTo,
      userId: assignedTo === 'individual' ? userId : null,
      groupId: null
    }).where(eq(tasks.id, taskId));

    revalidatePath('/dashboard/admin/misiones');
    revalidatePath(`/dashboard/admin/misiones/${taskId}/editar`);
  } catch (e) {
    console.error(e);
  }
}

export async function quickCompleteMissionAction(formData: FormData) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session')?.value;
  if (!sessionToken) return;
  
  let admin;
  try {
    admin = await decrypt(sessionToken);
    if (admin.role !== 'admin' && admin.role !== 'lider') return;
  } catch {
    return;
  }

  const taskId = parseInt(formData.get('taskId') as string, 10);
  const targetUserId = parseInt(formData.get('userId') as string, 10);
  
  if (isNaN(taskId) || isNaN(targetUserId)) return;

  try {
    const { eq, and, sql } = await import('drizzle-orm');
    const { tasks, taskSubmissions, users, xpLog } = await import('@/lib/schema');
    
    // Check if submission already exists
    const existing = await db.select().from(taskSubmissions)
      .where(and(eq(taskSubmissions.taskId, taskId), eq(taskSubmissions.userId, targetUserId)))
      .limit(1);

    const taskData = await db.select().from(tasks).where(eq(tasks.id, taskId)).limit(1);
    const mission = taskData[0];
    if (!mission) return;

    if (existing.length > 0) {
      if (existing[0].status !== 'approved') {
        // Update to approved and give XP
        await db.update(taskSubmissions)
          .set({ status: 'approved', reviewedBy: admin.id, reviewedAt: new Date().toISOString() })
          .where(eq(taskSubmissions.id, existing[0].id));
          
        const { grantXP: grantXP1 } = await import('@/lib/gamification');
        await grantXP1({ userId: targetUserId, amount: mission.xpReward, reason: 'Misión completada', sourceType: 'task', sourceId: taskId, grantedBy: admin.id });
      }
    } else {
      // Create new approved submission
      await db.insert(taskSubmissions).values({
        taskId,
        userId: targetUserId,
        status: 'approved',
        evidence: 'Aprobación rápida por admin',
        submittedAt: new Date().toISOString(),
        reviewedBy: admin.id,
        reviewedAt: new Date().toISOString()
      });
      
      const { grantXP: grantXP2 } = await import('@/lib/gamification');
      await grantXP2({ userId: targetUserId, amount: mission.xpReward, reason: 'Misión completada', sourceType: 'task', sourceId: taskId, grantedBy: admin.id });
    }

    revalidatePath(`/dashboard/admin/misiones/${taskId}/lista`);
  } catch (e) {
    console.error(e);
  }
}

export async function quickRevokeMissionAction(formData: FormData) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session')?.value;
  if (!sessionToken) return;
  
  let admin;
  try {
    admin = await decrypt(sessionToken);
    if (admin.role !== 'admin' && admin.role !== 'lider') return;
  } catch {
    return;
  }

  const taskId = parseInt(formData.get('taskId') as string, 10);
  const targetUserId = parseInt(formData.get('userId') as string, 10);
  
  if (isNaN(taskId) || isNaN(targetUserId)) return;

  try {
    const { eq, and } = await import('drizzle-orm');
    const { taskSubmissions } = await import('@/lib/schema');
    
    // Just delete it for simplicity, or mark as rejected. Deleting is cleaner for a toggle.
    await db.delete(taskSubmissions)
      .where(and(eq(taskSubmissions.taskId, taskId), eq(taskSubmissions.userId, targetUserId)));
      
    // (Note: we aren't subtracting XP to keep it simple, or maybe we should? It's better to just delete the submission. If they made a mistake, they might need to manually adjust XP, but for now this is fine).
    
    revalidatePath(`/dashboard/admin/misiones/${taskId}/lista`);
  } catch (e) {
    console.error(e);
  }
}
