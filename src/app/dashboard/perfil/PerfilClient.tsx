'use client';

import { useState } from 'react';
import PerfilSettingsForm from './SettingsForm';
import SocialFeed from '../SocialFeed';
import LevelAvatar from '@/components/gamification/LevelAvatar';
import styles from './perfil.module.css';

type UserData = {
  id: number;
  name: string;
  email: string;
  matricula: string;
  bio: string | null;
  role: string;
  avatar: string | null;
  groupId: number | null;
  groupName: string;
  xp: number;
  totalXp: number;
  level: number;
  levelName?: string;
  streakCurrent: number;
  streakBest: number;
  xpIntoCurrentLevel?: number;
  xpNeededForNext?: number;
  xpProgress: number;
  isMaxLevel?: boolean;
  joinedAt: string;
  shareDevotionals: number;
};

type FeedItem = {
  id: string;
  type: 'xp' | 'devotional' | 'prayer' | 'mission';
  title: string;
  subtitle: string;
  detail: string;
  date: string;
  xp?: number;
  status?: string;
};

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  lider: 'Lider',
  joven: 'Joven',
};

// Etiquetas de tipo de item del feed
const FEED_TYPE_LABEL: Record<FeedItem['type'], string> = {
  xp: 'Experiencia',
  devotional: 'Devocional',
  prayer: 'Oracion',
  mission: 'Mision',
};

