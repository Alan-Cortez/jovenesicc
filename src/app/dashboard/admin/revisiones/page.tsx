import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth';
import { db } from '@/lib/db';
import { taskSubmissions, tasks, users } from '@/lib/schema';
import { eq, desc } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { reviewSubmissionAction } from '@/app/actions/admin';

export default async function AdminRevisionesPage() {
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

  // Fetch pending submissions joined with user and task details
  const pendingReviews = await db.select({
    id: taskSubmissions.id,
    evidence: taskSubmissions.evidence,
    submittedAt: taskSubmissions.submittedAt,
    taskTitle: tasks.title,
    xpReward: tasks.xpReward,
    evidenceType: tasks.evidenceType,
    userName: users.name,
    userMatricula: users.matricula
  })
  .from(taskSubmissions)
  .innerJoin(tasks, eq(taskSubmissions.taskId, tasks.id))
  .innerJoin(users, eq(taskSubmissions.userId, users.id))
  .where(eq(taskSubmissions.status, 'pending'))
  .orderBy(desc(taskSubmissions.submittedAt));

  return (
    <div style={{ padding: '40px 24px', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <h2 style={{ fontSize: '2rem' }}>Buzón de Revisión</h2>
      </div>

      <div className="glass-panel" style={{ backgroundColor: 'var(--glass-bg)' }}>
        <h3 style={{ fontSize: '1.2rem', marginBottom: '16px' }}>Evidencias Pendientes ({pendingReviews.length})</h3>
        
        {pendingReviews.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)' }}>No hay evidencias pendientes por revisar. ¡Todo al día!</p>
        ) : (
          <div style={{ display: 'grid', gap: '24px' }}>
            {pendingReviews.map(review => (
              <div key={review.id} style={{ backgroundColor: 'var(--color-tertiary)', padding: '24px', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div>
                    <h4 style={{ fontSize: '1.2rem', color: 'var(--color-text-main)', marginBottom: '4px' }}>{review.taskTitle}</h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                      Enviado por: <strong>{review.userName}</strong> ({review.userMatricula}) el {new Date(review.submittedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div style={{ backgroundColor: 'rgba(255,255,255,0.06)', padding: '6px 12px', borderRadius: '4px', border: '1px solid var(--glass-border)' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-primary)', fontWeight: 'bold' }}>+{review.xpReward} XP</span>
                  </div>
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <h5 style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Evidencia ({review.evidenceType}):</h5>
                  <div style={{ backgroundColor: '#111', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    {(() => {
                      try {
                        const parsed = JSON.parse(review.evidence || '{}');
                        if (!parsed.text && (!parsed.files || parsed.files.length === 0)) throw new Error();
                        return (
                          <>
                            {parsed.text && <p style={{ color: '#fff', whiteSpace: 'pre-wrap', marginBottom: '16px' }}>{parsed.text}</p>}
                            {parsed.files && Array.isArray(parsed.files) && parsed.files.map((fileData: string, idx: number) => (
                              fileData.startsWith('data:video') ? (
                                <video key={idx} src={fileData} controls style={{ maxWidth: '100%', maxHeight: '400px', borderRadius: '4px', marginBottom: '8px' }} />
                              ) : (
                                <img key={idx} src={fileData} alt="Evidencia" style={{ maxWidth: '100%', maxHeight: '400px', borderRadius: '4px', marginBottom: '8px' }} />
                              )
                            ))}
                          </>
                        );
                      } catch {
                        return review.evidenceType === 'media' || review.evidenceType === 'file' ? (
                          review.evidence?.startsWith('data:image') || review.evidence?.startsWith('http') ? (
                            <img src={review.evidence} alt="Evidencia" style={{ maxWidth: '100%', maxHeight: '400px', borderRadius: '4px' }} />
                          ) : (
                            <p style={{ color: '#ff6b6b' }}>Formato de archivo no soportado.</p>
                          )
                        ) : (
                          <p style={{ color: '#fff', whiteSpace: 'pre-wrap' }}>{review.evidence || 'No se adjuntó texto.'}</p>
                        );
                      }
                    })()}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end' }}>
                  <form action={async (formData) => {
                    'use server';
                    const { reviewSubmissionAction } = await import('@/app/actions/admin');
                    await reviewSubmissionAction(formData);
                  }}>
                    <input type="hidden" name="submissionId" value={review.id} />
                    <input type="hidden" name="actionType" value="reject" />
                    <button type="submit" style={{ backgroundColor: 'transparent', border: '1px solid rgba(255,255,255,0.4)', color: 'var(--color-text-muted)', padding: '8px 24px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                      RECHAZAR
                    </button>
                  </form>
                  <form action={async (formData) => {
                    'use server';
                    const { reviewSubmissionAction } = await import('@/app/actions/admin');
                    await reviewSubmissionAction(formData);
                  }}>
                    <input type="hidden" name="submissionId" value={review.id} />
                    <input type="hidden" name="actionType" value="approve" />
                    <button type="submit" style={{ backgroundColor: 'var(--color-primary)', border: 'none', color: 'var(--color-tertiary)', padding: '8px 24px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                      APROBAR Y DAR XP
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
