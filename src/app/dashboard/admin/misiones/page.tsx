import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth';
import { db } from '@/lib/db';
import { tasks, groups, users } from '@/lib/schema';
import { eq, desc } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { createMissionAction } from '@/app/actions/admin';
import Link from 'next/link';

export default async function AdminMisionesPage() {
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

  const allMissions = await db.select().from(tasks).orderBy(desc(tasks.createdAt));
  const allGroups = await db.select().from(groups);
  const allUsers = await db.select().from(users).where(eq(users.isActive, 1));

  return (
    <div style={{ padding: '40px 24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <h2 style={{ fontSize: '2rem' }}>Gestión de Misiones</h2>
      </div>

      <div className="responsive-grid" style={{ gridTemplateColumns: '1fr 400px' }}>
        
        {/* Lista de Misiones */}
        <div className="glass-panel" style={{ backgroundColor: 'var(--glass-bg)' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '16px' }}>Misiones Creadas ({allMissions.length})</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--color-text-muted)', fontSize: '0.85rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '12px' }}>Misión</th>
                  <th style={{ padding: '12px' }}>XP</th>
                  <th style={{ padding: '12px' }}>Asignación</th>
                  <th style={{ padding: '12px' }}>Evidencia</th>
                  <th style={{ padding: '12px' }}>Estado</th>
                  <th style={{ padding: '12px' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {allMissions.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                      No has creado ninguna misión.
                    </td>
                  </tr>
                ) : allMissions.map(m => (
                  <tr key={m.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    <td style={{ padding: '12px', fontWeight: 'bold', color: 'var(--color-text-main)' }}>
                      {m.title}
                      {m.deadline && <span style={{ display: 'block', fontSize: '0.7rem', color: '#ff6b6b' }}>Vence: {m.deadline}</span>}
                    </td>
                    <td style={{ padding: '12px', color: '#4ae290', fontWeight: 'bold' }}>+{m.xpReward} XP</td>
                    <td style={{ padding: '12px', fontSize: '0.85rem' }}>
                      {m.assignedTo === 'all' ? 'Todos' : m.assignedTo === 'group' ? `Grupo #${m.groupId}` : `Usuario #${m.userId}`}
                    </td>
                    <td style={{ padding: '12px', fontSize: '0.85rem', textTransform: 'uppercase' }}>{m.evidenceType}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ 
                        fontSize: '0.75rem', 
                        padding: '4px 8px', 
                        borderRadius: '4px',
                        backgroundColor: m.isActive ? 'rgba(74, 226, 144, 0.2)' : 'rgba(255,107,107,0.2)',
                        color: m.isActive ? '#4ae290' : '#ff6b6b'
                      }}>
                        {m.isActive ? 'ACTIVA' : 'INACTIVA'}
                        </span>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          <a href={`/dashboard/admin/misiones/${m.id}/lista`} style={{ background: 'var(--color-primary)', color: 'var(--color-tertiary)', padding: '4px 8px', borderRadius: '4px', textDecoration: 'none', fontSize: '0.75rem', fontWeight: 'bold' }}>Ver Lista</a>
                          <a href={`/dashboard/admin/misiones/${m.id}/editar`} style={{ background: 'transparent', border: '1px solid #ffaa00', color: '#ffaa00', padding: '4px 8px', borderRadius: '4px', textDecoration: 'none', fontSize: '0.75rem' }}>Editar</a>
                          <form action={async (formData) => {
                            'use server';
                            const { deleteMissionAction } = await import('@/app/actions/admin');
                            await deleteMissionAction(formData);
                          }}>
                            <input type="hidden" name="taskId" value={m.id} />
                            <button type="submit" style={{ background: 'transparent', border: '1px solid #ff6b6b', color: '#ff6b6b', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}>Eliminar</button>
                          </form>
                        </div>
                      </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Formulario Crear Misión */}
        <div className="glass-panel" style={{ height: 'fit-content', backgroundColor: 'var(--color-tertiary)', border: '1px solid var(--glass-border)' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '16px' }}>Nueva Misión</h3>
          <form action={async (formData) => {
            'use server';
            const { createMissionAction } = await import('@/app/actions/admin');
            await createMissionAction(formData);
          }} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '8px' }}>Título *</label>
              <input type="text" name="title" className="input-field" placeholder="Ej. Ayuda en el aseo del templo" required />
            </div>
            
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '8px' }}>Descripción</label>
              <textarea name="description" className="input-field" placeholder="Instrucciones..." rows={3}></textarea>
            </div>
            
            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '8px' }}>Recompensa (XP) *</label>
                <input type="number" name="xpReward" className="input-field" defaultValue={50} required />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '8px' }}>Fecha límite</label>
                <input type="date" name="deadline" className="input-field" style={{ colorScheme: 'dark' }} />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '8px' }}>Tipo de Evidencia Requerida *</label>
              <select name="evidenceType" className="input-field" style={{ backgroundColor: 'var(--glass-bg)', cursor: 'pointer' }} required>
                <option value="none">Sin evidencia (Solo botón "Completado")</option>
                <option value="text">Texto (Deben escribir un resumen)</option>
                <option value="media">Foto / Imagen (Subir archivo)</option>
                <option value="file">Descripción + Foto/Video</option>
              </select>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--glass-border)', margin: '8px 0' }} />

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '8px' }}>Asignar a *</label>
              <select name="assignedTo" className="input-field" style={{ backgroundColor: 'var(--glass-bg)', cursor: 'pointer' }} required>
                <option value="all">Todos los Jóvenes</option>
                
                <option value="individual">Un Joven Específico</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '16px' }}>
              
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Joven</label>
                <select name="userId" className="input-field" style={{ backgroundColor: 'var(--glass-bg)', cursor: 'pointer' }}>
                  <option value="" disabled selected>-- Seleccionar Joven --</option>
                  {allUsers.map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <button type="submit" className="btn-primary" style={{ marginTop: '8px', padding: '12px' }}>
              PUBLICAR MISIÓN
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
