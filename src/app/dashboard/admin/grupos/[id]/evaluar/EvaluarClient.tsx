'use client';

import { useState } from 'react';
import Link from 'next/link';
import { evaluateGroupAction, deleteMeetingAction } from '@/app/actions/grupos';
import { useRouter } from 'next/navigation';

type Member = { id: number; name: string; avatar: string | null };
type Group = { id: number; name: string };

type MemberEvaluation = {
  userId: number;
  tematica: number;
  puntualidad: number;
  bibliaCuaderno: number;
};

type ExistingGuest = { id: number; name: string; invitedBy: number | null; visitsCount: number };
type PastMeeting = { id: number; date: string; totalPoints: number };
type PastAttendance = { meetingId: number; userId: number; tematica: number; puntualidad: number; bibliaCuaderno: number };

export default function EvaluarClient({ 
  group, 
  members, 
  existingGuests = [],
  pastMeetings = [],
  pastAttendances = []
}: { 
  group: Group, 
  members: Member[], 
  existingGuests?: ExistingGuest[],
  pastMeetings?: PastMeeting[],
  pastAttendances?: PastAttendance[]
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [editingMeetingId, setEditingMeetingId] = useState<number | null>(null);
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  
  // Guest States
  const [guestAttendance, setGuestAttendance] = useState<Record<number, boolean>>({});
  const [newGuests, setNewGuests] = useState<Record<number, string[]>>({});

  const [evaluations, setEvaluations] = useState<Record<number, MemberEvaluation>>(() => {
    const initial: Record<number, MemberEvaluation> = {};
    members.forEach(m => {
      initial[m.id] = { userId: m.id, tematica: 0, puntualidad: 0, bibliaCuaderno: 0 };
    });
    return initial;
  });

  const loadMeeting = (mId: number) => {
    setEditingMeetingId(mId);
    const meeting = pastMeetings.find(m => m.id === mId);
    if (meeting) setDate(meeting.date);

    const att = pastAttendances.filter(a => a.meetingId === mId);
    const initial: Record<number, MemberEvaluation> = {};
    members.forEach(m => {
      const found = att.find(a => a.userId === m.id);
      initial[m.id] = {
        userId: m.id,
        tematica: found ? found.tematica : 0,
        puntualidad: found ? found.puntualidad : 0,
        bibliaCuaderno: found ? found.bibliaCuaderno : 0,
      };
    });
    setEvaluations(initial);
    setGuestAttendance({});
    setNewGuests({});
    setSuccess('Reunión cargada para editar.');
    setError(null);
  };

  const resetToNew = () => {
    setEditingMeetingId(null);
    setDate(new Date().toISOString().split('T')[0]);
    const initial: Record<number, MemberEvaluation> = {};
    members.forEach(m => {
      initial[m.id] = { userId: m.id, tematica: 0, puntualidad: 0, bibliaCuaderno: 0 };
    });
    setEvaluations(initial);
    setGuestAttendance({});
    setNewGuests({});
    setSuccess(null);
    setError(null);
  };

  const handleDelete = async (mId: number) => {
    if (confirm('¿Seguro que deseas eliminar esta evaluación? Esto restará los puntos otorgados.')) {
      const formData = new FormData();
      formData.append('meetingId', mId.toString());
      await deleteMeetingAction(formData);
      if (editingMeetingId === mId) resetToNew();
    }
  };

  const updateEval = (userId: number, field: keyof MemberEvaluation, value: number) => {
    setEvaluations(prev => ({
      ...prev,
      [userId]: { ...prev[userId], [field]: value }
    }));
  };

  const toggleExistingGuest = (guestId: number) => {
    setGuestAttendance(prev => ({ ...prev, [guestId]: !prev[guestId] }));
  };

  const addNewGuest = (userId: number) => {
    const name = prompt('Nombre del nuevo invitado:');
    if (name && name.trim()) {
      setNewGuests(prev => ({
        ...prev,
        [userId]: [...(prev[userId] || []), name.trim()]
      }));
    }
  };

  const removeNewGuest = (userId: number, index: number) => {
    setNewGuests(prev => {
      const updated = [...(prev[userId] || [])];
      updated.splice(index, 1);
      return { ...prev, [userId]: updated };
    });
  };

  const getExemptUserIds = () => {
    const previousMeetings = pastMeetings
      .filter(m => m.date < date && m.id !== editingMeetingId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 3);

    if (previousMeetings.length < 3) return [];

    const exemptIds: number[] = [];
    members.forEach(m => {
      let consecutiveAbsences = 0;
      for (const meeting of previousMeetings) {
        const attendance = pastAttendances.find(a => a.meetingId === meeting.id && a.userId === m.id);
        if (!attendance || attendance.puntualidad === 0) {
          consecutiveAbsences++;
        } else {
          break;
        }
      }
      if (consecutiveAbsences === 3) {
        exemptIds.push(m.id);
      }
    });

    return exemptIds;
  };

  const calculateTotal = () => {
    let total = 0;
    
    Object.entries(guestAttendance).forEach(([gId, attended]) => {
      if (attended) {
        const g = existingGuests.find(x => x.id === parseInt(gId, 10));
        if (g) {
          total += (g.visitsCount + 1) >= 5 ? 10 : 3;
        }
      }
    });

    Object.values(newGuests).forEach(names => {
      total += names.length * 3;
    });

    const exemptUserIds = getExemptUserIds();
    const evals = Object.values(evaluations);
    const activeEvals = evals.filter(e => !exemptUserIds.includes(e.userId));

    if (evals.length > 0) {
      const hasAbsences = activeEvals.some(e => e.puntualidad === 0);
      const allPerfectPunctuality = activeEvals.length > 0 && activeEvals.every(e => e.puntualidad === 5);
      
      if (!hasAbsences) total += 5;
      if (!hasAbsences && allPerfectPunctuality) total += 5;
      
      evals.forEach(e => {
        total += e.tematica + e.puntualidad + e.bibliaCuaderno;
      });
    }
    return total;
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    const attendedGuestIds = Object.entries(guestAttendance)
      .filter(([_, attended]) => attended)
      .map(([id]) => parseInt(id, 10));

    const newGuestsArray: { invitedBy: number, name: string }[] = [];
    Object.entries(newGuests).forEach(([userId, names]) => {
      names.forEach(name => {
        newGuestsArray.push({ invitedBy: parseInt(userId, 10), name });
      });
    });

    const result = await evaluateGroupAction({
      groupId: group.id,
      meetingId: editingMeetingId || undefined,
      date,
      newGuests: newGuestsArray,
      attendedGuestIds,
      evaluations: Object.values(evaluations),
      exemptUserIds: getExemptUserIds(),
    });

    if (result.error) {
      setError(result.error);
    } else {
      setSuccess(`Evaluación guardada exitosamente. (${result.totalPoints} pts)`);
      if (!editingMeetingId) {
        resetToNew();
      }
      setTimeout(() => {
        router.push('/dashboard/admin/grupos');
      }, 1500);
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: '40px 24px', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <Link href="/dashboard/admin/grupos" style={{ color: '#a0aab2', textDecoration: 'none', fontSize: '0.9rem' }}>
          ← Volver a Grupos
        </Link>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '32px' }}>
        <div>
          <h2 style={{ fontSize: '2rem', margin: 0 }}>Evaluar Reunión</h2>
          <p style={{ color: 'var(--color-primary)', fontSize: '1.1rem', margin: '8px 0 0 0', fontWeight: 'bold' }}>Grupo: {group.name}</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '0.85rem', color: '#a0aab2' }}>Fecha de la reunión</label>
          <input 
            type="date" 
            value={date}
            onChange={e => setDate(e.target.value)}
            className="input-field"
            style={{ width: 'auto' }}
          />
        </div>
      </div>

      <div className="glass-panel" style={{ backgroundColor: 'var(--glass-bg)', padding: '24px', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', color: 'var(--color-text-main)' }}>Historial de Evaluaciones</h3>
        {pastMeetings.length === 0 ? (
          <p style={{ fontSize: '0.85rem', color: '#666' }}>No hay reuniones evaluadas todavía.</p>
        ) : (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {pastMeetings.map(m => (
              <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: editingMeetingId === m.id ? 'rgba(74, 226, 144, 0.2)' : 'rgba(0,0,0,0.3)', padding: '6px 12px', borderRadius: '8px', border: editingMeetingId === m.id ? '1px solid #4ae290' : '1px solid transparent' }}>
                <button onClick={() => loadMeeting(m.id)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '0.85rem' }}>
                  {m.date} ({m.totalPoints} pts)
                </button>
                <button onClick={() => handleDelete(m.id)} style={{ background: 'none', border: 'none', color: '#ff6b6b', cursor: 'pointer', fontWeight: 'bold', marginLeft: '8px' }} title="Eliminar evaluación">×</button>
              </div>
            ))}
            {editingMeetingId && (
              <button onClick={resetToNew} style={{ background: '#333', border: 'none', color: '#fff', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>
                + Nueva Evaluación
              </button>
            )}
          </div>
        )}
      </div>

      <div className="glass-panel" style={{ backgroundColor: 'var(--glass-bg)' }}>
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '16px' }}>{editingMeetingId ? 'Editando Evaluación' : 'Asistencia y Puntos'}</h3>
          {members.length === 0 ? (
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Este grupo no tiene integrantes aún.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {members.map(member => {
                const memberGuests = existingGuests.filter(g => g.invitedBy === member.id);
                const memberNewGuests = newGuests[member.id] || [];

                return (
                  <div key={member.id} style={{ padding: '16px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#333', overflow: 'hidden', flexShrink: 0 }}>
                        {member.avatar ? (
                          <img src={member.avatar} alt={member.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', color: '#666', fontWeight: 'bold' }}>
                            {member.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <span style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{member.name}</span>
                      {getExemptUserIds().includes(member.id) && (
                        <span style={{ fontSize: '0.7rem', backgroundColor: 'rgba(255, 107, 107, 0.2)', color: '#ff6b6b', padding: '2px 6px', borderRadius: '4px', marginLeft: '8px' }}>
                          Inactivo (No afecta bono)
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: '150px' }}>
                        <label style={{ display: 'block', fontSize: '0.75rem', color: '#a0aab2', marginBottom: '6px' }}>Temática / Prenda</label>
                        <select 
                          className="input-field" 
                          value={evaluations[member.id].tematica}
                          onChange={(e) => updateEval(member.id, 'tematica', parseInt(e.target.value))}
                          style={{ padding: '6px', fontSize: '0.85rem', backgroundColor: '#111', color: '#fff' }}
                        >
                          <option value={0} style={{ backgroundColor: '#111', color: '#fff' }}>No (0 pts)</option>
                          <option value={5} style={{ backgroundColor: '#111', color: '#fff' }}>Sí (5 pts)</option>
                        </select>
                      </div>

                      <div style={{ flex: 1, minWidth: '150px' }}>
                        <label style={{ display: 'block', fontSize: '0.75rem', color: '#a0aab2', marginBottom: '6px' }}>Puntualidad</label>
                        <select 
                          className="input-field" 
                          value={evaluations[member.id].puntualidad}
                          onChange={(e) => updateEval(member.id, 'puntualidad', parseInt(e.target.value))}
                          style={{ padding: '6px', fontSize: '0.85rem', backgroundColor: '#111', color: '#fff' }}
                        >
                          <option value={0} style={{ backgroundColor: '#111', color: '#fff' }}>Falta (0 pts)</option>
                          <option value={3} style={{ backgroundColor: '#111', color: '#fff' }}>Retardo (3 pts)</option>
                          <option value={5} style={{ backgroundColor: '#111', color: '#fff' }}>Bien/Temprano (5 pts)</option>
                        </select>
                      </div>

                      <div style={{ flex: 1, minWidth: '150px' }}>
                        <label style={{ display: 'block', fontSize: '0.75rem', color: '#a0aab2', marginBottom: '6px' }}>Biblia y Cuaderno</label>
                        <select 
                          className="input-field" 
                          value={evaluations[member.id].bibliaCuaderno}
                          onChange={(e) => updateEval(member.id, 'bibliaCuaderno', parseInt(e.target.value))}
                          style={{ padding: '6px', fontSize: '0.85rem', backgroundColor: '#111', color: '#fff' }}
                        >
                          <option value={0} style={{ backgroundColor: '#111', color: '#fff' }}>Ninguno (0 pts)</option>
                          <option value={3} style={{ backgroundColor: '#111', color: '#fff' }}>Una cosa (3 pts)</option>
                          <option value={5} style={{ backgroundColor: '#111', color: '#fff' }}>Ambos (5 pts)</option>
                        </select>
                      </div>
                    </div>

                    <div style={{ borderTop: '1px dashed rgba(255,255,255,0.1)', paddingTop: '16px', marginTop: '4px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <h4 style={{ fontSize: '0.9rem', margin: 0, color: 'var(--color-text-main)' }}>Invitados de {member.name}</h4>
                        <button 
                          onClick={() => addNewGuest(member.id)}
                          style={{ backgroundColor: 'transparent', border: '1px solid #4ae290', color: '#4ae290', padding: '4px 12px', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer' }}
                        >
                          + Nuevo Invitado
                        </button>
                      </div>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {memberGuests.map(g => (
                          <div key={g.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '6px' }}>
                            <div>
                              <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>{g.name}</span>
                              <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginLeft: '8px' }}>Visita #{g.visitsCount + (guestAttendance[g.id] ? 1 : 0)} {g.visitsCount + (guestAttendance[g.id] ? 1 : 0) >= 5 ? '(10 pts)' : '(3 pts)'}</span>
                            </div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.8rem' }}>
                              <span>Asistencia:</span>
                              <input 
                                type="checkbox" 
                                checked={!!guestAttendance[g.id]}
                                onChange={() => toggleExistingGuest(g.id)}
                                style={{ width: '16px', height: '16px', accentColor: '#4ae290' }}
                              />
                            </label>
                          </div>
                        ))}
                        
                        {memberNewGuests.map((ngName, index) => (
                          <div key={`new-${index}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', backgroundColor: 'rgba(74, 226, 144, 0.1)', borderRadius: '6px', border: '1px solid rgba(74, 226, 144, 0.3)' }}>
                            <div>
                              <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#4ae290' }}>{ngName} (Nuevo)</span>
                              <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginLeft: '8px' }}>Visita #1 (3 pts)</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <span style={{ fontSize: '0.8rem', color: '#4ae290' }}>✓ Asistió</span>
                              <button onClick={() => removeNewGuest(member.id, index)} style={{ background: 'none', border: 'none', color: '#ff6b6b', cursor: 'pointer', fontSize: '1rem' }}>×</button>
                            </div>
                          </div>
                        ))}

                        {memberGuests.length === 0 && memberNewGuests.length === 0 && (
                          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontStyle: 'italic', margin: 0 }}>Ningún invitado registrado aún.</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <p style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Total Estimado: <span style={{ color: 'var(--color-primary)' }}>{calculateTotal()} pts</span></p>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
              Incluye bonos grupales por asistencia/puntualidad perfecta si aplican.
            </p>
          </div>
          
          <button 
            onClick={handleSubmit} 
            className="btn-primary"
            disabled={loading || members.length === 0}
            style={{ minWidth: '200px' }}
          >
            {loading ? 'GUARDANDO...' : (editingMeetingId ? 'ACTUALIZAR EVALUACIÓN' : 'GUARDAR EVALUACIÓN')}
          </button>
        </div>

        {error && (
          <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(255,107,107,0.1)', color: '#ff6b6b', borderRadius: '6px' }}>
            {error}
          </div>
        )}
        {success && (
          <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(74,226,144,0.1)', color: '#4ae290', borderRadius: '6px' }}>
            {success}
          </div>
        )}
      </div>
    </div>
  );
}
