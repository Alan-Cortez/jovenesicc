'use client';

import styles from './calendario.module.css';

type AppEvent = {
  id: number;
  title: string;
  description: string;
  location: string;
  startAt: string;
  endAt: string | null;
};

export default function CalendarioClient({ userId, events }: { userId: number; events: AppEvent[] }) {
  return (
    <div className={styles.root}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Calendario y Eventos</h1>
          <p className={styles.pageSub}>Proximas actividades y reuniones</p>
        </div>
      </div>

      {events.length === 0 ? (
        <div className={styles.emptyCard}>
          <p>No hay eventos proximos agendados.</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}

function EventCard({ event }: { event: AppEvent }) {
  return (
    <div className={styles.card}>
      <div className={styles.cardTop}>
        <div className={styles.cardInfo}>
          <h3 className={styles.cardTitle}>{event.title}</h3>
        </div>
        <div className={styles.dateBox}>
          <span className={styles.dateLabel}>FECHA</span>
          <span className={styles.dateValue}>{formatDateShort(event.startAt)}</span>
        </div>
      </div>
      
      {event.description && (
        <p className={styles.cardDesc}>{event.description}</p>
      )}
      
      <div className={styles.cardFooter}>
        <div className={styles.location}>
          <span className={styles.locationIcon}>📍</span>
          <span>{event.location || 'Ubicacion pendiente'}</span>
        </div>
        <button className={styles.actionBtn}>Asistire</button>
      </div>
    </div>
  );
}

function formatDateShort(str: string): string {
  try {
    const d = new Date(str);
    if (isNaN(d.getTime())) return str.split('T')[0];
    return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' });
  } catch {
    return str.split('T')[0];
  }
}
