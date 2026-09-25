'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { finishDayAction } from '@/app/actions/reading';
import { fetchVersesAction } from '@/app/actions/bible';

export default function LecturaClient({ plan, day, isCompleted }: { plan: any, day: any, isCompleted: boolean }) {
  const [step, setStep] = useState(0); // 0: Devotional, 1: Scripture, 2: Form
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const [verses, setVerses] = useState<any[]>([]);
  const [loadingVerses, setLoadingVerses] = useState(false);
  const [verseError, setVerseError] = useState('');

  useEffect(() => {
    async function loadVerses() {
      setLoadingVerses(true);
      const res = await fetchVersesAction(day.bibleRefs);
      if (res.success && res.data) {
        setVerses(res.data);
      } else {
        setVerseError(res.error || 'Error al cargar');
      }
      setLoadingVerses(false);
    }
    loadVerses();
  }, [day.bibleRefs]);

  async function handleFinish(formData: FormData) {
    setLoading(true);
    const result = await finishDayAction(
      plan.id,
      day.id,
      formData.get('whatIRead') as string,
      formData.get('whatIUnderstood') as string,
      formData.get('whatGodToldMe') as string,
      formData.get('whatIPractice') as string
    );
    setLoading(false);
    
    if (result.success) {
      router.push(`/dashboard/planes/${plan.id}`);
    } else {
      alert(result.error);
    }
  }

  // Common Header for Reading Mode
  const Header = ({ title, subtitle }: { title: string, subtitle?: string }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid var(--glass-border)', backgroundColor: 'var(--color-tertiary)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <h2 style={{ fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '1px', margin: 0 }}>{title}</h2>
        {subtitle && <span style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>{subtitle}</span>}
      </div>
      <Link href={`/dashboard/planes/${plan.id}`} style={{ textDecoration: 'none' }}>
        <button style={{ backgroundColor: 'var(--glass-bg)', color: 'var(--color-text-main)', border: '1px solid var(--glass-border)', borderRadius: '50px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          ✕
        </button>
      </Link>
    </div>
  );

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'var(--color-tertiary)',
      zIndex: 9999, // Cover everything including sidebar
      overflowY: 'auto',
      display: 'flex',
      flexDirection: 'column'
    }}>
      
      {/* Progress Bar */}
      <div style={{ height: '4px', backgroundColor: 'var(--glass-border)', width: '100%' }}>
        <div style={{ height: '100%', width: `${((step + 1) / 3) * 100}%`, backgroundColor: '#4a90e2', transition: 'width 0.3s ease' }} />
      </div>

      {step === 0 && (
        <>
          <Header title="Devocional" subtitle={`Día ${day.dayNumber}`} />
          <div style={{ flex: 1, padding: '40px 24px', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '24px' }}>{day.title || `Devocional Día ${day.dayNumber}`}</h1>
            <div style={{ fontSize: '1.1rem', lineHeight: '1.8', color: 'var(--color-text-main)', whiteSpace: 'pre-wrap' }}>
              {day.content ? day.content : (
                <p style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>No se incluyó un devocional para este día.</p>
              )}
            </div>
          </div>
          <div style={{ padding: '24px', borderTop: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'flex-end', backgroundColor: 'var(--color-tertiary)' }}>
            <button onClick={() => setStep(1)} style={{ backgroundColor: 'var(--color-text-main)', color: 'var(--color-tertiary)', border: 'none', padding: '16px 32px', borderRadius: '50px', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer' }}>
              Continuar a la Lectura ›
            </button>
          </div>
        </>
      )}

      {step === 1 && (
        <>
          <Header title="Lectura Bíblica" subtitle={day.bibleRefs} />
          <div style={{ flex: 1, padding: '40px 24px', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
            <h1 style={{ fontSize: '2rem', textAlign: 'center', marginBottom: '40px' }}>{day.bibleRefs}</h1>
            
            <div style={{ backgroundColor: 'var(--glass-bg)', padding: '32px', borderRadius: '12px', border: '1px solid var(--glass-border)', minHeight: '300px' }}>
              {loadingVerses ? (
                <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '40px 0' }}>Cargando texto bíblico...</div>
              ) : verseError || verses.length === 0 ? (
                <div style={{ textAlign: 'center' }}>
                  <p style={{ color: '#ff4757', marginBottom: '16px' }}>No se pudo cargar la cita automáticamente.</p>
                  <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', lineHeight: '1.8' }}>
                    Por favor, lee <strong>{day.bibleRefs}</strong> en tu Biblia física o app preferida.
                  </p>
                </div>
              ) : (
                <div style={{ fontSize: '1.2rem', lineHeight: '1.8', color: 'var(--color-text-main)' }}>
                  {verses.map((ref, idx) => (
                    <div key={idx} style={{ marginBottom: '32px' }}>
                      <h3 style={{ fontSize: '1.4rem', color: 'var(--color-text-main)', marginBottom: '16px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '8px' }}>
                        {ref.bookName} {ref.chapter}
                      </h3>
                      <p>
                        {ref.verses.map((v: any) => (
                          <span key={v.number}>
                            <sup style={{ color: 'var(--color-text-muted)', fontWeight: 'bold', marginRight: '6px', fontSize: '0.8rem' }}>{v.number}</sup>
                            {v.text}{' '}
                          </span>
                        ))}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div style={{ padding: '24px', borderTop: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', backgroundColor: 'var(--color-tertiary)' }}>
            <button onClick={() => setStep(0)} style={{ backgroundColor: 'transparent', color: 'var(--color-text-muted)', border: 'none', padding: '16px 24px', fontSize: '1.1rem', cursor: 'pointer' }}>
              ‹ Regresar
            </button>
            <button onClick={() => setStep(2)} style={{ backgroundColor: 'var(--color-text-main)', color: 'var(--color-tertiary)', border: 'none', padding: '16px 32px', borderRadius: '50px', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer' }}>
              Ir al Diario ›
            </button>
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <Header title="Reflexión Final" subtitle="Tu Diario" />
          <div style={{ flex: 1, padding: '40px 24px', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
            <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>Tu Diario</h1>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '32px' }}>Tómate un momento para reflexionar sobre lo que leíste hoy.</p>
            
            {isCompleted ? (
              <div style={{ backgroundColor: 'rgba(74, 226, 144, 0.1)', padding: '24px', borderRadius: '12px', border: '1px solid #4ae290', textAlign: 'center' }}>
                <h3 style={{ color: '#4ae290', marginBottom: '8px' }}>¡Ya completaste este día!</h3>
                <p style={{ color: 'var(--color-text-muted)' }}>Vuelve mañana para continuar tu plan de lectura.</p>
              </div>
            ) : (
              <form action={handleFinish} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '1rem', marginBottom: '8px', fontWeight: 'bold' }}>¿Qué leí?</label>
                  <textarea name="whatIRead" className="input-field" rows={2} placeholder="Breve resumen..." required></textarea>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '1rem', marginBottom: '8px', fontWeight: 'bold' }}>¿Qué entendí?</label>
                  <textarea name="whatIUnderstood" className="input-field" rows={3} placeholder="Lo que aprendí de este pasaje..." required></textarea>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '1rem', marginBottom: '8px', fontWeight: 'bold' }}>¿Qué me dijo Dios?</label>
                  <textarea name="whatGodToldMe" className="input-field" rows={3} placeholder="Aplicación personal..." required></textarea>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '1rem', marginBottom: '8px', fontWeight: 'bold' }}>¿Cómo lo pongo en práctica?</label>
                  <textarea name="whatIPractice" className="input-field" rows={2} placeholder="Pasos de acción..." required></textarea>
                </div>
                
                <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <button type="button" onClick={() => setStep(1)} style={{ backgroundColor: 'transparent', color: 'var(--color-text-muted)', border: 'none', fontSize: '1rem', cursor: 'pointer' }}>
                    ‹ Regresar
                  </button>
                  <button type="submit" disabled={loading} style={{ backgroundColor: '#4ae290', color: '#000', border: 'none', padding: '16px 32px', borderRadius: '50px', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer' }}>
                    {loading ? 'Guardando...' : `TERMINAR Y GANAR +${day.xpReward} XP ✓`}
                  </button>
                </div>
              </form>
            )}
          </div>
        </>
      )}

    </div>
  );
}
