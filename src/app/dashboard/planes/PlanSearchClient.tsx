'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function PlanSearchClient({ planes }: { planes: any[] }) {
  const [search, setSearch] = useState('');

  const filtered = planes.filter(p => 
    p.title.toLowerCase().includes(search.toLowerCase()) || 
    (p.description && p.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div>
      {/* Search Bar */}
      <div style={{ marginBottom: '32px', position: 'relative' }}>
        <input 
          type="text" 
          placeholder="Busca planes, temas..." 
          className="input-field"
          style={{ paddingLeft: '44px', backgroundColor: 'var(--color-tertiary)', borderRadius: '50px', border: '1px solid var(--glass-border)' }}
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </div>
      </div>

      <h3 style={{ fontSize: '1.2rem', marginBottom: '16px', color: 'var(--color-text-main)' }}>Resultados de búsqueda</h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {filtered.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)' }}>No se encontraron planes con esa búsqueda.</p>
        ) : filtered.map(plan => (
          <Link href={`/dashboard/planes/${plan.id}`} key={plan.id} style={{ textDecoration: 'none' }}>
            <div className="hover-card" style={{ display: 'flex', backgroundColor: 'var(--color-tertiary)', border: '1px solid var(--glass-border)', borderRadius: '8px', overflow: 'hidden' }}>
              {/* Cover Image Block */}
              {plan.imageUrl ? (
                <div style={{ 
                  width: '140px', 
                  minWidth: '140px', 
                  backgroundImage: `url(${plan.imageUrl})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  borderRight: '1px solid var(--glass-border)'
                }} />
              ) : (
                <div style={{ 
                  width: '140px', 
                  minWidth: '140px', 
                  background: `linear-gradient(135deg, var(--color-secondary), var(--color-tertiary))`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-primary)',
                  fontWeight: 'bold',
                  fontSize: '1.5rem',
                  textTransform: 'uppercase',
                  borderRight: '1px solid var(--glass-border)'
                }}>
                  {plan.title.substring(0, 2)}
                </div>
              )}
              
              <div style={{ padding: '24px', flex: 1, backgroundColor: 'var(--glass-bg)' }}>
                <h4 style={{ color: '#4a90e2', fontSize: '1.2rem', marginBottom: '4px' }}>{plan.title}</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '12px', textTransform: 'uppercase', fontWeight: '500' }}>{plan.totalDays} Días</p>
                <p style={{ color: 'var(--color-text-main)', fontSize: '0.95rem', lineHeight: '1.5', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {plan.description || 'Este plan te ayudará a profundizar en tu relación con Dios a través de lecturas diarias.'}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
