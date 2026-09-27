'use server';

import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth';
import { db } from '@/lib/db';
import { groups, users } from '@/lib/schema';
import { eq, isNull } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

// Helper para verificar admin
async function verifyAdmin() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session')?.value;
  if (!sessionToken) return null;
  try {
    const user = await decrypt(sessionToken);
    if (user.role !== 'admin' && user.role !== 'lider') return null;
    return user;
  } catch {
    return null;
  }
}

// ---- CRUD de Grupos ----

export async function createGroupAction(formData: FormData) {
  const admin = await verifyAdmin();
  if (!admin) return { error: 'No autorizado' };

  const name = (formData.get('name') as string)?.trim();
  const description = (formData.get('description') as string)?.trim() || null;

  if (!name) return { error: 'El nombre del grupo es obligatorio.' };

  try {
    await db.insert(groups).values({
      name,
      description,
      leaderId: admin.id,
    });

    revalidatePath('/dashboard/admin/grupos');
    return { success: true };
  } catch (error) {
    console.error('Error creating group:', error);
    return { error: 'Error al crear el grupo.' };
  }
}

export async function deleteGroupAction(formData: FormData) {
  const admin = await verifyAdmin();
  if (!admin) return { error: 'No autorizado' };

  const groupId = parseInt(formData.get('groupId') as string, 10);
  if (isNaN(groupId)) return { error: 'ID de grupo inválido.' };

  try {
    // Primero, desasignar a todos los usuarios de este grupo
    await db.update(users).set({ groupId: null }).where(eq(users.groupId, groupId));

    // Luego, eliminar el grupo
    await db.delete(groups).where(eq(groups.id, groupId));

    revalidatePath('/dashboard/admin/grupos');
    return { success: true };
  } catch (error) {
    console.error('Error deleting group:', error);
    return { error: 'Error al eliminar el grupo.' };
  }
}

export async function updateGroupAction(formData: FormData) {
  const admin = await verifyAdmin();
  if (!admin) return { error: 'No autorizado' };

  const groupId = parseInt(formData.get('groupId') as string, 10);
  const name = (formData.get('name') as string)?.trim();
  const description = (formData.get('description') as string)?.trim() || null;

  if (isNaN(groupId) || !name) return { error: 'Datos inválidos.' };

  try {
    await db.update(groups).set({ name, description }).where(eq(groups.id, groupId));

    revalidatePath('/dashboard/admin/grupos');
    return { success: true };
  } catch (error) {
    console.error('Error updating group:', error);
    return { error: 'Error al actualizar el grupo.' };
  }
}

// ---- Asignación de Miembros ----

export async function assignUserToGroupAction(userId: number, groupId: number | null) {
  const admin = await verifyAdmin();
  if (!admin) return { error: 'No autorizado' };

  try {
    await db.update(users).set({ groupId }).where(eq(users.id, userId));
    revalidatePath('/dashboard/admin/grupos');
    return { success: true };
  } catch (error) {
    console.error('Error assigning user to group:', error);
    return { error: 'Error al asignar usuario.' };
  }
}

// Asignación masiva: recibe un map de { userId -> groupId }
export async function bulkAssignUsersToGroupAction(assignments: { userId: number; groupId: number }[]) {
  const admin = await verifyAdmin();
  if (!admin) return { error: 'No autorizado' };

  try {
    for (const { userId, groupId } of assignments) {
      await db.update(users).set({ groupId }).where(eq(users.id, userId));
    }
    revalidatePath('/dashboard/admin/grupos');
    return { success: true };
  } catch (error) {
    console.error('Error bulk assigning users:', error);
    return { error: 'Error al asignar usuarios a grupos.' };
  }
}

// Desasignar un usuario de cualquier grupo
export async function removeUserFromGroupAction(userId: number) {
  const admin = await verifyAdmin();
  if (!admin) return { error: 'No autorizado' };

  try {
    await db.update(users).set({ groupId: null }).where(eq(users.id, userId));
    revalidatePath('/dashboard/admin/grupos');
    return { success: true };
  } catch (error) {
    console.error('Error removing user from group:', error);
    return { error: 'Error al remover usuario del grupo.' };
  }
}

// ---- Queries ----

export async function getGroupsWithMembersAction() {
  const admin = await verifyAdmin();
  if (!admin) return { error: 'No autorizado' };

  try {
    const allGroups = await db.select().from(groups);
    const allUsers = await db.select({
      id: users.id,
      name: users.name,
      role: users.role,
      groupId: users.groupId,
    }).from(users);

    const { groupMeetings, groupMeetingAttendance } = await import('@/lib/schema');
    const meetings = await db.select().from(groupMeetings);
    const attendances = await db.select().from(groupMeetingAttendance);

    const groupsWithMembers = allGroups.map(g => {
      const currentMembers = allUsers.filter(u => u.groupId === g.id);
      const currentMemberIds = currentMembers.map(u => u.id);

      const groupMeetingsList = meetings.filter(m => m.groupId === g.id);
      const groupBonuses = groupMeetingsList.reduce((acc, curr) => acc + curr.perfectAttendanceBonus + curr.perfectPunctualityBonus + curr.guestsPoints, 0);

      const membersIndividualPoints = attendances
        .filter(a => currentMemberIds.includes(a.userId))
        .reduce((acc, curr) => acc + curr.totalPoints, 0);

      const totalScore = groupBonuses + membersIndividualPoints;
      
      let lastEvaluated = null;
      if (groupMeetingsList.length > 0) {
        const sorted = [...groupMeetingsList].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        lastEvaluated = sorted[0].date;
      }

      return {
        ...g,
        totalScore,
        lastEvaluated,
        members: currentMembers,
      };
    });

    const unassigned = allUsers.filter(u => !u.groupId);

    return { success: true, data: { groups: groupsWithMembers, unassigned } };
  } catch (error) {
    console.error('Error fetching groups:', error);
    return { error: 'Error al cargar los grupos.' };
  }
}

