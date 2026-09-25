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

  // Traer a todos los usuarios ordenados por nivel y luego XP
  // Filtrando a los que tienen perfil privado (ej. hideProfile === 1) si existiera.
  // Como no hay en el schema, mostramos a todos los 'joven' o 'lider'
  const allUsers = await db
    .select()
    .from(users)
    .orderBy(desc(users.level), desc(users.xp));

  const { groups, groupMeetings, groupMeetingAttendance } = await import('@/lib/schema');
  
  const allGroups = await db.select().from(groups);
  const meetings = await db.select().from(groupMeetings);
  const attendances = await db.select().from(groupMeetingAttendance);

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
      users={allUsers.filter(u => u.isActive).map(u => ({
        id: u.id,
        name: u.name,
        role: u.role,
        level: u.level,
        xp: u.xp,
        streak: u.streakCurrent,
        totalXp: (u.level - 1) * 500 + u.xp,
        avatar: u.avatar ?? null,
      }))} 
      groups={groupsRanking}
    />
  );
}
