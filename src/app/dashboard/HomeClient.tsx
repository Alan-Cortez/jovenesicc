'use client';

import { useState } from 'react';
import Link from 'next/link';
import styles from './home.module.css';

type Announcement = {
  id: number;
  title: string;
  content: string;
  publishedAt: string;
  expiresAt: string | null;
};

type BannerData = {
  headline: string;
  subheading: string;
  photos: string[];
};

import SocialFeed from './SocialFeed';
import SongSuggestions from './SongSuggestions';

export default function DashboardHomeClient({
  userId,
  userName,
  userAvatar,
  userLevel,
  userXp,
  userStreak,
  banner,
  announcements,
  isAdmin,
  activePlan,
  activeMission,
  posts,
  songs,
}: {
  userId: number;
  userName: string;
  userAvatar: string | null;
  userLevel: number;
  userXp: number;
  userStreak: number;
  banner: BannerData;
  announcements: Announcement[];
  isAdmin: boolean;
  activePlan: any;
  activeMission: any;
  posts: any[];
  songs: any[];
}) {
  const [photoIndex, setPhotoIndex] = useState(0);

  const hasPhotos = banner.photos.length > 0;

  // Avanzar foto del collage manualmente (carrusel)
  function nextPhoto() {
    setPhotoIndex((i) => (i + 1) % banner.photos.length);
  }
  function prevPhoto() {
    setPhotoIndex((i) => (i - 1 + banner.photos.length) % banner.photos.length);
  }

  return (
    <div className={styles.root}>

      {/* ── BANNER PRINCIPAL ── */}
      <div className={styles.banner}>

        {/* Collage de fotos — hasta 4 en cuadricula, o carrusel si hay mas */}
        <div className={styles.bannerPhotos}>
          {!hasPhotos ? (
            /* Sin fotos: fondo degradado con patron */
            <div className={styles.bannerPhotoPlaceholder}>
              <div className={styles.placeholderPattern} />
            </div>
          ) : banner.photos.length === 1 ? (
            <img src={banner.photos[0]} alt="Banner" className={styles.bannerSingle} />
          ) : banner.photos.length <= 4 ? (
            /* Cuadricula de 2–4 fotos */
            <div className={`${styles.bannerGrid} ${styles[`grid${banner.photos.length}` as keyof typeof styles]}`}>
              {banner.photos.map((src, i) => (
                <img key={i} src={src} alt={`Foto ${i + 1}`} className={styles.bannerGridImg} />
              ))}
            </div>
          ) : (
            /* Mas de 4: carrusel */
            <div className={styles.bannerCarousel}>
              <img src={banner.photos[photoIndex]} alt="Banner" className={styles.bannerSingle} />
              <button className={`${styles.carouselBtn} ${styles.carouselPrev}`} onClick={prevPhoto}>&#8249;</button>
              <button className={`${styles.carouselBtn} ${styles.carouselNext}`} onClick={nextPhoto}>&#8250;</button>
              <div className={styles.carouselDots}>
                {banner.photos.map((_, i) => (
                  <button
                    key={i}
                    className={`${styles.dot} ${i === photoIndex ? styles.dotActive : ''}`}
                    onClick={() => setPhotoIndex(i)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Overlay con el texto de bienvenida encima del collage */}
          <div className={styles.bannerOverlay}>
            <div className={styles.bannerText}>
              <p className={styles.bannerSub}>{banner.subheading}</p>
              <h1 className={styles.bannerHeadline}>{banner.headline}</h1>
            </div>
            {/* Boton de edicion para admin */}
            {isAdmin && (
              <Link href="/dashboard/admin/banner" className={styles.editBannerBtn}>
                Editar banner
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* ── CUERPO ── */}
      <div className={styles.body}>

        {/* Saludo personal del usuario */}
        <div className={styles.greetCard}>
          <div className={styles.greetAvatar}>
            {userAvatar ? (
              <img src={userAvatar} alt="" className={styles.greetAvatarImg} />
            ) : (
              <div className={styles.greetAvatarFallback}>
                {userName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className={styles.greetText}>
            <h2 className={styles.greetName}>Hola, {userName}</h2>
            <p className={styles.greetDetail}>
              Nivel {userLevel} · {userXp} XP · Racha de {userStreak} {userStreak === 1 ? 'dia' : 'dias'}
            </p>
          </div>
          <Link href="/dashboard/perfil" className={styles.greetLink}>Ver mi perfil</Link>
        </div>

        <div className={styles.feedLayout}>
          
          {/* Columna Principal: Feed Social */}
          <div className={styles.col}>
            <SocialFeed 
              posts={posts} 
              currentUserId={userId} 
              currentUserAvatar={userAvatar}
              currentUserName={userName}
            />
          </div>

          {/* Columna Lateral: Spotify, Agenda, Anuncios */}
          <div className={styles.col}>
            
            <SongSuggestions songs={songs} currentUserId={userId} isAdmin={isAdmin} />

            <h2 className={styles.sectionTitle}>Agenda del Día</h2>
            
            {activePlan ? (
              <div className={`${styles.annoCard} ${styles.actionCard}`}>
                <div className={styles.annoBody}>
                  <p className={styles.annoTitle}>Plan de Lectura</p>
                  <p className={styles.annoContent}>Día {activePlan.dayNumber} · {activePlan.planTitle}</p>
                  <Link href={`/dashboard/planes/${activePlan.planId}/lectura/${activePlan.dayId}`} className={styles.actionBtn}>
                    Continuar Lectura
                  </Link>
                </div>
              </div>
            ) : (
              <div className={`${styles.annoCard} ${styles.actionCard}`}>
                <div className={styles.annoBody}>
                  <p className={styles.annoTitle}>Plan de Lectura</p>
                  <p className={styles.annoContent}>No tienes lecturas pendientes.</p>
                  <Link href="/dashboard/planes" className={styles.actionBtnSecondary}>
                    Explorar Planes
                  </Link>
                </div>
              </div>
            )}

            {activeMission ? (
              <div className={`${styles.annoCard} ${styles.actionCard}`}>
                <div className={styles.annoBody}>
                  <p className={styles.annoTitle}>Misión Pendiente</p>
                  <p className={styles.annoContent}>{activeMission.title}</p>
                  <Link href="/dashboard/misiones" className={styles.actionBtn}>
                    Completar Misión
                  </Link>
                </div>
              </div>
            ) : (
              <div className={`${styles.annoCard} ${styles.actionCard}`}>
                <div className={styles.annoBody}>
                  <p className={styles.annoTitle}>Misión Pendiente</p>
                  <p className={styles.annoContent}>No hay misiones pendientes.</p>
                </div>
              </div>
            )}

            <div className={`${styles.annoCard} ${styles.actionCard}`} style={{ marginBottom: '24px' }}>
              <div className={styles.annoBody}>
                <p className={styles.annoTitle}>Motivo de Oración</p>
                <p className={styles.annoContent}>Registra y comparte tus peticiones.</p>
                <Link href="/dashboard/oracion/nuevo" className={styles.actionBtnSecondary}>
                  Escribir Petición
                </Link>
              </div>
            </div>

            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Anuncios</h2>
              {isAdmin && (
                <Link href="/dashboard/admin/banner" className={styles.sectionAction}>
                  + Nuevo anuncio
                </Link>
              )}
            </div>

            {announcements.length === 0 ? (
              <div className={styles.emptyCard}>
                <p>No hay anuncios publicados por el momento.</p>
              </div>
            ) : (
              announcements.map((a) => (
                <AnnouncementCard key={a.id} announcement={a} />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Subcomponentes ── */

function AnnouncementCard({ announcement }: { announcement: Announcement }) {
  return (
    <div className={styles.annoCard}>
      <div className={styles.annoDot} />
      <div className={styles.annoBody}>
        <p className={styles.annoTitle}>{announcement.title}</p>
        <p className={styles.annoContent}>{announcement.content}</p>
        <p className={styles.annoDate}>{formatDate(announcement.publishedAt)}</p>
      </div>
    </div>
  );
}

function QuickLink({ href, label, desc }: { href: string; label: string; desc: string }) {
  return (
    <Link href={href} className={styles.quickLink}>
      <div>
        <p className={styles.quickLinkLabel}>{label}</p>
        <p className={styles.quickLinkDesc}>{desc}</p>
      </div>
      <span className={styles.quickLinkArrow}>&#8594;</span>
    </Link>
  );
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch {
    return '';
  }
}
