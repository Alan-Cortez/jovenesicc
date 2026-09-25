'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function AdminPlanRespuestasClient({ diarios, plan, days }: { diarios: any[], plan: any, days: any[] }) {
  const [selectedDay, setSelectedDay] = useState<number | 'all'>('all');
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  // Filtrar diarios por día seleccionado
  const filteredDiarios = selectedDay === 'all' 
    ? diarios 
    : diarios.filter(d => d.dayNumber === selectedDay);

  // Obtener lista única de usuarios en los diarios filtrados
  const uniqueUsersMap = new Map();
  filteredDiarios.forEach(d => {
    if (!uniqueUsersMap.has(d.userId)) {
      uniqueUsersMap.set(d.userId, { id: d.userId, name: d.userName, avatar: d.userAvatar });
    }
  });
  const uniqueUsers = Array.from(uniqueUsersMap.values());

  // Diarios del usuario seleccionado (dentro del día seleccionado)
  const userDiarios = selectedUserId 
    ? filteredDiarios.filter(d => d.userId === selectedUserId)
    : [];

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <Link href="/dashboard/admin/planes" style={{ color: 'var(--color-text-muted)', textDecoration: 'none', fontSize: '0.9rem' }}>
          ← Volver a Planes
        </Link>
        <h1 style={{ fontSize: '2rem', marginTop: '8px', marginBottom: '8px' }}>Respuestas: {plan.title}</h1>
        <p style={{ color: 'var(--color-text-muted)' }}>Selecciona un día y un joven para ver sus reflexiones.</p>
      </div>

      <div className="responsive-grid" style={{ gridTemplateColumns: '1fr 3fr' }}>
        
        {/* Panel Izquierdo: Filtros y Lista de Jóvenes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Selector de Día */}
          <div className="glass-panel" style={{ backgroundColor: 'var(--glass-bg)' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '12px' }}>Filtrar por Día</h3>
            <select 
              className="input-field" 
              value={selectedDay} 
              onChange={(e) => {
                setSelectedDay(e.target.value === 'all' ? 'all' : parseInt(e.target.value));
                setSelectedUserId(null); // Reset user selection when day changes
              }}
              style={{ backgroundColor: 'rgba(0,0,0,0.4)', color: 'var(--color-text-main)', padding: '12px', border: '1px solid var(--glass-border)', borderRadius: '8px' }}
            >
              <option value="all" style={{ backgroundColor: '#111', color: '#fff' }}>Todos los días</option>
              {days.map(day => (
                <option key={day.id} value={day.dayNumber} style={{ backgroundColor: '#111', color: '#fff' }}>Día {day.dayNumber} {day.title ? `- ${day.title}` : ''}</option>
              ))}
            </select>
          </div>

          {/* Lista de Jóvenes */}
          <div className="glass-panel" style={{ backgroundColor: 'var(--glass-bg)', flex: 1, minHeight: '400px' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '16px' }}>Jóvenes que respondieron ({uniqueUsers.length})</h3>
            
            {uniqueUsers.length === 0 ? (
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', textAlign: 'center', marginTop: '32px' }}>
                Nadie ha contestado aún para este filtro.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {uniqueUsers.map(u => (
                  <button 
                    key={u.id}
                    onClick={() => setSelectedUserId(u.id)}
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '12px', 
                      padding: '12px', 
                      borderRadius: '8px',
                      backgroundColor: selectedUserId === u.id ? 'rgba(74, 226, 144, 0.1)' : 'transparent',
                      border: selectedUserId === u.id ? '1px solid #4ae290' : '1px solid transparent',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#4ae290', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontWeight: 'bold', fontSize: '0.9rem' }}>
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                    <span style={{ color: selectedUserId === u.id ? '#4ae290' : 'var(--color-text-main)', fontWeight: selectedUserId === u.id ? 'bold' : 'normal' }}>
                      {u.name}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Panel Derecho: Respuestas del Joven */}
        <div className="glass-panel" style={{ backgroundColor: 'var(--color-tertiary)', border: '1px solid var(--glass-border)' }}>
          {!selectedUserId ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '400px', opacity: 0.6 }}>
              <span style={{ fontSize: '3rem', marginBottom: '16px' }}>📖</span>
              <h3 style={{ fontSize: '1.2rem', color: 'var(--color-text-muted)' }}>Selecciona un joven de la lista</h3>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Para leer sus reflexiones de este plan.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              {userDiarios.map(diario => {
                const date = new Date(diario.createdAt).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute:'2-digit' });
                return (
                  <div key={diario.id} style={{ paddingBottom: '32px', borderBottom: '1px solid var(--glass-border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                      <h3 style={{ fontSize: '1.4rem', color: '#4ae290', margin: 0 }}>Día {diario.dayNumber}</h3>
                      <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>{date}</span>
                    </div>

                    <div style={{ display: 'grid', gap: '24px' }}>
                      <div>
                        <h4 style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '1px' }}>¿Qué leí?</h4>
                        <p style={{ color: 'var(--color-text-main)', lineHeight: '1.6', margin: 0, fontSize: '1rem', backgroundColor: 'var(--glass-bg)', padding: '16px', borderRadius: '8px' }}>
                          {diario.whatIRead}
                        </p>
                      </div>
                      <div>
                        <h4 style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '1px' }}>¿Qué entendí?</h4>
                        <p style={{ color: 'var(--color-text-main)', lineHeight: '1.6', margin: 0, fontSize: '1rem', backgroundColor: 'var(--glass-bg)', padding: '16px', borderRadius: '8px' }}>
                          {diario.whatIUnderstood}
                        </p>
                      </div>
                      <div>
                        <h4 style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '1px' }}>¿Qué me dijo Dios?</h4>
                        <p style={{ color: 'var(--color-text-main)', lineHeight: '1.6', margin: 0, fontSize: '1rem', backgroundColor: 'var(--glass-bg)', padding: '16px', borderRadius: '8px' }}>
                          {diario.whatGodToldMe}
                        </p>
                      </div>
                      <div>
                        <h4 style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '1px' }}>¿Cómo lo pongo en práctica?</h4>
                        <p style={{ color: 'var(--color-text-main)', lineHeight: '1.6', margin: 0, fontSize: '1rem', backgroundColor: 'var(--glass-bg)', padding: '16px', borderRadius: '8px' }}>
                          {diario.whatIPractice}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
