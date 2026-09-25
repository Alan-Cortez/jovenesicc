'use client';

import { useState } from 'react';
import Link from 'next/link';
import { startPlanAction } from '@/app/actions/reading';
import { updateDevotionalAction } from '@/app/actions/diario';

export default function PlanDetailClient({ plan, days, progress, diarios }: { plan: any, days: any[], progress: any[], diarios?: any[] }) {
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  
  // Encontrar el primer día disponible o incompleto para seleccionarlo por defecto
  const firstAvailableIndex = days.findIndex(d => {
    const p = progress.find(pr => pr.planDayId === d.id);
    return !p || p.status === 'available';
  });
  
  const [selectedDayIndex, setSelectedDayIndex] = useState(firstAvailableIndex >= 0 ? firstAvailableIndex : 0);
  const hasStarted = progress.length > 0;
  
  // Estado para la edición
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    whatIRead: '',
    whatIUnderstood: '',
    whatGodToldMe: '',
    whatIPractice: ''
  });

  async function handleStartPlan() {
    setLoading(true);
    const result = await startPlanAction(plan.id);
    if (!result.error) {
      window.location.reload();
    }
    setLoading(false);
  }

  // Encontrar el diario correspondiente al día seleccionado
  const selectedDay = days[selectedDayIndex];
  const currentDiario = diarios?.find(d => d.dayNumber === selectedDay?.dayNumber);

  const startEdit = () => {
    if (currentDiario) {
      setEditForm({
        whatIRead: currentDiario.whatIRead || '',
        whatIUnderstood: currentDiario.whatIUnderstood || '',
        whatGodToldMe: currentDiario.whatGodToldMe || '',
        whatIPractice: currentDiario.whatIPractice || ''
      });
      setIsEditing(true);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentDiario) return;
    
    setUpdating(true);
    const res = await updateDevotionalAction(
      currentDiario.id, 
      editForm.whatIRead, 
      editForm.whatIUnderstood, 
      editForm.whatGodToldMe, 
      editForm.whatIPractice
    );
    
    if (res.success) {
      window.location.reload();
    } else {
      alert(res.error);
      setUpdating(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '80px' }}>
      
      {/* Cover Portada */}
      <div style={{ 
        position: 'relative', 
        height: '350px', 
        borderRadius: '16px', 
        overflow: 'hidden', 
        marginBottom: '24px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
      }}>
        {plan.imageUrl ? (
          <div style={{ 
            position: 'absolute', 
            inset: 0, 
            backgroundImage: `url(${plan.imageUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }} />
        ) : (
          <div style={{ 
            position: 'absolute', 
            inset: 0, 
            background: 'linear-gradient(135deg, #1f1c2c, #928DAB)',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }} />
        )}
        
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          padding: '32px'
        }}>
          <h1 style={{ 
            color: '#fff', 
            fontSize: '3.5rem', 
            fontWeight: '900', 
            lineHeight: '1.1',
            textTransform: 'uppercase',
            textShadow: '0 4px 20px rgba(0,0,0,0.5)'
          }}>
            {plan.title}
          </h1>
        </div>
      </div>

      {/* Start / Continue Button Bar */}
      <div style={{ display: 'flex', gap: '16px', alignItems: 'center', backgroundColor: 'var(--color-tertiary)', padding: '16px', borderRadius: '12px', marginBottom: '32px', border: '1px solid var(--glass-border)' }}>
        <div style={{ flex: 1 }}>
          <span style={{ fontSize: '1rem', fontWeight: 'bold', color: 'var(--color-text-main)' }}>{plan.totalDays} días</span>
        </div>
        
        {!hasStarted ? (
          <button 
            onClick={handleStartPlan} 
            disabled={loading}
            style={{ backgroundColor: '#ff4757', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '50px', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer', transition: 'transform 0.1s' }}
          >
            {loading ? 'Cargando...' : 'Comenzar este Plan ›'}
          </button>
        ) : (
          <Link href={`/dashboard/planes/${plan.id}/lectura/${days[selectedDayIndex]?.id}`} style={{ textDecoration: 'none' }}>
            <button 
              style={{ backgroundColor: 'var(--color-secondary)', color: 'var(--color-text-main)', border: '1px solid var(--glass-border)', padding: '12px 24px', borderRadius: '50px', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer', transition: 'transform 0.1s' }}
            >
              Continuar Lectura ›
            </button>
          </Link>
        )}
      </div>

      <p style={{ fontSize: '1.1rem', color: 'var(--color-text-muted)', lineHeight: '1.6', marginBottom: '40px' }}>
        {plan.description}
      </p>

      {/* Days Carousel & Checklist */}
      <div style={{ backgroundColor: 'var(--color-tertiary)', borderRadius: '16px', border: '1px solid var(--glass-border)', overflow: 'hidden' }}>
        
        {/* Horizontal Days Scroll */}
        <div style={{ display: 'flex', overflowX: 'auto', padding: '24px', gap: '16px', borderBottom: '1px solid var(--glass-border)', scrollbarWidth: 'none' }}>
          {days.map((day, index) => {
            const p = progress.find(pr => pr.planDayId === day.id);
            const status = p?.status || 'locked'; // 'completed', 'available', 'locked'
            const isSelected = selectedDayIndex === index;
            
            let circleColor = 'var(--glass-bg)';
            let textColor = 'var(--color-text-muted)';
            let borderStyle = 'none';
            
            if (isSelected) {
              // El día activo (seleccionado) siempre es rojo sólido
              circleColor = '#ff4757';
              textColor = '#fff';
            } else if (status === 'completed') {
              // Día completado pero NO seleccionado
              circleColor = 'var(--glass-bg)';
              textColor = '#4ae290'; // Palomita verde para días completados
              borderStyle = '1px solid #4ae290';
            } else if (status === 'available') {
              // Día disponible pero NO seleccionado
              circleColor = 'transparent';
              textColor = 'var(--color-text-main)';
              borderStyle = '1px solid var(--glass-border)';
            }

            return (
              <div 
                key={day.id} 
                onClick={() => {
                  setSelectedDayIndex(index);
                  setIsEditing(false); // Reset edit state when changing day
                }}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', opacity: status === 'locked' && !hasStarted ? 0.5 : 1 }}
              >
                <div style={{ 
                  width: '48px', 
                  height: '48px', 
                  borderRadius: '50%', 
                  backgroundColor: circleColor,
                  border: borderStyle,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: textColor,
                  fontWeight: 'bold',
                  fontSize: '1.1rem',
                  marginBottom: '8px',
                  transition: 'all 0.2s'
                }}>
                  {status === 'completed' && !isSelected ? '✓' : (index + 1)}
                </div>
                <span style={{ fontSize: '0.75rem', color: isSelected ? 'var(--color-text-main)' : 'var(--color-text-muted)', fontWeight: isSelected ? 'bold' : 'normal' }}>
                  Día {index + 1}
                </span>
              </div>
            );
          })}
        </div>

        {/* Checklist for Selected Day */}
        <div style={{ padding: '16px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid var(--glass-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: currentDiario ? '#4ae290' : 'var(--color-text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: currentDiario ? '#000' : 'var(--color-tertiary)', fontSize: '0.8rem' }}>✓</div>
              <span style={{ fontSize: '1.1rem', color: 'var(--color-text-main)' }}>Devocional</span>
            </div>
            {hasStarted && !currentDiario && (
              <Link href={`/dashboard/planes/${plan.id}/lectura/${selectedDay?.id}`} style={{ textDecoration: 'none' }}>
                <button style={{ backgroundColor: 'var(--color-text-main)', color: 'var(--color-tertiary)', border: 'none', padding: '6px 16px', borderRadius: '50px', fontWeight: 'bold', fontSize: '0.9rem', cursor: 'pointer' }}>
                  Iniciar Lectura ›
                </button>
              </Link>
            )}
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: currentDiario ? '#4ae290' : 'var(--color-text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: currentDiario ? '#000' : 'var(--color-tertiary)', fontSize: '0.8rem' }}>✓</div>
              <span style={{ fontSize: '1.1rem', color: 'var(--color-text-main)', textTransform: 'uppercase' }}>{selectedDay?.bibleRefs}</span>
            </div>
            <span style={{ color: 'var(--color-text-muted)' }}>›</span>
          </div>
        </div>
        
        {/* Respuestas del Día (Contextual) */}
        {currentDiario && (
          <div style={{ padding: '24px', borderTop: '1px solid var(--glass-border)', backgroundColor: 'var(--glass-bg)' }}>
            {!isEditing ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '1.2rem', color: '#4ae290', margin: 0 }}>Tus Respuestas</h3>
                  <button 
                    onClick={startEdit}
                    style={{ backgroundColor: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--color-text-main)', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}
                  >
                    Editar Reflexión
                  </button>
                </div>
                
                <div style={{ display: 'grid', gap: '20px' }}>
                  <div>
                    <h4 style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '1px' }}>¿Qué leí?</h4>
                    <p style={{ color: 'var(--color-text-main)', lineHeight: '1.6', margin: 0 }}>{currentDiario.whatIRead}</p>
                  </div>
                  <div>
                    <h4 style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '1px' }}>¿Qué entendí?</h4>
                    <p style={{ color: 'var(--color-text-main)', lineHeight: '1.6', margin: 0 }}>{currentDiario.whatIUnderstood}</p>
                  </div>
                  <div>
                    <h4 style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '1px' }}>¿Qué me dijo Dios?</h4>
                    <p style={{ color: 'var(--color-text-main)', lineHeight: '1.6', margin: 0 }}>{currentDiario.whatGodToldMe}</p>
                  </div>
                  <div>
                    <h4 style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '1px' }}>¿Cómo lo pongo en práctica?</h4>
                    <p style={{ color: 'var(--color-text-main)', lineHeight: '1.6', margin: 0 }}>{currentDiario.whatIPractice}</p>
                  </div>
                </div>
              </>
            ) : (
              <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <h3 style={{ fontSize: '1.2rem', color: '#ff4757', margin: 0 }}>Editando Reflexión</h3>
                  <button 
                    type="button"
                    onClick={() => setIsEditing(false)}
                    style={{ backgroundColor: 'transparent', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: '0.9rem' }}
                  >
                    Cancelar
                  </button>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>¿Qué leí?</label>
                  <textarea required className="input-field" rows={3} value={editForm.whatIRead} onChange={e => setEditForm({...editForm, whatIRead: e.target.value})}></textarea>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>¿Qué entendí?</label>
                  <textarea required className="input-field" rows={3} value={editForm.whatIUnderstood} onChange={e => setEditForm({...editForm, whatIUnderstood: e.target.value})}></textarea>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>¿Qué me dijo Dios?</label>
                  <textarea required className="input-field" rows={3} value={editForm.whatGodToldMe} onChange={e => setEditForm({...editForm, whatGodToldMe: e.target.value})}></textarea>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>¿Cómo lo pongo en práctica?</label>
                  <textarea required className="input-field" rows={3} value={editForm.whatIPractice} onChange={e => setEditForm({...editForm, whatIPractice: e.target.value})}></textarea>
                </div>
                
                <button type="submit" disabled={updating} style={{ backgroundColor: '#4ae290', color: '#000', border: 'none', padding: '16px', borderRadius: '8px', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer', marginTop: '8px' }}>
                  {updating ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </form>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
