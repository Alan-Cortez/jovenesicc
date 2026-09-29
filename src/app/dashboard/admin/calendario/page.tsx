import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { events } from '@/lib/schema';
import { desc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export default async function AdminCalendarioPage() {
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

  const { remoteCalendarClient } = await import('@/lib/remoteDb');
  const result = await remoteCalendarClient.execute("SELECT id, nombre, descripcion, fecha FROM events ORDER BY fecha ASC");
  
  const allEvents = result.rows.map(row => ({
    id: row.id as number,
    title: (row.nombre as string) || 'Sin título',
    description: (row.descripcion as string) || '',
    startAt: row.fecha as string,
    location: ''
  }));

  
  const parseLocalDate = (dateStr: string) => {
    if (!dateStr) return new Date();
    if (dateStr.endsWith('Z')) return new Date(dateStr);
    let cleanStr = dateStr.replace(' ', 'T');
    if (!cleanStr.includes('T')) cleanStr += 'T12:00:00';
    return new Date(cleanStr);
  };

  async function createEvent(formData: FormData) {
    'use server';
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    // La BD externa no soporta location, pero recibimos la fecha
    const startAt = formData.get('startAt') as string;
    
    if (!title || !startAt) return;

    const { remoteCalendarClient } = await import('@/lib/remoteDb');
    await remoteCalendarClient.execute({
      sql: "INSERT INTO events (nombre, descripcion, fecha) VALUES (?, ?, ?)",
      args: [title, description, startAt]
    });
    
    import('next/cache').then(({ revalidatePath }) => {
      revalidatePath('/dashboard/admin/calendario');
      revalidatePath('/dashboard/calendario');
    });
  }

  async function deleteEvent(formData: FormData) {
    'use server';
    const id = parseInt(formData.get('id') as string, 10);
    if (!id) return;

    const { remoteCalendarClient } = await import('@/lib/remoteDb');
    await remoteCalendarClient.execute({
      sql: "DELETE FROM events WHERE id = ?",
      args: [id]
    });

    import('next/cache').then(({ revalidatePath }) => {
      revalidatePath('/dashboard/admin/calendario');
      revalidatePath('/dashboard/calendario');
    });
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '2rem' }}>Gestión de Calendario</h2>
        <p style={{ color: 'var(--color-text-muted)' }}>Agrega o elimina eventos del calendario general de la iglesia.</p>
      </div>

      <div className="responsive-grid" style={{ gridTemplateColumns: '1fr 350px' }}>
        {/* Lista de Eventos */}
        <div className="glass-panel" style={{ backgroundColor: 'var(--glass-bg)' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '16px' }}>Eventos ({allEvents.length})</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {allEvents.map(ev => (
              <div key={ev.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', backgroundColor: 'var(--color-tertiary)', borderRadius: '8px' }}>
                <div>
                  <h4 style={{ fontSize: '1.1rem', marginBottom: '4px' }}>{ev.title}</h4>
                  <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: '8px' }}>{parseLocalDate(ev.startAt).toLocaleDateString()} {ev.startAt.includes('T') ? parseLocalDate(ev.startAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}</p>
                  <p style={{ fontSize: '0.9rem' }}>📍 {ev.location || 'Sin ubicación'}</p>
                </div>
                <form action={deleteEvent}>
                  <input type="hidden" name="id" value={ev.id} />
                  <button type="submit" style={{ backgroundColor: '#ff4757', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                    Eliminar
                  </button>
                </form>
              </div>
            ))}
          </div>
        </div>

        {/* Crear Evento */}
        <div className="glass-panel" style={{ backgroundColor: 'var(--color-tertiary)', border: '1px solid var(--glass-border)', alignSelf: 'start' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '16px' }}>Nuevo Evento</h3>
          <form action={createEvent} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Título *</label>
              <input type="text" name="title" className="input-field" required placeholder="Ej. Culto de Jóvenes" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Fecha y Hora *</label>
              <input type="datetime-local" name="startAt" className="input-field" required />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Ubicación</label>
              <input type="text" name="location" className="input-field" placeholder="Ej. Templo Principal" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Descripción</label>
              <textarea name="description" className="input-field" rows={3} placeholder="Detalles del evento..."></textarea>
            </div>
            <button type="submit" className="btn-primary" style={{ marginTop: '8px' }}>
              CREAR EVENTO
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
