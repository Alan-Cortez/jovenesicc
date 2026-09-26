'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { logoutAction } from '@/app/actions/auth';
import styles from './sidebar.module.css';
import NotificationBell from './NotificationBell';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Inicio', exact: true },
  { href: '/dashboard/perfil', label: 'Mi Perfil' },
  { href: '/dashboard/planes', label: 'Planes de Lectura' },
  { href: '/dashboard/devocionales', label: 'Devocionales' },
  { href: '/dashboard/misiones', label: 'Misiones' },
  { href: '/dashboard/oracion', label: 'Diario de Oracion' },
  { href: '/dashboard/calendario', label: 'Calendario' },
  { href: '/dashboard/lideres', label: 'Tabla de Lideres' },
];

const ADMIN_ITEMS: { href: string; label: string; badge?: boolean }[] = [
  { href: '/dashboard/admin/usuarios', label: 'Usuarios' },
  { href: '/dashboard/admin/grupos', label: 'Gestionar Grupos' },
  { href: '/dashboard/admin/planes', label: 'Gestionar Planes' },
  { href: '/dashboard/admin/misiones', label: 'Gestionar Misiones' },
  { href: '/dashboard/admin/calendario', label: 'Gestionar Calendario' },
  { href: '/dashboard/admin/banner', label: 'Editar Inicio' },
];

export default function SidebarClient({
  userName,
  userRole,
  pendingCount,
}: {
  userName: string;
  userRole: string;
  pendingCount: number;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  }

  const isAdmin = userRole === 'admin' || userRole === 'lider';

  return (
    <>
      {/* Botón flotante para móviles */}
      <button 
        className={styles.mobileToggleBtn}
        onClick={() => setIsOpen(true)}
        aria-label="Abrir menú"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
      </button>

      {/* Overlay oscuro para cerrar menú en móvil */}
      {isOpen && (
        <div 
          className={styles.overlay} 
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ''}`}>
        {/* Logo y Notificaciones */}
        <div className={styles.brand}>
          <img src="/logo.png" alt="Jóvenes CON TODO" style={{ width: '80px', height: '80px', marginBottom: '12px', borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.1)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px' }}>
            <span className={styles.brandGreeting}>Hola, {userName.split(' ')[0]}</span>
            <NotificationBell />
          </div>
        </div>

        {/* Nav principal */}
        <nav className={styles.nav}>
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.link} ${isActive(item.href, item.exact) ? styles.linkActive : ''}`}
              onClick={() => setIsOpen(false)}
              prefetch
            >
              {item.label}
            </Link>
          ))}

          {/* Admin */}
          {isAdmin && (
            <>
              <div className={styles.section}>Administracion</div>
              {ADMIN_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`${styles.link} ${isActive(item.href) ? styles.linkActive : ''}`}
                  onClick={() => setIsOpen(false)}
                  prefetch
                >
                  <span>{item.label}</span>
                  {item.badge && pendingCount > 0 && (
                    <span className={styles.badge}>{pendingCount > 99 ? '99+' : pendingCount}</span>
                  )}
                </Link>
              ))}
            </>
          )}
        </nav>

        {/* Cerrar sesion */}
        <form action={logoutAction} className={styles.logoutForm}>
          <button type="submit" className={styles.logoutBtn}>
            Cerrar Sesion
          </button>
        </form>
      </aside>
    </>
  );
}
