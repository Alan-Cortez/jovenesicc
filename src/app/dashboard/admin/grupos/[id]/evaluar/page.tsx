import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth';
import { db } from '@/lib/db';
import { groups, users, groupMeetings, groupMeetingAttendance } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import EvaluarClient from './EvaluarClient';
import Link from 'next/link';

export default async function EvaluarGrupoPage({ params }: { params: Promise<{ id: string }> }) {
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
  const groupId = parseInt(id, 10);
  if (isNaN(groupId)) redirect('/dashboard/admin/grupos');

  const groupResult = await db.select().from(groups).where(eq(groups.id, groupId)).limit(1);
  const groupData = groupResult[0];

  if (!groupData) {
    return (
      <div style={{ padding: '40px 24px' }}>
        <p style={{ color: '#a0aab2' }}>Grupo no encontrado.</p>
        <Link href="/dashboard/admin/grupos" style={{ color: '#ffffff', textDecoration: 'underline' }}>Volver</Link>
      </div>
    );
  }

  const groupMembers = await db.select({
    id: users.id,
    name: users.name,
    avatar: users.avatar
  }).from(users).where(eq(users.groupId, groupId));

  const { groupGuests } = await import('@/lib/schema');
  const existingGuests = await db.select().from(groupGuests).where(eq(groupGuests.groupId, groupId));

    const pastMeetings = await db.select().from(groupMeetings).where(eq(groupMeetings.groupId, groupId));
  const rawAttendances = await db.select().from(groupMeetingAttendance)
    .innerJoin(groupMeetings, eq(groupMeetingAttendance.meetingId, groupMeetings.id))
    .where(eq(groupMeetings.groupId, groupId));

  const pastAttendances = rawAttendances.map(r => r.group_meeting_attendance);\n  return <EvaluarClient group={groupData} members={groupMembers} existingGuests={existingGuests} pastMeetings={pastMeetings} pastAttendances={pastAttendances} />;
}
