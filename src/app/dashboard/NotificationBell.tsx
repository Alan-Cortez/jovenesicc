'use client';

import { useState, useEffect, useRef } from 'react';
import { getNotificationsAction, markNotificationAsReadAction, markAllNotificationsAsReadAction } from '@/app/actions/notifications';
import { Bell, Heart, MessageSquare, Gift, Award, ShieldAlert, CheckCircle, Info } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const fetchNotifs = async () => {
    const res = await getNotificationsAction();
    if (res.success && res.data) {
      setNotifications(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchNotifs();
    // Podríamos hacer polling cada X tiempo, o recargar al cambiar de ruta
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const unreadCount = notifications.filter(n => n.isRead === 0).length;

  const handleMarkAll = async () => {
    await markAllNotificationsAsReadAction();
    setNotifications(notifications.map(n => ({ ...n, isRead: 1 })));
  };

  const handleNotificationClick = async (n: any) => {
    if (n.isRead === 0) {
      await markNotificationAsReadAction(n.id);
      setNotifications(notifications.map(notif => notif.id === n.id ? { ...notif, isRead: 1 } : notif));
    }
    setIsOpen(false);
    if (n.link) {
      router.push(n.link);
    }
  };

  // Helper para renderizar el icono adecuado
  const renderIcon = (type: string) => {
    const iconProps = { size: 16, color: '#ffffff' };
    switch (type) {
      case 'like': return <div style={{ background: '#e0245e', padding: '6px', borderRadius: '50%' }}><Heart {...iconProps} /></div>;
      case 'comment': return <div style={{ background: '#1da1f2', padding: '6px', borderRadius: '50%' }}><MessageSquare {...iconProps} /></div>;
      case 'mission': return <div style={{ background: '#4ae290', padding: '6px', borderRadius: '50%' }}><Award {...iconProps} /></div>;
      case 'birthday': return <div style={{ background: '#f50057', padding: '6px', borderRadius: '50%' }}><Gift {...iconProps} /></div>;
      case 'warning': return <div style={{ background: '#ff9800', padding: '6px', borderRadius: '50%' }}><ShieldAlert {...iconProps} /></div>;
      case 'success': return <div style={{ background: '#4ae290', padding: '6px', borderRadius: '50%' }}><CheckCircle {...iconProps} /></div>;
      default: return <div style={{ background: 'var(--glass-border)', padding: '6px', borderRadius: '50%' }}><Info {...iconProps} /></div>;
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr.replace(' ', 'T') + 'Z');
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `Hace ${diffMins || 1} m`;
    if (diffHours < 24) return `Hace ${diffHours} h`;
    if (diffDays === 1) return `Ayer`;
    return `Hace ${diffDays} d`;
  };

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid var(--glass-border)',
          borderRadius: '50%',
          width: '40px',
          height: '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: 'var(--color-text-main)',
          position: 'relative'
        }}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '-2px',
            right: '-2px',
            background: '#e0245e',
            color: 'white',
            fontSize: '0.65rem',
            fontWeight: 'bold',
            borderRadius: '50%',
            width: '18px',
            height: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '50px',
          left: '0', // Por ahora lo alineamos a la izquierda, ideal para el sidebar
          width: '320px',
          background: 'var(--color-secondary)',
          border: '1px solid var(--glass-border)',
          borderRadius: '16px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
          zIndex: 1000,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '480px'
        }}>
          {/* Header */}
          <div style={{ padding: '16px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-text-main)' }}>Notificaciones</h3>
            {unreadCount > 0 && (
              <button 
                onClick={handleMarkAll}
                style={{ background: 'transparent', border: 'none', color: '#1da1f2', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
              >
                Marcar leídas
              </button>
            )}
          </div>

          {/* List */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loading ? (
              <div style={{ padding: '32px', textAlign: 'center', color: 'var(--color-text-muted)' }}>Cargando...</div>
            ) : notifications.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                No tienes notificaciones
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {notifications.map((n) => (
                  <div 
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    style={{
                      display: 'flex',
                      gap: '12px',
                      padding: '16px',
                      borderBottom: '1px solid rgba(255,255,255,0.05)',
                      background: n.isRead === 0 ? 'rgba(255,255,255,0.04)' : 'transparent',
                      cursor: n.link ? 'pointer' : 'default',
                      transition: 'background 0.2s',
                      position: 'relative'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = n.isRead === 0 ? 'rgba(255,255,255,0.04)' : 'transparent'}
                  >
                    {/* Actor / Icono */}
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      {n.actor?.avatar ? (
                        <img 
                          src={n.actor.avatar} 
                          alt={n.actor.name} 
                          style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }} 
                        />
                      ) : (
                        <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ fontWeight: 'bold' }}>{n.actor?.name ? n.actor.name.substring(0,2).toUpperCase() : 'JC'}</span>
                        </div>
                      )}
                      
                      <div style={{ position: 'absolute', bottom: '-4px', right: '-4px', border: '2px solid var(--color-secondary)', borderRadius: '50%' }}>
                        {renderIcon(n.type)}
                      </div>
                    </div>

                    {/* Contenido */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, paddingRight: '12px' }}>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-main)', lineHeight: 1.4 }}>
                        {n.content}
                      </p>
                      <span style={{ fontSize: '0.75rem', color: n.isRead === 0 ? '#1da1f2' : 'var(--color-text-muted)', fontWeight: n.isRead === 0 ? 600 : 400 }}>
                        {formatTime(n.createdAt)}
                      </span>
                    </div>

                    {/* Unread indicator */}
                    {n.isRead === 0 && (
                      <div style={{ width: '8px', height: '8px', background: '#1da1f2', borderRadius: '50%', position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div style={{ padding: '12px', textAlign: 'center', borderTop: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Jóvenes CON TODO</span>
          </div>
        </div>
      )}
    </div>
  );
}
