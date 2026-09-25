'use client';

import { useState } from 'react';
import { loginAction } from '@/app/actions/auth';
import { useRouter } from 'next/navigation';
import styles from './login.module.css';
import Link from 'next/link';

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const result = await loginAction(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else if (result?.success) {
      router.push('/dashboard');
    }
  }

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.mainCard}>
        {/* Decoraciones de fondo imitando el diseño */}
        <div className={styles.bgShape1}></div>
        <div className={styles.bgShape2}></div>
        <div className={styles.bgShape3}></div>
        <div className={styles.bgCircle}></div>
        
        <div className={styles.bgCross} style={{ top: '15%', left: '15%' }}>+</div>
        <div className={styles.bgCross} style={{ top: '35%', left: '10%' }}>+</div>
        <div className={styles.bgCross} style={{ bottom: '15%', right: '20%' }}>+</div>
        <div className={styles.bgCross} style={{ top: '10%', right: '10%', opacity: 0.5 }}>+</div>

        <div className={styles.contentWrapper}>
          <div style={{ textAlign: 'center', marginBottom: '32px', zIndex: 1, position: 'relative' }}>
            <img src="/logo.png" alt="Jóvenes CON TODO" style={{ width: '160px', height: '160px', borderRadius: '50%', objectFit: 'cover', boxShadow: '0 8px 32px rgba(0,0,0,0.8)', border: '2px solid rgba(255,255,255,0.1)' }} />
          </div>

          <div className={styles.loginBox}>
            {error && (
              <div style={{ backgroundColor: 'rgba(255, 107, 107, 0.1)', color: '#ff6b6b', padding: '12px', borderRadius: '8px', marginBottom: '20px', border: '1px solid rgba(255,107,107,0.3)', fontSize: '0.85rem', textAlign: 'center' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className={styles.inputGroup}>
                <label className={styles.label}>MATRÍCULA</label>
                <input 
                  type="text" 
                  name="matricula" 
                  required 
                  className={styles.input} 
                  autoComplete="off"
                />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>CONTRASEÑA</label>
                <input 
                  type="password" 
                  name="password" 
                  required 
                  className={styles.input} 
                />
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <button type="submit" className={styles.submitBtn} disabled={loading}>
                  {loading ? 'ENTRANDO...' : 'LOG IN'} 
                  {!loading && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#00a8ff', borderRadius: '50%', width: '16px', height: '16px', marginLeft: '4px' }}>
                      <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12h14M12 5l7 7-7 7"/>
                      </svg>
                    </div>
                  )}
                </button>
              </div>
            </form>
          </div>

          <Link href="#" className={styles.forgotLink}>
            FORGOT YOUR PASSWORD?
          </Link>
        </div>
      </div>
    </div>
  );
}
