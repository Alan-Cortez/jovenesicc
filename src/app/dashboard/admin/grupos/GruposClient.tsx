'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  createGroupAction, 
  deleteGroupAction, 
  assignUserToGroupAction, 
  removeUserFromGroupAction,
  updateGroupAction
} from '@/app/actions/grupos';

type Member = { id: number; name: string; role: string; groupId: number | null };
type Group = { id: number; name: string; description: string | null; members: Member[]; totalScore?: number; lastEvaluated?: string | null; };

export default function GruposClient({ 
  groups, 
  unassigned, 
  sinGrupoId
}: { 
  groups: Group[]; 
  unassigned: Member[];
  sinGrupoId?: number | null;
}) {
  const [loading, setLoading] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<number | null>(groups[0]?.id ?? null);
  const [showAddUser, setShowAddUser] = useState(false);
  const [isEditingGroup, setIsEditingGroup] = useState(false);

  async function handleUpdateGroup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const result = await updateGroupAction(formData);
    
    if (result.success) {
      setIsEditingGroup(false);
      window.location.reload();
    } else {
      alert(result.error);
    }
    setLoading(false);
  }

  const currentGroup = groups.find(g => g.id === selectedGroup);

  async function handleCreateGroup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const result = await createGroupAction(formData);
    if (result.success) {
      window.location.reload();
    } else {
      alert(result.error);
    }
    setLoading(false);
  }

  async function handleDeleteGroup(groupId: number) {
    if (!confirm('¿Estás seguro de eliminar este grupo? Los miembros serán desasignados.')) return;
    setLoading(true);
    const fd = new FormData();
    fd.append('groupId', groupId.toString());
    const result = await deleteGroupAction(fd);
    if (result.success) {
      window.location.reload();
    } else {
      alert(result.error);
    }
    setLoading(false);
  }

  async function handleAssignUser(userId: number, groupId: number) {
    setLoading(true);
    const result = await assignUserToGroupAction(userId, groupId);
    if (result.success) {
      window.location.reload();
    } else {
      alert(result.error);
    }
    setLoading(false);
  }

  async function handleRemoveUser(userId: number) {
    setLoading(true);
    const result = await removeUserFromGroupAction(userId);
    if (result.success) {
      window.location.reload();
    } else {
      alert(result.error);
    }
    setLoading(false);
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '4px' }}>Gestión de Grupos</h1>
          <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>Organiza a los jóvenes en grupos. Cada persona solo puede pertenecer a un grupo.</p>
        </div>
      </div>

      <div className="responsive-grid" style={{ gridTemplateColumns: '280px 1fr' }}>
        
        {/* Panel Izquierdo: Lista de Grupos + Crear */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Lista de Grupos */}
          <div className="glass-panel" style={{ backgroundColor: 'var(--glass-bg)' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '16px' }}>Grupos ({groups.length})</h3>
            
            {groups.length === 0 ? (
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '16px 0' }}>
                No hay grupos creados.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {groups.map(g => (
                  <button
                    key={g.id}
                    onClick={() => { setSelectedGroup(g.id); setShowAddUser(false); }}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px',
                      borderRadius: '8px',
                      backgroundColor: selectedGroup === g.id ? 'rgba(74, 226, 144, 0.1)' : 'transparent',
                      border: selectedGroup === g.id ? '1px solid #4ae290' : '1px solid transparent',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.2s',
                      width: '100%',
                    }}
                  >
                    <span style={{ color: selectedGroup === g.id ? '#4ae290' : 'var(--color-text-main)', fontWeight: selectedGroup === g.id ? 'bold' : 'normal' }}>
                      {g.name}
                    </span>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {g.totalScore !== undefined && (
                        <span style={{ 
                          fontSize: '0.75rem', 
                          backgroundColor: 'var(--color-primary)', 
                          padding: '2px 6px', 
                          borderRadius: '6px',
                          color: 'var(--color-bg)',
                          fontWeight: 'bold'
                        }} title="Puntos Acumulados">
                          {g.totalScore} pts
                        </span>
                      )}
                      <span style={{ 
                        fontSize: '0.75rem', 
                        backgroundColor: 'var(--glass-bg)', 
                        padding: '2px 8px', 
                        borderRadius: '12px',
                        color: 'var(--color-text-muted)'
                      }} title="Miembros">
                        {g.members.length}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Crear Grupo */}
          <div className="glass-panel" style={{ backgroundColor: 'var(--color-tertiary)', border: '1px solid var(--glass-border)' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '16px' }}>Crear Grupo</h3>
            <form onSubmit={handleCreateGroup} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '6px' }}>Nombre *</label>
                <input type="text" name="name" className="input-field" placeholder="Ej. Grupo Alfa" required />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '6px' }}>Descripción</label>
                <input type="text" name="description" className="input-field" placeholder="Ej. Jóvenes de 15-18" />
              </div>
              <button type="submit" disabled={loading} className="btn-primary" style={{ padding: '10px', marginTop: '4px' }}>
                {loading ? 'Creando...' : 'CREAR GRUPO'}
              </button>
            </form>
          </div>

          {/* Sin Grupo */}
          <div className="glass-panel" style={{ backgroundColor: 'var(--glass-bg)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '1rem', margin: 0 }}>Sin Grupo ({unassigned.length})</h3>
              {sinGrupoId && unassigned.length > 0 && (
                <Link href={`/dashboard/admin/grupos/${sinGrupoId}/evaluar`} style={{ backgroundColor: '#4ae290', color: '#000', padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold', textDecoration: 'none' }}>
                  Evaluar
                </Link>
              )}
            </div>
            {unassigned.length === 0 ? (
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '8px 0' }}>Todos los usuarios están asignados.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '200px', overflowY: 'auto' }}>
                {unassigned.map(u => (
                  <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px', borderRadius: '6px', backgroundColor: 'var(--color-tertiary)' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--color-text-main)' }}>{u.name}</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>{u.role}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Panel Derecho: Detalle del Grupo */}
        <div className="glass-panel" style={{ backgroundColor: 'var(--color-tertiary)', border: '1px solid var(--glass-border)', minHeight: '500px' }}>
          {!currentGroup ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', opacity: 0.6, minHeight: '500px' }}>
              <span style={{ fontSize: '3rem', marginBottom: '16px' }}>👥</span>
              <h3 style={{ fontSize: '1.2rem', color: 'var(--color-text-muted)' }}>Selecciona o crea un grupo</h3>
            </div>
          ) : (
            <>
              {/* Header del grupo */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '24px' }}>
                <div style={{ flex: 1, marginRight: '16px' }}>
                  {isEditingGroup ? (
                    <form onSubmit={handleUpdateGroup} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <input type="hidden" name="groupId" value={currentGroup.id} />
                      <input 
                        type="text" 
                        name="name" 
                        defaultValue={currentGroup.name} 
                        className="input-field" 
                        required 
                        style={{ padding: '8px', fontSize: '1.1rem' }}
                      />
                      <input 
                        type="text" 
                        name="description" 
                        defaultValue={currentGroup.description || ''} 
                        className="input-field" 
                        placeholder="Descripción (opcional)"
                        style={{ padding: '8px', fontSize: '0.9rem' }}
                      />
                      <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                        <button type="submit" disabled={loading} style={{ backgroundColor: '#4ae290', color: '#000', border: 'none', padding: '6px 12px', borderRadius: '4px', fontWeight: 'bold', fontSize: '0.8rem', cursor: 'pointer' }}>
                          {loading ? 'Guardando...' : 'Guardar'}
                        </button>
                        <button type="button" onClick={() => setIsEditingGroup(false)} style={{ backgroundColor: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--color-text-muted)', padding: '6px 12px', borderRadius: '4px', fontSize: '0.8rem', cursor: 'pointer' }}>
                          Cancelar
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                        <h2 style={{ fontSize: '1.8rem', margin: 0 }}>{currentGroup.name}</h2>
                        <button 
                          onClick={() => setIsEditingGroup(true)}
                          style={{ backgroundColor: 'transparent', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: '0.85rem', textDecoration: 'underline' }}
                        >
                          Editar
                        </button>
                      </div>
                      {currentGroup.description && (
                        <p style={{ color: 'var(--color-text-muted)', margin: 0, fontSize: '0.9rem' }}>{currentGroup.description}</p>
                      )}
                      <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>{currentGroup.members.length} miembro{currentGroup.members.length !== 1 ? 's' : ''}</span>
                      {currentGroup.lastEvaluated && (
                        <span style={{ color: 'var(--color-primary)', fontSize: '0.8rem', marginLeft: '12px', fontWeight: 'bold' }}>
                          Última evaluación: {currentGroup.lastEvaluated}
                        </span>
                      )}
                    </>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Link 
                    href={`/dashboard/admin/grupos/${currentGroup.id}/evaluar`}
                    style={{ backgroundColor: 'var(--color-primary)', color: '#000', padding: '8px 16px', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.85rem', textDecoration: 'none', display: 'flex', alignItems: 'center' }}
                  >
                    Evaluar Reunión
                  </Link>
                  <button
                    onClick={() => setShowAddUser(!showAddUser)}
                    style={{ backgroundColor: '#4ae290', color: '#000', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.85rem', cursor: 'pointer' }}
                  >
                    + Agregar Integrante
                  </button>
                  <button
                    onClick={() => handleDeleteGroup(currentGroup.id)}
                    disabled={loading}
                    style={{ backgroundColor: 'transparent', border: '1px solid rgba(255, 71, 87, 0.5)', color: '#ff4757', padding: '8px 16px', borderRadius: '6px', fontSize: '0.85rem', cursor: 'pointer' }}
                  >
                    Eliminar Grupo
                  </button>
                </div>
              </div>

              {/* Selector para agregar miembro */}
              {showAddUser && (
                <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: 'var(--glass-bg)', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                  <h4 style={{ fontSize: '0.9rem', marginBottom: '12px', color: 'var(--color-text-muted)' }}>Selecciona un joven para agregar al grupo:</h4>
                  {unassigned.length === 0 ? (
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>No hay usuarios disponibles. Todos ya están asignados a un grupo.</p>
                  ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {unassigned.map(u => (
                        <button
                          key={u.id}
                          onClick={() => handleAssignUser(u.id, currentGroup.id)}
                          disabled={loading}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '8px 16px',
                            borderRadius: '20px',
                            backgroundColor: 'transparent',
                            border: '1px solid var(--glass-border)',
                            color: 'var(--color-text-main)',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            transition: 'all 0.2s'
                          }}
                        >
                          <span style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#4ae290', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontWeight: 'bold', fontSize: '0.7rem' }}>
                            {u.name.charAt(0).toUpperCase()}
                          </span>
                          {u.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Lista de Miembros */}
              {currentGroup.members.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 0', opacity: 0.6 }}>
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '1rem' }}>Este grupo aún no tiene integrantes.</p>
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Usa el botón de arriba para agregar jóvenes.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '8px' }}>
                  {currentGroup.members.map(member => (
                    <div key={member.id} style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      padding: '16px', 
                      backgroundColor: 'var(--glass-bg)', 
                      borderRadius: '8px',
                      border: '1px solid var(--glass-border)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ 
                          width: '36px', height: '36px', borderRadius: '50%', 
                          backgroundColor: '#4ae290', display: 'flex', alignItems: 'center', 
                          justifyContent: 'center', color: '#000', fontWeight: 'bold', fontSize: '0.9rem' 
                        }}>
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span style={{ color: 'var(--color-text-main)', fontWeight: 'bold', display: 'block' }}>{member.name}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>{member.role}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveUser(member.id)}
                        disabled={loading}
                        style={{ backgroundColor: 'transparent', border: '1px solid rgba(255, 71, 87, 0.3)', color: '#ff4757', padding: '4px 12px', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer' }}
                      >
                        Remover
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
