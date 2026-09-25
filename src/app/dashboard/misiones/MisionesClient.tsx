'use client';

import { useState } from 'react';
import { submitMissionEvidenceAction } from '@/app/actions/features';
import styles from './misiones.module.css';

type Task = {
  id: number;
  title: string;
  description: string;
  xpReward: number;
  evidenceType: string;
  deadline: string | null;
  submission: { status: string; submittedAt: string } | null;
};

const STATUS_LABEL: Record<string, string> = {
  submitted: 'Enviada — pendiente de revision',
  approved: 'Aprobada',
  rejected: 'Rechazada — puedes reenviar',
  pending: 'Pendiente',
};

export default function MisionesClient({ userId, tasks }: { userId: number; tasks: Task[] }) {
  const [openTaskId, setOpenTaskId] = useState<number | null>(null);

  const pending = tasks.filter((t) => !t.submission || t.submission.status === 'rejected');
  const done = tasks.filter((t) => t.submission && t.submission.status !== 'rejected');

  return (
    <div className={styles.root}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Misiones</h1>
          <p className={styles.pageSub}>
            {pending.length} pendiente{pending.length !== 1 ? 's' : ''} · {done.length} completada{done.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className={styles.emptyCard}>
          <p>No tienes misiones asignadas por el momento.</p>
        </div>
      ) : (
        <>
          {/* Misiones pendientes */}
          {pending.length > 0 && (
            <section>
              <h2 className={styles.sectionTitle}>Pendientes</h2>
              <div className={styles.grid}>
                {pending.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    isOpen={openTaskId === task.id}
                    onToggle={() => setOpenTaskId(openTaskId === task.id ? null : task.id)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Misiones completadas */}
          {done.length > 0 && (
            <section>
              <h2 className={styles.sectionTitle}>Completadas</h2>
              <div className={styles.grid}>
                {done.map((task) => (
                  <TaskCard key={task.id} task={task} isOpen={false} onToggle={() => {}} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function TaskCard({
  task,
  isOpen,
  onToggle,
}: {
  task: Task;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const isCompleted = task.submission && task.submission.status !== 'rejected';
  const isRejected = task.submission?.status === 'rejected';

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    const fd = new FormData(e.currentTarget);
    fd.set('taskId', task.id.toString());
    const result = await submitMissionEvidenceAction(fd);
    setLoading(false);
    if (result.error) {
      setMsg({ type: 'err', text: result.error });
    } else {
      setMsg({ type: 'ok', text: 'Evidencia enviada correctamente. Tu lider la revisara.' });
    }
  }

  return (
    <div className={`${styles.card} ${isCompleted ? styles.cardDone : ''} ${isRejected ? styles.cardRejected : ''}`}>
      <div className={styles.cardTop}>
        <div className={styles.cardInfo}>
          <h3 className={styles.cardTitle}>{task.title}</h3>
          {task.description && (
            <p className={styles.cardDesc}>{task.description}</p>
          )}
        </div>
        <div className={styles.cardMeta}>
          <span className={styles.xpBadge}>+{task.xpReward} XP</span>
          {task.deadline && (
            <span className={styles.deadline}>hasta {formatDate(task.deadline)}</span>
          )}
        </div>
      </div>

      {/* Estado si ya envio */}
      {task.submission && (
        <div className={`${styles.statusBadge} ${getStatusClass(task.submission.status, styles)}`}>
          {STATUS_LABEL[task.submission.status] ?? task.submission.status}
        </div>
      )}

      {/* Boton de subir evidencia */}
      {(!task.submission || isRejected) && (
        <>
          <button
            className={styles.evidenceBtn}
            onClick={onToggle}
          >
            {isOpen ? 'Cancelar' : task.evidenceType === 'none' ? 'Marcar como completada' : 'Subir evidencia'}
          </button>

          {isOpen && (
            <form onSubmit={handleSubmit} className={styles.evidenceForm}>
              {msg && (
                <div className={`${styles.alert} ${msg.type === 'ok' ? styles.alertOk : styles.alertErr}`}>
                  {msg.text}
                </div>
              )}

              {task.evidenceType === 'text' && (
                <textarea
                  name="evidenceText"
                  className="input-field"
                  rows={3}
                  placeholder="Describe como completaste esta mision..."
                  required
                  style={{ resize: 'vertical' }}
                />
              )}

              {(task.evidenceType === 'media' || task.evidenceType === 'file') && (
                <input
                  type="file"
                  name="evidenceFile"
                  className="input-field"
                  accept={task.evidenceType === 'media' ? 'image/*,video/*' : '*'}
                  required
                />
              )}

              {task.evidenceType === 'none' && (
                <p className={styles.evidenceNote}>Esta mision no requiere evidencia. Al enviar se marcara como completada.</p>
              )}

              <button type="submit" className={styles.submitBtn} disabled={loading}>
                {loading ? 'Enviando...' : 'Enviar'}
              </button>
            </form>
          )}
        </>
      )}
    </div>
  );
}

function getStatusClass(status: string, styles: Record<string, string>): string {
  if (status === 'approved') return styles.statusOk;
  if (status === 'rejected') return styles.statusBad;
  return styles.statusNeutral;
}

function formatDate(str: string): string {
  try {
    const d = new Date(str);
    if (isNaN(d.getTime())) return str;
    return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
  } catch { return str; }
}