// ---- Evaluación de Grupos ----

export async function evaluateGroupAction(data: {
  groupId: number;
  meetingId?: number; // Added to support updating
  date: string;
  newGuests: { invitedBy: number, name: string }[];
  attendedGuestIds: number[];
  evaluations: { userId: number; tematica: number; puntualidad: number; bibliaCuaderno: number }[];
  exemptUserIds?: number[];
}) {
  const admin = await verifyAdmin();
  if (!admin) return { error: 'No autorizado' };

  try {
    const { groupMeetings, groupMeetingAttendance, groupGuests } = await import('@/lib/schema');
    const { inArray } = await import('drizzle-orm');
    
    // Calcular bonos globales
    let perfectAttendanceBonus = 0;
    let perfectPunctualityBonus = 0;
    let groupTotal = 0;

    if (data.evaluations.length > 0) {
      const exemptIds = data.exemptUserIds || [];
      const activeEvals = data.evaluations.filter(e => !exemptIds.includes(e.userId));
      
      const hasAbsences = activeEvals.some(e => e.puntualidad === 0);
      const allPerfectPunctuality = activeEvals.length > 0 && activeEvals.every(e => e.puntualidad === 5);

      if (!hasAbsences) perfectAttendanceBonus = 5;
      if (allPerfectPunctuality && !hasAbsences) perfectPunctualityBonus = 5;

      groupTotal += perfectAttendanceBonus + perfectPunctualityBonus;
    }

    const guestPointsByMember: Record<number, number> = {};
    
    for (const ng of data.newGuests) {
      await db.insert(groupGuests).values({
        groupId: data.groupId,
        invitedBy: ng.invitedBy,
        name: ng.name,
        visitsCount: 1,
        lastVisit: data.date
      });
      guestPointsByMember[ng.invitedBy] = (guestPointsByMember[ng.invitedBy] || 0) + 3;
    }

    if (data.attendedGuestIds.length > 0) {
      const existing = await db.select().from(groupGuests).where(inArray(groupGuests.id, data.attendedGuestIds));
      
      for (const g of existing) {
        const newVisitsCount = g.visitsCount + 1;
        await db.update(groupGuests)
          .set({ visitsCount: newVisitsCount, lastVisit: data.date })
          .where(eq(groupGuests.id, g.id));
        
        const pts = newVisitsCount >= 5 ? 10 : 3;
        if (g.invitedBy) {
          guestPointsByMember[g.invitedBy] = (guestPointsByMember[g.invitedBy] || 0) + pts;
        }
      }
    }

    const attendanceRecords = data.evaluations.map(e => {
      const guestPointsForThisUser = guestPointsByMember[e.userId] || 0;
      const totalPoints = e.tematica + e.puntualidad + e.bibliaCuaderno + guestPointsForThisUser;
      groupTotal += totalPoints;
      
      return {
        userId: e.userId,
        tematica: e.tematica,
        puntualidad: e.puntualidad,
        bibliaCuaderno: e.bibliaCuaderno,
        totalPoints,
      };
    });

    let meetingId = data.meetingId;

    if (meetingId) {
      // Actualizar la reunión existente
      await db.update(groupMeetings)
        .set({
          date: data.date,
          perfectAttendanceBonus,
          perfectPunctualityBonus,
          totalPoints: groupTotal,
        })
        .where(eq(groupMeetings.id, meetingId));
        
      // Eliminar las asistencias anteriores para reemplazarlas
      await db.delete(groupMeetingAttendance).where(eq(groupMeetingAttendance.meetingId, meetingId));
    } else {
      // Crear nueva reunión
      const meetingResult = await db.insert(groupMeetings).values({
        groupId: data.groupId,
        date: data.date,
        perfectAttendanceBonus,
        perfectPunctualityBonus,
        guestsPoints: 0,
        totalPoints: groupTotal,
      }).returning({ insertedId: groupMeetings.id });
      meetingId = meetingResult[0].insertedId;
    }

    // Guardar (o re-guardar) asistencias
    if (attendanceRecords.length > 0 && meetingId) {
      const recordsToInsert = attendanceRecords.map(r => ({
        ...r,
        meetingId,
      }));
      await db.insert(groupMeetingAttendance).values(recordsToInsert);
    }

    revalidatePath('/dashboard/admin/grupos');
    revalidatePath('/dashboard/lideres'); // Asumiendo que la tabla de posiciones está ahí
    return { success: true, totalPoints: groupTotal };
  } catch (error) {
    console.error('Error evaluating group:', error);
    return { error: 'Error al evaluar la reunión del grupo.' };
  }
}


export async function deleteMeetingAction(formData: FormData) {
  'use server';
  const admin = await verifyAdmin();
  if (!admin) throw new Error('No autorizado');

  const meetingId = parseInt(formData.get('meetingId') as string);
  if (isNaN(meetingId)) throw new Error('ID invalido');

  const { groupMeetings, groupMeetingAttendance } = await import('@/lib/schema');
  const { eq } = await import('drizzle-orm');

  await db.delete(groupMeetingAttendance).where(eq(groupMeetingAttendance.meetingId, meetingId));
  await db.delete(groupMeetings).where(eq(groupMeetings.id, meetingId));

  const { revalidatePath } = await import('next/cache');
  revalidatePath('/dashboard/admin/grupos');
  revalidatePath('/dashboard/lideres');
}
