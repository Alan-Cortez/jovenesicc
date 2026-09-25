import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth';
import { db } from '@/lib/db';
import { readingPlans } from '@/lib/schema';
import { redirect } from 'next/navigation';
import { createReadingPlanAction } from '@/app/actions/admin';
import Link from 'next/link';
import { desc } from 'drizzle-orm';

export default async function AdminPlanesPage() {
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

  const { not, eq } = await import('drizzle-orm');
  const allPlans = await db.select().from(readingPlans).where(not(eq(readingPlans.title, 'Personal'))).orderBy(desc(readingPlans.createdAt));

  return (
    <div style={{ padding: '40px 24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <h2 style={{ fontSize: '2rem' }}>Gestión de Planes de Lectura</h2>
      </div>

      <div className="responsive-grid" style={{ gridTemplateColumns: '1fr 380px' }}>
        
        {/* Lista de Planes (Card Layout) */}
        <div className="glass-panel" style={{ backgroundColor: 'var(--glass-bg)', padding: '24px', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '24px', fontWeight: 600 }}>Planes de Lectura ({allPlans.length})</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {allPlans.length === 0 ? (
               <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '40px 0' }}>No has creado ningún plan de lectura.</p>
            ) : allPlans.map(plan => (
              <div key={plan.id} style={{ 
                backgroundColor: 'rgba(255,255,255,0.02)', 
                border: '1px solid var(--glass-border)', 
                borderRadius: '12px', 
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
              }}>
                {/* Cabecera Card */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
                  <div>
                    <h4 style={{ fontSize: '1.15rem', fontWeight: 'bold', color: 'var(--color-text-main)', margin: '0 0 6px 0', lineHeight: 1.3 }}>
                      <span style={{ color: 'var(--color-text-muted)', fontWeight: 'normal', marginRight: '6px' }}>#{plan.id}</span>
                      {plan.title}
                    </h4>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{plan.totalDays} Días totales</span>
                      <span style={{ 
                        fontSize: '0.7rem', 
                        padding: '2px 8px', 
                        borderRadius: '12px',
                        backgroundColor: plan.isActive ? 'rgba(74, 226, 144, 0.15)' : 'rgba(255,255,255,0.1)',
                        color: plan.isActive ? '#4ae290' : 'var(--color-text-muted)',
                        fontWeight: 600,
                        letterSpacing: '0.05em'
                      }}>
                        {plan.isActive ? 'ACTIVO' : 'INACTIVO'}
                      </span>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                    <Link href={`/dashboard/admin/planes/${plan.id}/editar`} style={{ color: 'var(--color-text-main)', textDecoration: 'none', fontSize: '0.8rem', padding: '6px 12px', borderRadius: '6px', backgroundColor: 'rgba(255,255,255,0.08)', fontWeight: 500 }}>
                      Editar
                    </Link>
                    
                    {plan.isActive ? (
                      <form action={async () => {
                        'use server';
                        const { deleteReadingPlanAction } = await import('@/app/actions/admin');
                        const fd = new FormData();
                        fd.append('planId', plan.id.toString());
                        await deleteReadingPlanAction(fd);
                      }}>
                        <button type="submit" style={{ color: '#ff6b6b', textDecoration: 'none', fontSize: '0.8rem', padding: '6px 12px', borderRadius: '6px', backgroundColor: 'rgba(255,107,107,0.1)', border: 'none', cursor: 'pointer', fontWeight: 500 }} title="Ocultar Plan">
                          Inactivar
                        </button>
                      </form>
                    ) : (
                      <>
                        <form action={async () => {
                          'use server';
                          const { reactivateReadingPlanAction } = await import('@/app/actions/admin');
                          const fd = new FormData();
                          fd.append('planId', plan.id.toString());
                          await reactivateReadingPlanAction(fd);
                        }}>
                          <button type="submit" style={{ color: '#4ae290', textDecoration: 'none', fontSize: '0.8rem', padding: '6px 12px', borderRadius: '6px', backgroundColor: 'rgba(74,226,144,0.1)', border: 'none', cursor: 'pointer', fontWeight: 500 }}>
                            Reactivar
                          </button>
                        </form>
                        <form action={async () => {
                          'use server';
                          const { hardDeleteReadingPlanAction } = await import('@/app/actions/admin');
                          const fd = new FormData();
                          fd.append('planId', plan.id.toString());
                          await hardDeleteReadingPlanAction(fd);
                        }}>
                          <button type="submit" style={{ color: '#ff4757', textDecoration: 'none', fontSize: '0.8rem', padding: '6px 12px', borderRadius: '6px', backgroundColor: 'rgba(255,71,87,0.15)', border: 'none', cursor: 'pointer', fontWeight: 500 }} title="Eliminar definitivamente">
                            Eliminar
                          </button>
                        </form>
                      </>
                    )}
                  </div>
                </div>

                {/* Descripcion */}
                {plan.description && (
                  <p style={{ 
                    fontSize: '0.9rem', 
                    color: 'var(--color-text-muted)', 
                    margin: 0,
                    lineHeight: 1.5,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {plan.description}
                  </p>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', marginTop: '4px', borderTop: '1px solid var(--glass-border)', paddingTop: '16px' }}>
                  <Link href={`/dashboard/admin/planes/${plan.id}/dias`} style={{ backgroundColor: 'var(--color-primary)', color: '#000', borderRadius: '8px', padding: '10px 4px', fontSize: '0.85rem', fontWeight: 'bold', cursor: 'pointer', textAlign: 'center', textDecoration: 'none', transition: 'opacity 0.2s' }}>
                    Redactar Días
                  </Link>
                  <Link href={`/dashboard/admin/planes/${plan.id}/asignar`} style={{ backgroundColor: 'rgba(74, 144, 226, 0.15)', color: '#4a90e2', borderRadius: '8px', padding: '10px 4px', fontSize: '0.85rem', fontWeight: 'bold', cursor: 'pointer', textAlign: 'center', textDecoration: 'none', transition: 'background 0.2s' }}>
                    Asignar a Grupos
                  </Link>
                  <Link href={`/dashboard/admin/planes/${plan.id}/respuestas`} style={{ backgroundColor: 'rgba(74, 226, 144, 0.15)', color: '#4ae290', borderRadius: '8px', padding: '10px 4px', fontSize: '0.85rem', fontWeight: 'bold', cursor: 'pointer', textAlign: 'center', textDecoration: 'none', transition: 'background 0.2s' }}>
                    Ver Respuestas
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Crear Plan Form */}
        <div className="glass-panel" style={{ height: 'fit-content', backgroundColor: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '16px', padding: '24px' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '24px', fontWeight: 600 }}>Crear Nuevo Plan</h3>
          <form action={async (formData) => {
            'use server';
            const { createReadingPlanAction } = await import('@/app/actions/admin');
            await createReadingPlanAction(formData);
          }} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, color: 'var(--color-text-main)', marginBottom: '8px' }}>Foto de Portada (Opcional)</label>
              <div style={{ position: 'relative' }}>
                <input type="file" name="cover" accept="image/*" style={{ 
                  width: '100%', 
                  padding: '10px 14px', 
                  backgroundColor: 'rgba(0,0,0,0.2)', 
                  border: '1px dashed var(--glass-border)', 
                  borderRadius: '8px',
                  color: 'var(--color-text-muted)',
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }} />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, color: 'var(--color-text-main)', marginBottom: '8px' }}>Título del Plan *</label>
              <input type="text" name="title" className="input-field" placeholder="Ej. Reto Proverbios en 31 Días" required style={{ backgroundColor: 'rgba(0,0,0,0.2)', padding: '12px 14px', fontSize: '0.9rem' }} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, color: 'var(--color-text-main)', marginBottom: '8px' }}>Descripción corta</label>
              <textarea name="description" className="input-field" placeholder="Un capítulo por día..." rows={4} style={{ backgroundColor: 'rgba(0,0,0,0.2)', padding: '12px 14px', fontSize: '0.9rem', resize: 'vertical' }}></textarea>
            </div>
            
            <button type="submit" className="btn-primary" style={{ marginTop: '8px', padding: '14px', fontSize: '0.95rem', borderRadius: '10px' }}>
              Crear Plan
            </button>

            <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px', borderLeft: '3px solid var(--color-primary)' }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', margin: 0, lineHeight: 1.5 }}>
                <b>Nota:</b> Después de crear el plan, podrás redactar su contenido (versículos) y asignarlo a los grupos desde la lista de planes.
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
