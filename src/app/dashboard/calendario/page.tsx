import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth';
import { db } from '@/lib/db';
import { events } from '@/lib/schema';
import { desc } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import CalendarioClient from './CalendarioClient';

export default async function CalendarioPage() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session')?.value;
  if (!sessionToken) redirect('/login');
  
  let user;
  try {
    user = await decrypt(sessionToken);
  } catch {
    redirect('/login');
  }

  // Traer eventos
  const allEvents = await db
    .select()
    .from(events)
    .orderBy(desc(events.startAt)); // FIX: era event.date, el campo correcto es startAt

  return (
    <CalendarioClient 
      userId={user.id} 
      events={allEvents.map(e => ({
        id: e.id,
        title: e.title,
        description: e.description ?? '',
        location: e.location ?? '',
        startAt: e.startAt,
        endAt: e.endAt ?? null
      }))} 
    />
  );
}
