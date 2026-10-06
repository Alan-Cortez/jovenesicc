import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth';
import { db } from '@/lib/db';
import { readingPlanDays, readingPlans } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { updatePlanDayAction } from '@/app/actions/admin';
import VerseInput from '@/components/VerseInput';

export default async function EditPlanDayPage({ params }: { params: Promise<{ id: string, dayId: string }> }) {
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

  const { id, dayId: dId } = await params;
  const planId = parseInt(id, 10);
  const dayId = parseInt(dId, 10);
  if (isNaN(planId) || isNaN(dayId)) redirect('/dashboard/admin/planes');

  const planResult = await db.select().from(readingPlans).where(eq(readingPlans.id, planId)).limit(1);
  const plan = planResult[0];

  const dayResult = await db.select().from(readingPlanDays).where(eq(readingPlanDays.id, dayId)).limit(1);
  const day = dayResult[0];

  if (!plan || !day) {
    redirect(`/dashboard/admin/planes/${planId}/dias`);
  }

  return (
    <div style={{ padding: '40px 24px', maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <Link href={`/dashboard/admin/planes/${planId}/dias`} style={{ color: 'var(--color-text-muted)', textDecoration: 'none', fontSize: '0.9rem' }}>
          ← Volver a los Días del Plan
        </Link>
      </div>

      <div className="glass-panel" style={{ backgroundColor: 'var(--color-tertiary)', border: '1px solid var(--glass-border)' }}>
        <h3 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Editar Día {day.dayNumber}</h3>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: '24px' }}>Plan: {plan.title}</p>
        
        <form action={async (formData) => {
          'use server';
          const { updatePlanDayAction } = await import('@/app/actions/admin');
          await updatePlanDayAction(formData);
        }} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <input type="hidden" name="planId" value={planId} />
          <input type="hidden" name="dayId" value={dayId} />
          
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '8px' }}>Título del Devocional (Opcional)</label>
            <input type="text" name="title" defaultValue={day.title || ''} className="input-field" placeholder="Ej. El Principio del Temor a Dios" />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '8px' }}>Cuerpo del Devocional (Opcional)</label>
            <textarea name="content" defaultValue={day.content || ''} className="input-field" placeholder="Escribe aquí la reflexión del día..." rows={8} style={{ resize: 'vertical' }}></textarea>
          </div>

          <VerseInput defaultValue={day.bibleRefs} />

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '8px' }}>Recompensa por lectura (XP) *</label>
            <input type="number" name="xpReward" defaultValue={day.xpReward} className="input-field" required />
          </div>
          
          <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
            <Link href={`/dashboard/admin/planes/${planId}/dias`} style={{ flex: 1, textDecoration: 'none' }}>
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
