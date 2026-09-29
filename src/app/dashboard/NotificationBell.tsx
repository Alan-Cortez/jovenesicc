'use client';

import { useState, useEffect, useRef } from 'react';
import { getNotificationsAction, markNotificationAsReadAction, markAllNotificationsAsReadAction } from '@/app/actions/notifications';
import { Bell, Heart, MessageSquare, Gift, Award, ShieldAlert, CheckCircle, Info, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './notification.module.css';

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
    <div className={styles.wrapper} ref={dropdownRef}>
      <button 
        className={styles.bellBtn}
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className={styles.badge}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          {/* Header */}
          <div className={styles.header}>
            <div className={styles.headerLeft}>
              <button className={styles.backBtn} onClick={() => setIsOpen(false)}>
                <ArrowLeft size={24} />
              </button>
              <h3 className={styles.title}>Notificaciones</h3>
            </div>
            {unreadCount > 0 && (
              <button onClick={handleMarkAll} className={styles.markReadBtn}>
                Marcar leídas
              </button>
            )}
          </div>

          {/* List */}
          <div className={styles.list}>
            {loading ? (
              <div className={styles.empty}>Cargando...</div>
            ) : notifications.length === 0 ? (
              <div className={styles.empty}>
                No tienes notificaciones
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {notifications.map((n) => (
                  <div 
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    className={`${styles.item} ${n.isRead === 0 ? styles.itemUnread : ''}`}
                    style={{ cursor: n.link ? 'pointer' : 'default' }}
                  >
                    {/* Actor / Icono */}
                    <div className={styles.avatarWrapper}>
                      {n.actor?.avatar ? (
                        <img 
                          src={n.actor.avatar} 
                          alt={n.actor.name} 
                          className={styles.avatar} 
                        />
                      ) : (
                        <div className={styles.avatarFallback}>
                          <span>{n.actor?.name ? n.actor.name.substring(0,2).toUpperCase() : 'JC'}</span>
                        </div>
                      )}
                      
                      <div className={styles.iconWrapper}>
                        {renderIcon(n.type)}
                      </div>
                    </div>

                    {/* Contenido */}
                    <div className={styles.content}>
                      <p className={styles.text}>{n.content}</p>
                      <span className={`${styles.time} ${n.isRead === 0 ? styles.timeUnread : styles.timeRead}`}>
                        {formatTime(n.createdAt)}
                      </span>
                    </div>

                    {/* Unread indicator */}
                    {n.isRead === 0 && <div className={styles.unreadDot} />}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className={styles.footer}>
            <span className={styles.footerText}>Jóvenes CON TODO</span>
          </div>
        </div>
      )}
    </div>
  );
}