export default function PerfilClient({
  user,
  currentTheme,
  feed,
  posts,
  earnedBadges = [],
  allBadges = [],
}: {
  user: UserData;
  currentTheme: string;
  feed: FeedItem[];
  posts?: any[];
  earnedBadges?: any[];
  allBadges?: any[];
}) {
  const [activeTab, setActiveTab] = useState<'inicio' | 'publicaciones'>('inicio');
  const [isEditing, setIsEditing] = useState(false);
  const [activeEditTab, setActiveEditTab] = useState<'perfil' | 'preferencias' | 'seguridad'>('perfil');
  const [showLevelInfo, setShowLevelInfo] = useState(false);

  const [feedFilter, setFeedFilter] = useState<FeedItem['type'] | 'all'>('all');

  const tabs = [
    { key: 'inicio', label: 'Actividad' },
    { key: 'publicaciones', label: 'Mis Publicaciones' },
  ] as const;

  const unlocked = earnedBadges || [];
  const filteredFeed =
    feedFilter === 'all' ? feed : feed.filter((f) => f.type === feedFilter);

  if (isEditing) {
    return (
      <div className={styles.root}>
        <div className={styles.twoCol} style={{ marginTop: '24px' }}>
          {/* Sidebar */}
          <div className={styles.aside}>
            <div className={styles.panel}>
              <h2 className={styles.panelTitle} style={{ fontSize: '1.4rem', marginBottom: '16px' }}>Configuración</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button 
                  onClick={() => setActiveEditTab('perfil')} 
                  style={{ textAlign: 'left', padding: '12px 16px', background: activeEditTab === 'perfil' ? 'rgba(255,255,255,0.1)' : 'transparent', border: 'none', borderRadius: '8px', color: 'var(--color-text-main)', cursor: 'pointer', fontWeight: activeEditTab === 'perfil' ? 'bold' : 'normal' }}
                >
                  Editar perfil
                </button>
                <button 
                  onClick={() => setActiveEditTab('preferencias')} 
                  style={{ textAlign: 'left', padding: '12px 16px', background: activeEditTab === 'preferencias' ? 'rgba(255,255,255,0.1)' : 'transparent', border: 'none', borderRadius: '8px', color: 'var(--color-text-main)', cursor: 'pointer', fontWeight: activeEditTab === 'preferencias' ? 'bold' : 'normal' }}
                >
                  Preferencias de la app
                </button>
                <button 
                  onClick={() => setActiveEditTab('seguridad')} 
                  style={{ textAlign: 'left', padding: '12px 16px', background: activeEditTab === 'seguridad' ? 'rgba(255,255,255,0.1)' : 'transparent', border: 'none', borderRadius: '8px', color: 'var(--color-text-main)', cursor: 'pointer', fontWeight: activeEditTab === 'seguridad' ? 'bold' : 'normal' }}
                >
                  Seguridad
                </button>
              </div>
              <hr style={{ border: 'none', borderTop: '1px solid var(--glass-border)', margin: '16px 0' }} />
              <button onClick={() => setIsEditing(false)} style={{ background: 'transparent', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px' }}>
                ← Volver al perfil
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className={styles.main}>
            {activeEditTab === 'perfil' && (
              <div className={styles.panel}>
                <h3 className={styles.panelTitle}>Editar perfil</h3>
                <PerfilSettingsForm
                  initialName={user.name}
                    initialBio={user.bio}
                  initialAvatar={user.avatar}
                  initialEmail={user.email}
                  initialPhone={(user as any).phone}
                  initialBirthDate={(user as any).birthDate}
                  currentTheme={currentTheme}
                />
              </div>
            )}
            {activeEditTab === 'preferencias' && (
              <div className={styles.panel}>
                <h3 className={styles.panelTitle}>Preferencias de la app</h3>
                <div className={styles.prefList}>
                  <PrefRow title="Notificaciones" desc="Recibir alertas de nuevos devocionales y misiones." defaultChecked />
                  <PrefRow title="XP público" desc="Hacer que mi XP sea visible en la tabla de líderes." defaultChecked />
                  <PrefRow title="Compartir devocionales" desc="Permitir que tus líderes vean tus devocionales." defaultChecked={!!user.shareDevotionals} />
                </div>
              </div>
            )}
            {activeEditTab === 'seguridad' && (
              <div className={styles.panel}>
                <h3 className={styles.panelTitle}>Seguridad</h3>
                <div className={styles.secList}>
                  <SecRow title="Contraseña establecida" desc="Tu cuenta está protegida con contraseña." ok />
                  <SecRow title="Perfil privado activo" desc="Solo miembros de la comunidad pueden verte." ok />
                  <SecRow
                    title={user.email ? 'Correo registrado' : 'Correo no registrado'}
                    desc={user.email || 'Agrega un correo en la pestaña Editar perfil.'}
                    ok={!!user.email}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.root}>

      {/* ── HEADER DE PERFIL ── */}
      <div className={styles.header}>
        <div className={styles.cover} />

        <div className={styles.headerBody}>
          <div className={styles.avatarWrap}>
            {user.avatar ? (
              <img src={user.avatar} alt="Avatar" className={styles.avatar} />
            ) : (
              <div className={styles.avatarFallback}>
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div className={styles.userInfo}>
            <h1 className={styles.userName}>{user.name}</h1>
            <p className={styles.userSub}>
              {user.bio || 'Sin descripción'}
            </p>
            <button onClick={() => setIsEditing(true)} className={styles.filterBtn} style={{ marginTop: '12px', background: 'var(--color-primary)', color: 'var(--color-tertiary)', border: 'none' }}>
              Editar Perfil
            </button>
          </div>

          <div className={styles.quickStats}>
            <div className={styles.qStat}>
              <span className={styles.qVal}>{user.level}</span>
              <span className={styles.qLbl}>Nivel</span>
            </div>
            <div className={styles.qDivider} />
            <div className={styles.qStat}>
              <span className={styles.qVal}>{user.totalXp.toLocaleString()}</span>
              <span className={styles.qLbl}>XP Total</span>
            </div>
            <div className={styles.qDivider} />
            <div className={styles.qStat}>
              <span className={styles.qVal}>{user.streakCurrent}</span>
              <span className={styles.qLbl}>Racha</span>
            </div>
            <div className={styles.qDivider} />
            <div className={styles.qStat}>
              <span className={styles.qVal}>{feed.length}</span>
              <span className={styles.qLbl}>Actividades</span>
            </div>
          </div>
        </div>

        <div className={styles.tabBar}>
          {tabs.map((t) => (
            <button
              key={t.key}
              className={`${styles.tab} ${activeTab === t.key ? styles.tabActive : ''}`}
              onClick={() => setActiveTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── CONTENIDO ── */}
      <div className={styles.content}>

        {/* ──── INICIO ──── */}
        {activeTab === 'inicio' && (
          <div className={styles.twoCol}>

            {/* Columna izquierda */}
            <div className={styles.aside}>

              {/* Acerca de */}
              <div className={styles.panel}>
                <h3 className={styles.panelTitle}>Acerca de mi</h3>
                <ul className={styles.infoList}>
                  <li>
                    <span className={styles.infoLabel}>Nombre</span>
                    <span className={styles.infoValue}>{user.name}</span>
                  </li>
                  
                  <li>
                    <span className={styles.infoLabel}>Grupo</span>
                    <span className={styles.infoValue}>{user.groupName}</span>
                  </li>
                  {user.email && (
                    <li>
                      <span className={styles.infoLabel}>Correo</span>
                      <span className={styles.infoValue}>{user.email}</span>
                    </li>
                  )}
                  
                  
                </ul>
              </div>

              {/* Progreso de nivel con Mascota */}
              <div className={styles.panel} style={{ padding: 0, overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.2s' }} onClick={() => setShowLevelInfo(true)} onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.02)'} onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}>
                <LevelAvatar level={user.level} levelName={user.levelName || 'Semilla'} />
                
                <div style={{ padding: '1.5rem' }}>
                  <div className={styles.xpHeader}>
                    <h3 className={styles.panelTitle} style={{ marginBottom: 0, fontSize: '0.9rem' }}>Progreso de XP</h3>
                    <span className={styles.levelPill} style={{ background: 'rgba(255,100,0,0.1)', color: '#ff9800' }}>
                      {user.streakCurrent || 0} 🔥 Racha
                    </span>
                  </div>
                  <p className={styles.xpSub} style={{ fontSize: '0.85rem' }}>
                    {user.isMaxLevel ? '¡Nivel Máximo!' : `${user.xpIntoCurrentLevel?.toLocaleString() || user.xp.toLocaleString()} / ${user.xpNeededForNext?.toLocaleString() || '100'} XP`}
                  </p>
                  <div className={styles.xpTrack}>
                    <div className={styles.xpFill} style={{ width: `${user.xpProgress}%`, background: 'linear-gradient(90deg, #ff9800, #ff5722)' }} />
                  </div>
                  <p className={styles.xpPct} style={{ fontSize: '0.75rem', marginTop: '4px' }}>
                    {user.isMaxLevel ? 'Has alcanzado la cima' : `${Math.round(user.xpProgress)}% hacia el nivel ${user.level + 1}`}
                  </p>
                </div>
              </div>

              <div className={styles.panel}>
                <h3 className={styles.panelTitle}>Logros ({unlocked.length})</h3>
                {unlocked.length === 0 ? (
                  <p className={styles.empty}>Completa actividades para desbloquear logros.</p>
                ) : (
                  <div className={styles.badgeMini}>
                    {unlocked.map((b) => (
                      <div key={b.label} className={styles.badgeMiniItem}>
                        <div className={styles.badgeDot} />
                        <span>{b.label}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ─── COLUMNA PRINCIPAL: FEED ─── */}
            <div className={styles.main}>

              {/* Filtros del feed */}
              <div className={styles.feedFilters}>
                {(['all', 'xp', 'devotional', 'prayer', 'mission'] as const).map((f) => (
                  <button
                    key={f}
                    className={`${styles.filterBtn} ${feedFilter === f ? styles.filterBtnActive : ''}`}
                    onClick={() => setFeedFilter(f)}
                  >
                    {f === 'all' ? 'Todo' : FEED_TYPE_LABEL[f]}
                  </button>
                ))}
              </div>

              {/* Items del feed */}
              {filteredFeed.length === 0 ? (
                <div className={styles.panel}>
                  <p className={styles.empty}>
                    {feedFilter === 'all'
                      ? 'No hay actividad registrada aun. Completa lecturas, misiones o escribe devocionales.'
                      : `No hay actividad de tipo "${FEED_TYPE_LABEL[feedFilter]}" registrada.`}
                  </p>
                </div>
              ) : (
                filteredFeed.map((item) => (
                  <FeedCard key={item.id} item={item} user={user} />
                ))
              )}
            </div>
          </div>
        )}

        {/* ──── MIS PUBLICACIONES ──── */}
        {activeTab === 'publicaciones' && (
          <div className={styles.singleCol}>
            <div className={styles.panel}>
              <h3 className={styles.panelTitle}>Mis Publicaciones</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '16px' }}>
                Aquí puedes ver todas tus publicaciones. Se muestran cronológicamente.
              </p>
              {posts ? (
                <SocialFeed 
                  posts={posts} 
                  currentUserId={user.id} 
                  currentUserAvatar={user.avatar}
                  currentUserName={user.name}
                />
              ) : (
                <p>Cargando publicaciones...</p>
              )}
            </div>
          </div>
        )}


      </div>
    </div>
  );
}

/* ── Feed Card ── */
function FeedCard({ item, user }: { item: FeedItem; user: UserData }) {
  // Tipo de borde lateral por tipo
  const borderClass: Record<FeedItem['type'], string> = {
    xp:         styles.feedBorderXp,
    devotional: styles.feedBorderDevotional,
    prayer:     styles.feedBorderPrayer,
    mission:    styles.feedBorderMission,
  };

  const typeLabel = FEED_TYPE_LABEL[item.type];

  return (
    <div className={`${styles.feedCard} ${borderClass[item.type]}`}>
      {/* Header de la tarjeta */}
      <div className={styles.feedCardHeader}>
        {/* Avatar pequeño del usuario */}
        <div className={styles.feedAvatar}>
          {user.avatar ? (
            <img src={user.avatar} alt="" className={styles.feedAvatarImg} />
          ) : (
            <div className={styles.feedAvatarFallback}>
              {user.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div className={styles.feedMeta}>
          <span className={styles.feedAuthor}>{user.name}</span>
          <div className={styles.feedMetaRow}>
            <span className={styles.feedType}>{typeLabel}</span>
            <span className={styles.feedDot}>·</span>
            <span className={styles.feedDate}>{formatDateRelative(item.date)}</span>
          </div>
        </div>
        {/* XP ganado (si aplica) */}
        {item.xp !== undefined && item.xp > 0 && (
          <span className={styles.feedXpBadge}>+{item.xp} XP</span>
        )}
      </div>

      {/* Cuerpo */}
      <div className={styles.feedBody}>
        <p className={styles.feedTitle}>{item.title}</p>
        {item.subtitle && (
          <p className={styles.feedSubtitle}>{item.subtitle}</p>
        )}
      </div>

      {/* Footer con estado */}
      <div className={styles.feedFooter}>
        <span className={`${styles.feedStatus} ${getStatusClass(item.status, styles)}`}>
          {item.detail}
        </span>
      </div>
    </div>
  );
}

function getStatusClass(status: string | undefined, styles: Record<string, string>): string {
  if (!status) return '';
  if (status === 'approved' || status === 'reviewed' || status === 'answered') return styles.statusOk;
  if (status === 'rejected') return styles.statusBad;
  return styles.statusNeutral;
}

/* ── Subcomponentes reutilizables ── */
function PrefRow({ title, desc, defaultChecked }: { title: string; desc: string; defaultChecked: boolean }) {
  return (
    <div className={styles.prefItem}>
      <div>
        <p className={styles.prefTitle}>{title}</p>
        <p className={styles.prefDesc}>{desc}</p>
      </div>
      <label className={styles.toggle}>
        <input type="checkbox" defaultChecked={defaultChecked} />
        <span className={styles.toggleSlider} />
      </label>
    </div>
  );
}

function SecRow({ title, desc, ok }: { title: string; desc: string; ok: boolean }) {
  return (
    <div className={styles.secItem}>
      <div className={`${styles.secIndicator} ${ok ? styles.secOk : styles.secWarn}`} />
      <div>
        <p className={styles.secTitle}>{title}</p>
        <p className={styles.secDesc}>{desc}</p>
      </div>
    </div>
  );
}

/* ── Utilidades de fecha ── */
function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'Recientemente';
    return d.toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch {
    return 'Recientemente';
  }
}

function formatDateRelative(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'Recientemente';
    const now = Date.now();
    const diff = now - d.getTime();
    const mins = Math.floor(diff / 60000);
    const hrs = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 1) return 'Ahora';
    if (mins < 60) return `Hace ${mins} min`;
    if (hrs < 24) return `Hace ${hrs} h`;
    if (days < 7) return `Hace ${days} dia${days !== 1 ? 's' : ''}`;
    return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
  } catch {
    return 'Recientemente';
  }
}
