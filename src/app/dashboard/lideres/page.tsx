import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth';
import { db } from '@/lib/db';
import { users } from '@/lib/schema';
import { desc } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import LideresClient from './LideresClient';

export default async function LideresPage() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session')?.value;
  if (!sessionToken) redirect('/login');
  
  let currentUser;
  try {
    currentUser = await decrypt(sessionToken);
  } catch {
    redirect('/login');
  }

  const allUsers = await db.select().from(users);

  const { groups, groupMeetings, groupMeetingAttendance, tasks, taskSubmissions } = await import('@/lib/schema');
  const { eq } = await import('drizzle-orm');
  
  const allGroups = await db.select().from(groups);
  const meetings = await db.select().from(groupMeetings);
  const attendances = await db.select().from(groupMeetingAttendance);
  const allTasks = await db.select().from(tasks);
  const allSubmissions = await db.select().from(taskSubmissions).where(eq(taskSubmissions.status, 'approved'));

  // Mapa rápido de misiones a su XP
  const taskXpMap = new Map();
  allTasks.forEach(t => taskXpMap.set(t.id, t.xpReward));

  // Calcular puntos individuales (Asistencia + Misiones aprobadas)
  const usersRanking = allUsers
    .filter(u => u.isActive)
    .map(u => {
      // Puntos de asistencia
      const userAttendances = attendances.filter(a => a.userId === u.id);
      const meetingPoints = userAttendances.reduce((acc, curr) => acc + curr.totalPoints, 0);
      
      // Puntos de misiones aprobadas
      const userApprovedMissions = allSubmissions.filter(s => s.userId === u.id);
      const missionPoints = userApprovedMissions.reduce((acc, curr) => acc + (taskXpMap.get(curr.taskId) || 0), 0);

      const individualPoints = meetingPoints + missionPoints;

      return {
        id: u.id,
        name: u.name,
        role: u.role,
        level: u.level,
        xp: u.xp, // Mantener por si acaso
        individualPoints, // Puntos acumulados en reuniones + misiones
        streak: u.streakCurrent,
        avatar: u.avatar ?? null,
      };
    })
    .sort((a, b) => b.individualPoints - a.individualPoints); // Ordenar por puntos

  const groupsRanking = allGroups.map(g => {
    const currentMembers = allUsers.filter(u => u.groupId === g.id);
    const currentMemberIds = currentMembers.map(u => u.id);

    const groupMeetingsList = meetings.filter(m => m.groupId === g.id);
    const groupBonuses = groupMeetingsList.reduce((acc, curr) => acc + curr.perfectAttendanceBonus + curr.perfectPunctualityBonus + curr.guestsPoints, 0);

    const membersIndividualPoints = attendances
      .filter(a => currentMemberIds.includes(a.userId))
      .reduce((acc, curr) => acc + curr.totalPoints, 0);

    const totalScore = groupBonuses + membersIndividualPoints;

    return {
      id: g.id,
      name: g.name,
      totalScore
    };
  }).sort((a, b) => b.totalScore - a.totalScore); // Order by highest score

  return (
    <LideresClient 
      currentUserId={currentUser.id} 
      users={usersRanking} 
      groups={groupsRanking}
    />
  );
}
