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

  // Traer eventos de la base de datos externa
  const { remoteCalendarClient } = await import('@/lib/remoteDb');
  const result = await remoteCalendarClient.execute("SELECT id, nombre, descripcion, fecha FROM events ORDER BY fecha ASC");
  
  const allEvents = result.rows.map(row => ({
    id: row.id as number,
    title: (row.nombre as string) || 'Sin título',
    description: (row.descripcion as string) || '',
    location: '', // La bd externa no tiene location
    startAt: row.fecha as string,
    endAt: null
  }));

  return (
    <CalendarioClient 
      userId={user.id} 
      events={allEvents} 
    />
  );
}
