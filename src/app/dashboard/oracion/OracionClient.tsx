'use client';

import { useState } from 'react';
import { createPrayerRequestAction, markPrayerAnsweredAction } from '@/app/actions/features';
import styles from './oracion.module.css';

type PrayerRequest = {
  id: number;
  content: string;
  isAnonymous: number;
  isPublic: number;
  status: string;
  createdAt: string;
  answeredAt: string | null;
};

export default function OracionClient({
  userId,
  requests,
}: {
  userId: number;
  requests: PrayerRequest[];
}) {
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [filter, setFilter] = useState<'all' | 'praying' | 'answered'>('all');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    const fd = new FormData(e.currentTarget);
    const result = await createPrayerRequestAction(fd);
    setLoading(false);
    if (result.error) {
      setMsg({ type: 'err', text: result.error });
    } else {
      setMsg({ type: 'ok', text: 'Peticion registrada.' });
      setShowForm(false);
      (e.target as HTMLFormElement).reset();
    }
  }

  async function handleAnswered(id: number) {
    await markPrayerAnsweredAction(id);
  }

  const filtered = requests.filter((r) =>
    filter === 'all' ? true : r.status === filter
  );

  const praying = requests.filter((r) => r.status === 'praying').length;
  const answered = requests.filter((r) => r.status === 'answered').length;

  return (
    <div className={styles.root}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Diario de Oracion</h1>
          <p className={styles.pageSub}>Tus peticiones ante Dios — {praying} en oracion · {answered} respondidas</p>
        </div>
        <button
          className={styles.newBtn}
          onClick={() => { setShowForm((v) => !v); setMsg(null); }}
        >
          {showForm ? 'Cancelar' : 'Nueva peticion'}
        </button>
      </div>

      {/* Formulario nueva peticion */}
      {showForm && (
        <div className={styles.formCard}>
          <h2 className={styles.formTitle}>Nueva peticion de oracion</h2>
          {msg && (
            <div className={`${styles.alert} ${msg.type === 'ok' ? styles.alertOk : styles.alertErr}`}>
              {msg.text}
            </div>
          )}
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.field}>
              <label className={styles.label}>Tu peticion</label>
              <textarea
                name="content"
                className="input-field"
                rows={4}
                placeholder="Escribe tu peticion de oracion..."
                required
                style={{ resize: 'vertical', minHeight: '100px' }}
              />
            </div>
            <div className={styles.toggleRow}>
              <label className={styles.toggleLabel}>
                <input type="checkbox" name="isAnonymous" />
                <span>Publicar de forma anonima</span>
              </label>
              <label className={styles.toggleLabel}>
                <input type="checkbox" name="isPublic" />
                <span>Compartir con el grupo</span>
              </label>
            </div>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar peticion'}
            </button>
          </form>
        </div>
      )}

      {/* Filtros */}
      <div className={styles.filters}>
        {(['all', 'praying', 'answered'] as const).map((f) => (
          <button
            key={f}
            className={`${styles.filterBtn} ${filter === f ? styles.filterActive : ''}`}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? 'Todas' : f === 'praying' ? 'En oracion' : 'Respondidas'}
          </button>
        ))}
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <div className={styles.emptyCard}>
          <p>No tienes peticiones de oracion en esta categoria.</p>
          <button className={styles.newBtn} onClick={() => setShowForm(true)} style={{ marginTop: '12px' }}>
            Escribir primera peticion
          </button>
        </div>
      ) : (
        <div className={styles.list}>
          {filtered.map((r) => (
            <PrayerCard key={r.id} request={r} onMarkAnswered={handleAnswered} />
          ))}
        </div>
      )}
    </div>
  );
}

function PrayerCard({
  request,
  onMarkAnswered,
}: {
  request: PrayerRequest;
  onMarkAnswered: (id: number) => void;
}) {
  return (
    <div className={`${styles.card} ${request.status === 'answered' ? styles.cardAnswered : ''}`}>
      <div className={styles.cardBar} />
      <div className={styles.cardBody}>
        <div className={styles.cardHeader}>
          <span className={styles.cardDate}>{formatDate(request.createdAt)}</span>
          <span className={`${styles.cardStatus} ${request.status === 'answered' ? styles.statusOk : styles.statusPraying}`}>
            {request.status === 'answered' ? 'Respondida' : 'En oracion'}
          </span>
        </div>

        {request.isAnonymous ? (
          <p className={styles.cardContentMuted}>[Peticion anonima]</p>
        ) : (
          <p className={styles.cardContent}>{request.content}</p>
        )}

        <div className={styles.cardFooter}>
          <div className={styles.cardTags}>
            {request.isAnonymous ? <span className={styles.tag}>Anonima</span> : null}
            {request.isPublic ? <span className={styles.tag}>Compartida</span> : null}
          </div>
          {request.status === 'praying' && (
            <button
              className={styles.answeredBtn}
              onClick={() => onMarkAnswered(request.id)}
            >
              Marcar como respondida
            </button>
          )}
          {request.status === 'answered' && request.answeredAt && (
            <span className={styles.answeredDate}>
              Respondida el {formatDate(request.answeredAt)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function formatDate(str: string): string {
  try {
    const d = new Date(str);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch { return ''; }
}
