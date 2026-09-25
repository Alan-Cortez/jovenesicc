import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth';
import { db } from '@/lib/db';
import { devotionals, readingPlanDays, readingPlans } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function DevocionalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session')?.value;
  if (!sessionToken) redirect('/login');
  
  let user;
  try {
    user = await decrypt(sessionToken);
  } catch {
    redirect('/login');
  }

  const { id } = await params;
  const devotionalId = parseInt(id, 10);
  if (isNaN(devotionalId)) redirect('/dashboard/devocionales');

  // Buscar el devocional
  const devResult = await db.select({
    id: devotionals.id,
    whatIRead: devotionals.whatIRead,
    whatIUnderstood: devotionals.whatIUnderstood,
    whatGodToldMe: devotionals.whatGodToldMe,
    whatIPractice: devotionals.whatIPractice,
    createdAt: devotionals.createdAt,
    userId: devotionals.userId,
    isPublic: devotionals.isPublic,
    planDayTitle: readingPlanDays.title,
    planDayRefs: readingPlanDays.bibleRefs,
    planTitle: readingPlans.title,
  })
  .from(devotionals)
  .leftJoin(readingPlanDays, eq(devotionals.planDayId, readingPlanDays.id))
  .leftJoin(readingPlans, eq(readingPlanDays.planId, readingPlans.id))
  .where(eq(devotionals.id, devotionalId))
  .limit(1);

  const dev = devResult[0];

  if (!dev) {
    redirect('/dashboard/devocionales');
  }

  // Si no es el dueño y no es publico, ni tampoco es admin
  if (dev.userId !== user.id && !dev.isPublic && user.role !== 'admin' && user.role !== 'lider') {
    redirect('/dashboard/devocionales');
  }

  const dateObj = new Date(dev.createdAt.includes('T') ? dev.createdAt : dev.createdAt.replace(' ', 'T') + 'Z');
  const date = dateObj.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute:'2-digit' });

  return (
    <main className="container" style={{ padding: '40px 24px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <Link href="/dashboard/devocionales" style={{ color: '#a0aab2', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 0.2s' }}>
          ← Volver a Mis Devocionales
        </Link>
      </div>

      <div className="glass-panel" style={{ backgroundColor: 'var(--glass-bg)', padding: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '2rem', marginBottom: '8px', color: '#fff' }}>Reflexión Personal</h1>
            {dev.planTitle && dev.planTitle !== 'Personal' && (
              <span style={{ color: '#4ae290', fontSize: '0.9rem', fontWeight: 'bold' }}>
                📖 Del plan: {dev.planTitle} {dev.planDayTitle ? ` - ${dev.planDayTitle}` : ''}
              </span>
            )}
          </div>
          <span style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>{date}</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          <div>
            <h3 style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '1px' }}>¿Qué leí?</h3>
            <p style={{ color: 'var(--color-text-main)', lineHeight: '1.8', fontSize: '1.1rem', margin: 0, backgroundColor: 'var(--color-tertiary)', padding: '20px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
              {dev.whatIRead || 'Lectura completada.'}
            </p>
          </div>
          
          <div>
            <h3 style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '1px' }}>¿Qué entendí?</h3>
            <p style={{ color: 'var(--color-text-main)', lineHeight: '1.8', fontSize: '1.1rem', margin: 0, backgroundColor: 'var(--color-tertiary)', padding: '20px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
              {dev.whatIUnderstood || 'Sin respuesta.'}
            </p>
          </div>

          <div>
            <h3 style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '1px' }}>¿Qué me dijo Dios?</h3>
            <p style={{ color: 'var(--color-text-main)', lineHeight: '1.8', fontSize: '1.1rem', margin: 0, backgroundColor: 'var(--color-tertiary)', padding: '20px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
              {dev.whatGodToldMe || 'Sin respuesta.'}
            </p>
          </div>

          <div>
            <h3 style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '1px' }}>¿Cómo lo pongo en práctica?</h3>
            <p style={{ color: 'var(--color-text-main)', lineHeight: '1.8', fontSize: '1.1rem', margin: 0, backgroundColor: 'var(--color-tertiary)', padding: '20px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
              {dev.whatIPractice || 'Sin respuesta.'}
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
