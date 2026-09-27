import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { tasks, users, taskSubmissions, groups } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';
import Link from 'next/link';
import { quickCompleteMissionAction, quickRevokeMissionAction } from '@/app/actions/admin';


export default async function VerListaMisionPage({ params }: { params: { id: string } }) {
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

  // Get all active users
  const allUsers = await db.select({
    id: users.id,
    name: users.name,
    avatar: users.avatar,
    groupId: users.groupId
  }).from(users).where(eq(users.isActive, 1));

  // Get all submissions for this mission
  const submissions = await db.select().from(taskSubmissions).where(eq(taskSubmissions.taskId, taskId));

  // Build a mapped array
  const userList = allUsers.map(u => {
    const sub = submissions.find(s => s.userId === u.id);
    return {
      ...u,
      status: sub ? sub.status : 'none',
    };
  }).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div style={{ padding: '40px 24px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '2rem', marginBottom: '8px' }}>Lista: {mission.title}</h2>
          <p style={{ color: 'var(--color-text-muted)' }}>+{mission.xpReward} XP | Asignación: {mission.assignedTo}</p>
        </div>
        <Link href="/dashboard/admin/misiones" style={{ color: 'var(--color-text-muted)', textDecoration: 'none' }}>Volver</Link>
      </div>

      <div className="glass-panel" style={{ backgroundColor: 'var(--glass-bg)', padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
              <th style={{ padding: '16px' }}>Joven</th>
              <th style={{ padding: '16px' }}>Estado</th>
              <th style={{ padding: '16px', textAlign: 'right' }}>Acción Rápida</th>
            </tr>
          </thead>
          <tbody>
            {userList.map(u => (
              <tr key={u.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                <td style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {u.avatar ? <img src={u.avatar} alt='Avatar' style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} /> : <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold' }}>{u.name.substring(0, 2).toUpperCase()}</div>}
                    <span style={{ fontWeight: '600' }}>{u.name}</span>
                  </div>
                </td>
                <td style={{ padding: '16px' }}>
                  {u.status === 'approved' && <span style={{ color: '#4ae290', fontSize: '0.85rem', fontWeight: 'bold' }}>Completado</span>}
                  {u.status === 'pending' && <span style={{ color: '#ffaa00', fontSize: '0.85rem', fontWeight: 'bold' }}>Pendiente de revisar</span>}
                  {u.status === 'submitted' && <span style={{ color: '#ffaa00', fontSize: '0.85rem', fontWeight: 'bold' }}>Enviado</span>}
                  {u.status === 'none' && <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Sin hacer</span>}
                  {u.status === 'rejected' && <span style={{ color: '#ff6b6b', fontSize: '0.85rem' }}>Rechazado</span>}
                </td>
                <td style={{ padding: '16px', textAlign: 'right' }}>
                  {u.status !== 'approved' ? (
                    <form action={async (formData) => {
                      'use server';
                      const { quickCompleteMissionAction } = await import('@/app/actions/admin');
                      await quickCompleteMissionAction(formData);
                    }}>
                      <input type="hidden" name="taskId" value={taskId} />
                      <input type="hidden" name="userId" value={u.id} />
                      <button type="submit" style={{ background: 'var(--color-primary)', color: 'var(--color-tertiary)', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem' }}>
                        Marcar Completado
                      </button>
                    </form>
                  ) : (
                    <form action={async (formData) => {
                      'use server';
                      const { quickRevokeMissionAction } = await import('@/app/actions/admin');
                      await quickRevokeMissionAction(formData);
                    }}>
                      <input type="hidden" name="taskId" value={taskId} />
                      <input type="hidden" name="userId" value={u.id} />
                      <button type="submit" style={{ background: 'transparent', color: '#ff6b6b', border: '1px solid #ff6b6b', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem' }}>
                        Deshacer
                      </button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
