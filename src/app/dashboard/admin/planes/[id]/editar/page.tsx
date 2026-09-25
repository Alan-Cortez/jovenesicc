import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth';
import { db } from '@/lib/db';
import { readingPlans } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { updateReadingPlanAction } from '@/app/actions/admin';

export default async function EditPlanPage({ params }: { params: Promise<{ id: string }> }) {
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

  return (
    <div style={{ padding: '40px 24px', maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <Link href="/dashboard/admin/planes" style={{ color: 'var(--color-text-muted)', textDecoration: 'none', fontSize: '0.9rem' }}>
          ← Volver a Planes
        </Link>
      </div>

      <div className="glass-panel" style={{ backgroundColor: 'var(--color-tertiary)', border: '1px solid var(--glass-border)' }}>
        <h3 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Editar Plan</h3>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: '24px' }}>Modifica la información general de "{plan.title}".</p>
        
        <form action={async (formData) => {
          'use server';
          const { updateReadingPlanAction } = await import('@/app/actions/admin');
          await updateReadingPlanAction(formData);
        }} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <input type="hidden" name="planId" value={plan.id} />
          
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '8px' }}>Foto de Portada Actual</label>
            {plan.imageUrl ? (
              <div style={{ width: '100%', height: '120px', backgroundImage: `url(${plan.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', borderRadius: '8px', marginBottom: '8px' }} />
            ) : (
              <div style={{ width: '100%', height: '120px', backgroundColor: 'var(--glass-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', marginBottom: '8px', color: 'var(--color-text-muted)' }}>Sin imagen</div>
            )}
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '8px' }}>Cambiar Foto (Opcional)</label>
            <input type="file" name="cover" accept="image/*" className="input-field" style={{ backgroundColor: 'var(--glass-bg)' }} />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '8px' }}>Título del Plan *</label>
            <input type="text" name="title" defaultValue={plan.title} className="input-field" required />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '8px' }}>Descripción corta</label>
            <textarea name="description" defaultValue={plan.description || ''} className="input-field" rows={4}></textarea>
          </div>
          
          <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
            <Link href="/dashboard/admin/planes" style={{ flex: 1, textDecoration: 'none' }}>
              <button type="button" style={{ width: '100%', backgroundColor: 'transparent', color: 'var(--color-text-muted)', border: '1px solid var(--glass-border)', padding: '12px', borderRadius: '8px', cursor: 'pointer' }}>Cancelar</button>
            </Link>
            <button type="submit" className="btn-primary" style={{ flex: 2, padding: '12px' }}>
              GUARDAR CAMBIOS
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
