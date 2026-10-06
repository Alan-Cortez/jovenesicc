import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth';
import { db } from '@/lib/db';
import { readingPlans, readingPlanDays } from '@/lib/schema';
import { eq, asc } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { addPlanDayAction } from '@/app/actions/admin';
import VerseInput from '@/components/VerseInput';

export default async function AdminPlanDiasPage({ params }: { params: Promise<{ id: string }> }) {
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

  const existingDays = await db.select().from(readingPlanDays).where(eq(readingPlanDays.planId, planId)).orderBy(asc(readingPlanDays.dayNumber));
  const nextDayNumber = existingDays.length + 1;

  return (
    <div style={{ padding: '40px 24px', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <Link href="/dashboard/admin/planes" style={{ color: 'var(--color-text-muted)', textDecoration: 'none', fontSize: '0.9rem' }}>
          ← Volver a Planes
        </Link>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h2 style={{ fontSize: '2rem' }}>{plan.title}</h2>
          <p style={{ color: 'var(--color-text-muted)' }}>Redactor de Días • Total actual: {plan.totalDays} Días</p>
        </div>
      </div>

      <div className="responsive-grid" style={{ gridTemplateColumns: '1fr 350px' }}>
        
        {/* Días Existentes */}
        <div className="glass-panel" style={{ backgroundColor: 'var(--glass-bg)' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '16px' }}>Días Configurables ({existingDays.length})</h3>
          
          {existingDays.length === 0 ? (
            <p style={{ color: 'var(--color-text-muted)' }}>No hay días configurados. ¡Agrega el Día 1 en el panel lateral!</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {existingDays.map(day => (
                <div key={day.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--color-tertiary)', padding: '16px', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                  <div>
                    <h4 style={{ fontSize: '1.1rem', color: 'var(--color-text-main)', marginBottom: '4px' }}>
                      <span style={{ color: 'var(--color-text-muted)', marginRight: '8px' }}>Día {day.dayNumber}</span>
                      {day.title}
                    </h4>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Porción a leer: {day.bibleRefs}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ backgroundColor: 'rgba(74, 226, 144, 0.1)', padding: '6px 12px', borderRadius: '4px', border: '1px solid #4ae290' }}>
                      <span style={{ fontSize: '0.8rem', color: '#4ae290', fontWeight: 'bold' }}>+{day.xpReward} XP</span>
                    </div>
                    
                    <Link href={`/dashboard/admin/planes/${planId}/dias/${day.id}/editar`} style={{ backgroundColor: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--color-text-muted)', borderRadius: '4px', padding: '6px 12px', fontSize: '0.75rem', cursor: 'pointer', textAlign: 'center', textDecoration: 'none' }}>
                      Editar
                    </Link>
                    
                    <form action={async () => { 'use server'; const { deletePlanDayAction } = await import('@/app/actions/admin'); const fd = new FormData(); fd.append('dayId', day.id.toString()); fd.append('planId', plan.id.toString()); await deletePlanDayAction(fd); }}>
                      <button type="submit" style={{ backgroundColor: 'rgba(255, 71, 87, 0.1)', border: '1px solid rgba(255, 71, 87, 0.5)', color: '#ff4757', borderRadius: '4px', padding: '6px 12px', fontSize: '0.75rem', cursor: 'pointer' }}>
                        Borrar
                      </button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Formulario Agregar Día */}
        <div className="glass-panel" style={{ height: 'fit-content', backgroundColor: 'var(--color-tertiary)', border: '1px solid var(--glass-border)' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '16px' }}>Agregar Día {nextDayNumber}</h3>
          
          <form action={async (formData) => {
            'use server';
            const { addPlanDayAction } = await import('@/app/actions/admin');
            await addPlanDayAction(formData);
          }} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <input type="hidden" name="planId" value={plan.id} />
            <input type="hidden" name="dayNumber" value={nextDayNumber} />
            
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '8px' }}>Título del Devocional (Opcional)</label>
              <input type="text" name="title" className="input-field" placeholder="Ej. El Principio del Temor a Dios" />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '8px' }}>Cuerpo del Devocional (Opcional)</label>
              <textarea name="content" className="input-field" placeholder="Escribe aquí la reflexión del día..." rows={6} style={{ resize: 'vertical' }}></textarea>
            </div>

            <VerseInput />

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '8px' }}>Recompensa por lectura (XP) *</label>
              <input type="number" name="xpReward" className="input-field" defaultValue={10} required />
            </div>
            
            <button type="submit" className="btn-primary" style={{ marginTop: '8px', padding: '12px' }}>
              + AGREGAR DÍA {nextDayNumber}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
