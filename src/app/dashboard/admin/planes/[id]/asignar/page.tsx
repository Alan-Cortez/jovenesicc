import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth';
import { db } from '@/lib/db';
import { readingPlans, groups, users } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function AsignarPlanPage({ params }: { params: Promise<{ id: string }> }) {
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
  const planId = parseInt(id, 10);
  if (isNaN(planId)) redirect('/dashboard/admin/planes');

  const planResult = await db.select().from(readingPlans).where(eq(readingPlans.id, planId)).limit(1);
  const plan = planResult[0];

  if (!plan) {
    redirect('/dashboard/admin/planes');
  }

  // Fetch groups and users for the dropdowns
  const allGroups = await db.select().from(groups);
  const allUsers = await db.select().from(users).where(eq(users.isActive, 1));

  return (
    <div style={{ padding: '40px 24px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <Link href="/dashboard/admin/planes" style={{ color: 'var(--color-text-muted)', textDecoration: 'none', fontSize: '0.9rem' }}>
          ← Volver a Planes
        </Link>
      </div>

      <div className="glass-panel" style={{ backgroundColor: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
        <h3 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Asignar Plan: {plan.title}</h3>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: '24px' }}>
          Selecciona a quién deseas asignar este plan de lectura. Una vez asignado, aparecerá en el dashboard de los seleccionados.
        </p>

        <form action={async (formData) => {
          'use server';
          const { assignPlanAction } = await import('@/app/actions/admin');
          const result = await assignPlanAction(formData);
          if (result.success) {
            const { redirect } = await import('next/navigation');
            redirect('/dashboard/admin/planes');
          }
        }} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <input type="hidden" name="planId" value={plan.id} />
          
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '8px' }}>Tipo de Asignación *</label>
            <select name="assignedTo" className="input-field" style={{ backgroundColor: 'var(--color-tertiary)', color: 'var(--color-text-main)', cursor: 'pointer' }} required>
              <option value="all">A toda la congregación (Todos los Jóvenes)</option>
              <option value="group">A una Célula / Grupo Específico</option>
              <option value="individual">A un Joven Específico</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '8px' }}>Si elegiste "Célula / Grupo"</label>
              <select name="groupId" className="input-field" style={{ backgroundColor: 'var(--color-tertiary)', color: 'var(--color-text-main)', cursor: 'pointer' }}>
                <option value="">-- Seleccionar Grupo --</option>
                {allGroups.map(g => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '8px' }}>Si elegiste "Joven Específico"</label>
              <select name="userId" className="input-field" style={{ backgroundColor: 'var(--color-tertiary)', color: 'var(--color-text-main)', cursor: 'pointer' }}>
                <option value="">-- Seleccionar Joven --</option>
                {allUsers.map(u => (
                  <option key={u.id} value={u.id}>{u.name} ({u.matricula})</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '8px' }}>Fecha de Inicio *</label>
            <input type="date" name="startDate" className="input-field" defaultValue={new Date().toISOString().split('T')[0]} style={{ backgroundColor: 'var(--color-tertiary)', color: 'var(--color-text-main)', colorScheme: 'dark' }} required />
          </div>
          
          <button type="submit" className="btn-primary" style={{ marginTop: '8px', padding: '12px', justifyContent: 'center' }}>
            CONFIRMAR ASIGNACIÓN
          </button>
        </form>
      </div>
    </div>
  );
}
