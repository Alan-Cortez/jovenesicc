import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth';
import { db } from '@/lib/db';
import { devotionals, readingPlanDays, readingPlans } from '@/lib/schema';
import { eq, desc } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import styles from './devocionales.module.css';
import { deleteDevotionalAction } from '@/app/actions/devotionals';

export default async function DevocionalesPage() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session')?.value;
  if (!sessionToken) redirect('/login');
  
  let user;
  try {
    user = await decrypt(sessionToken);
  } catch {
    redirect('/login');
  }

  // Traer devocionales del usuario con info del plan
  const userDevotionals = await db
    .select({
      id: devotionals.id,
      whatIRead: devotionals.whatIRead,
      whatIUnderstood: devotionals.whatIUnderstood,
      whatGodToldMe: devotionals.whatGodToldMe,
      whatIPractice: devotionals.whatIPractice,
      createdAt: devotionals.createdAt,
      isPublic: devotionals.isPublic,
      planDayTitle: readingPlanDays.title,
      planDayNumber: readingPlanDays.dayNumber,
      planDayRefs: readingPlanDays.bibleRefs,
      planTitle: readingPlans.title,
    })
    .from(devotionals)
    .leftJoin(readingPlanDays, eq(devotionals.planDayId, readingPlanDays.id))
    .leftJoin(readingPlans, eq(readingPlanDays.planId, readingPlans.id))
    .where(eq(devotionals.userId, user.id))
    .orderBy(desc(devotionals.createdAt));

  // Calcular racha de devocionales (dias consecutivos)
  let streak = 0;
  if (userDevotionals.length > 0) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const dates = userDevotionals.map(d => {
      const dtStr = d.createdAt.includes('T') ? d.createdAt : d.createdAt.replace(' ', 'T') + 'Z';
      const dt = new Date(dtStr);
      dt.setHours(0, 0, 0, 0);
      return dt.getTime();
    });
    const uniqueDates = [...new Set(dates)].sort((a, b) => b - a);
    
    const todayTime = today.getTime();
    const oneDay = 86400000;
    
    // La racha debe empezar hoy o ayer
    if (uniqueDates[0] >= todayTime - oneDay) {
      streak = 1;
      for (let i = 1; i < uniqueDates.length; i++) {
        if (uniqueDates[i - 1] - uniqueDates[i] <= oneDay) {
          streak++;
        } else {
          break;
        }
      }
    }
  }

  const totalCount = userDevotionals.length;

  return (
    <div className={styles.root}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Mis Devocionales</h1>
          <p className={styles.pageSub}>Un registro de tu tiempo con Dios</p>
        </div>
        <Link href="/dashboard/devocionales/nuevo" style={{ textDecoration: 'none' }}>
          <button className={styles.newBtn}>
            NUEVO DEVOCIONAL
          </button>
        </Link>
      </div>

      {/* Estadisticas rapidas */}
      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <span className={styles.statNumber}>{totalCount}</span>
          <span className={styles.statLabel}>Devocionales escritos</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statNumber}>{streak}</span>
          <span className={styles.statLabel}>{streak === 1 ? 'Dia de racha' : 'Dias de racha'}</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statNumber}>{userDevotionals.filter(d => d.isPublic).length}</span>
          <span className={styles.statLabel}>Compartidos</span>
        </div>
      </div>

      {userDevotionals.length === 0 ? (
        <div className={styles.emptyCard}>
          <p style={{ marginBottom: '8px', fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--color-text-main)' }}>Aun no tienes devocionales</p>
          <p>Escribe tu primera reflexion y comienza tu racha con Dios.</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {userDevotionals.map(dev => (
            <div key={dev.id} className={styles.card}>
              <div className={styles.cardTop}>
                <span className={styles.date}>
                  {new Date(dev.createdAt.includes('T') ? dev.createdAt : dev.createdAt.replace(' ', 'T') + 'Z').toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
                {dev.planTitle && dev.planTitle !== 'Personal' && (
                  <span className={styles.planTag}>
                    {dev.planTitle} {dev.planDayNumber ? `- Dia ${dev.planDayNumber}` : ''}
                  </span>
                )}
              </div>
              
              {dev.planDayRefs && dev.planDayRefs !== 'N/A' && (
                <p className={styles.bibleRef}>{dev.planDayRefs}</p>
              )}
              
              <p className={styles.content}>
                "{dev.whatGodToldMe.substring(0, 120)}{dev.whatGodToldMe.length > 120 ? '...' : ''}"
              </p>
              
              <div className={styles.footer}>
                <span className={`${styles.privacy} ${dev.isPublic ? styles.privacyPublic : styles.privacyPrivate}`}>
                  {dev.isPublic ? 'Publico' : 'Privado'}
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Link href={`/dashboard/devocionales/${dev.id}`} style={{ textDecoration: 'none' }}>
                    <button className={styles.actionBtn}>
                      LEER
                    </button>
                  </Link>
                  <form action={deleteDevotionalAction}>
                    <input type="hidden" name="id" value={dev.id} />
                    <button type="submit" className={styles.deleteBtn}>
                      ELIMINAR
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
