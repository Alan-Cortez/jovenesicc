import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { tasks, users } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import Link from 'next/link';
import { updateMissionAction } from '@/app/actions/admin';

export default async function EditarMisionPage({ params }: { params: { id: string } }) {
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

  const taskId = parseInt(params.id, 10);
  const missionResult = await db.select().from(tasks).where(eq(tasks.id, taskId)).limit(1);
  const mission = missionResult[0];

  if (!mission) {
    return (
      <div style={{ padding: '40px 24px', maxWidth: '800px', margin: '0 auto', color: 'white' }}>
        <h2>Misión no encontrada</h2>
        <Link href="/dashboard/admin/misiones" style={{ color: 'var(--color-primary)' }}>Volver</Link>
      </div>
    );
  }

  const allUsers = await db.select().from(users).where(eq(users.isActive, 1));

  return (
    <div style={{ padding: '40px 24px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <h2 style={{ fontSize: '2rem' }}>Editar Misión</h2>
        <Link href="/dashboard/admin/misiones" style={{ color: 'var(--color-text-muted)', textDecoration: 'none' }}>Volver</Link>
      </div>

      <div className="glass-panel" style={{ backgroundColor: 'var(--color-tertiary)' }}>
        <form action={async (formData) => {
          'use server';
          const { updateMissionAction } = await import('@/app/actions/admin');
          await updateMissionAction(formData);
        }} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <input type="hidden" name="taskId" value={mission.id} />

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '8px' }}>Título *</label>
            <input type="text" name="title" className="input-field" defaultValue={mission.title} required />
          </div>
          
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '8px' }}>Descripción</label>
            <textarea name="description" className="input-field" defaultValue={mission.description || ''} rows={3}></textarea>
          </div>
          
          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '8px' }}>Recompensa (XP) *</label>
              <input type="number" name="xpReward" className="input-field" defaultValue={mission.xpReward} required />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '8px' }}>Fecha límite</label>
              <input type="date" name="deadline" className="input-field" defaultValue={mission.deadline || ''} style={{ colorScheme: 'dark' }} />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '8px' }}>Tipo de Evidencia Requerida *</label>
            <select name="evidenceType" className="input-field" defaultValue={mission.evidenceType} style={{ backgroundColor: 'var(--glass-bg)' }} required>
              <option value="none">Sin evidencia (Solo botón "Completado")</option>
              <option value="text">Texto (Deben escribir un resumen)</option>
              <option value="media">Foto / Imagen (Subir archivo)</option>
              <option value="file">Descripción + Foto/Video</option>
            </select>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--glass-border)', margin: '8px 0' }} />

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '8px' }}>Asignar a *</label>
            <select name="assignedTo" className="input-field" defaultValue={mission.assignedTo} style={{ backgroundColor: 'var(--glass-bg)' }} required>
              <option value="all">Todos los Jóvenes</option>
              <option value="individual">Un Joven Específico</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Joven (Si elegiste Individual)</label>
              <select name="userId" className="input-field" defaultValue={mission.userId || ''} style={{ backgroundColor: 'var(--glass-bg)' }}>
                <option value="">Selecciona un joven</option>
                {allUsers.map(u => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
          </div>
          
          <button type="submit" className="btn-primary" style={{ marginTop: '16px' }}>
            Guardar Cambios
          </button>
        </form>
      </div>
    </div>
  );
}
