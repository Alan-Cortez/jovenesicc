'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { logoutAction } from '@/app/actions/auth';
import styles from './sidebar.module.css';

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
  const pathname = usePathname();

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  }

  const isAdmin = userRole === 'admin' || userRole === 'lider';

  return (
    <aside className={styles.sidebar}>
      {/* Logo */}
      <div className={styles.brand}>
        <img src="/logo.png" alt="Jóvenes CON TODO" style={{ width: '80px', height: '80px', marginBottom: '12px', borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.1)' }} />
        <span className={styles.brandGreeting}>Hola, {userName}</span>
      </div>

      {/* Nav principal */}
      <nav className={styles.nav}>
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`${styles.link} ${isActive(item.href, item.exact) ? styles.linkActive : ''}`}
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
  );
}
