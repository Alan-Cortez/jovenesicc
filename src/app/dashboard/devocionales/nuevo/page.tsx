'use client';

import Link from 'next/link';
import { useState } from 'react';
import { createDevotionalAction } from '@/app/actions/devotionals';
import { useRouter } from 'next/navigation';

export default function NuevoDevocionalPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    const result = await createDevotionalAction(formData);
    setLoading(false);
    
    if (result.error) {
      setError(result.error);
    } else if (result.success) {
      router.push('/dashboard/devocionales');
    }
  }

  return (
    <main className="container" style={{ padding: '40px 24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Link href="/dashboard/devocionales" style={{ color: '#a0aab2', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 0.2s' }}>
          ← Volver a Mis Devocionales
        </Link>
      </div>

      <div className="glass-panel" style={{ maxWidth: '800px', margin: '0 auto', backgroundColor: '#000000' }}>
        <div style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '24px', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '2rem', marginBottom: '8px' }}>Nuevo Devocional</h2>
          <p style={{ color: '#a0aab2' }}>Toma un tiempo para reflexionar en la palabra.</p>
        </div>
        
        {error && (
          <div style={{ backgroundColor: 'rgba(255, 107, 107, 0.1)', border: '1px solid #ff6b6b', color: '#ff6b6b', padding: '12px', borderRadius: '6px', marginBottom: '24px', fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        <form action={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: '#ffffff', fontWeight: 'bold' }}>
              1. ¿Qué leí? (Resumen bíblico)
            </label>
            <textarea name="whatIRead" className="input-field" rows={3} placeholder="Escribe aquí los pasajes que leíste y un breve resumen..." required></textarea>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: '#ffffff', fontWeight: 'bold' }}>
              2. ¿Qué entendí? (Explicación)
            </label>
            <textarea name="whatIUnderstood" className="input-field" rows={3} placeholder="¿Qué significa este pasaje en su contexto?" required></textarea>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: '#ffffff', fontWeight: 'bold' }}>
              3. ¿Qué me habló Dios? (Rhema)
            </label>
            <textarea name="whatGodToldMe" className="input-field" rows={3} placeholder="¿Qué sentiste que Dios te decía personalmente a través de esta lectura?" required></textarea>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: '#ffffff', fontWeight: 'bold' }}>
              4. ¿Cómo lo aplico? (Práctica)
            </label>
            <textarea name="whatIPractice" className="input-field" rows={3} placeholder="¿Qué acción vas a tomar hoy basado en esto?" required></textarea>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
            <input type="checkbox" name="isPublic" id="isPublic" style={{ width: '16px', height: '16px' }} />
            <label htmlFor="isPublic" style={{ fontSize: '0.9rem', color: '#a0aab2' }}>
              Hacer público (permitir que mi grupo/célula pueda leerlo y reaccionar)
            </label>
          </div>

          <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn-primary" disabled={loading} style={{ padding: '12px 32px' }}>
              {loading ? 'GUARDANDO...' : 'GUARDAR DEVOCIONAL'}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
