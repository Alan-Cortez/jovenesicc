'use client';

import { useState } from 'react';
import styles from './calendario.module.css';

type AppEvent = {
  id: number;
  title: string;
  description: string;
  startAt: string;
  endAt: string | null;
  category?: string;
};

export default function CalendarioClient({ userId, events }: { userId: number; events: AppEvent[] }) {
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  // Filtramos los eventos por mes y año actual
  const filteredEvents = events.filter(e => {
    const d = new Date(e.startAt.includes('T') ? e.startAt : e.startAt.replace(' ', 'T') + 'Z');
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(y => y + 1);
    } else {
      setCurrentMonth(m => m + 1);
    }
  };

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(y => y - 1);
    } else {
      setCurrentMonth(m => m - 1);
    }
  };

  return (
    <div className={styles.root}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div className={styles.titleSection}>
          <span className={styles.calendarIcon}>📅</span>
          <h1 className={styles.pageTitle}>Calendario de Eventos</h1>
        </div>

        <div className={styles.monthSelector}>
          <button onClick={prevMonth}>&lt;</button>
          <span className={styles.monthText}>{months[currentMonth]} {currentYear}</span>
          <button onClick={nextMonth}>&gt;</button>
        </div>
      </div>

      {filteredEvents.length === 0 ? (
        <div className={styles.emptyCard}>
          <p>No hay eventos agendados para {months[currentMonth]}.</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {filteredEvents.map((event) => {
            const dateObj = new Date(event.startAt.includes('T') ? event.startAt : event.startAt.replace(' ', 'T') + 'Z');
            const monthShort = months[dateObj.getMonth()].substring(0, 3);
            const dayNum = dateObj.getDate().toString().padStart(2, '0');
            
            const hasTime = event.startAt.includes(':');
            const timeStr = hasTime ? dateObj.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: true }) : '';

            return (
              <div key={event.id} className={styles.card}>
                
                <div className={styles.cardTop}>
                  <div className={styles.dateBox}>
                    <span className={styles.dateMonth}>{monthShort}</span>
                    <span className={styles.dateDay}>{dayNum}</span>
                  </div>
                  <div className={styles.categoryTag}>
                    {event.category || 'General'}
                  </div>
                </div>

                <div className={styles.cardBody}>
                  <h3 className={styles.eventTitle}>{event.title}</h3>
                  <p className={styles.eventSub}>
                    {timeStr ? timeStr : event.description || 'Para todos'}
                  </p>
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
