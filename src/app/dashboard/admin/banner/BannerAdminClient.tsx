'use client';

import { useState } from 'react';
import { saveBannerAction, saveAnnouncementAction, deleteAnnouncementAction } from '@/app/actions/banner';
import styles from './banner.module.css';

type BannerData = { headline: string; subheading: string; photos: string[] };
type Announcement = { id: number; title: string; content: string; publishedAt: string };

export default function BannerAdminClient({
  currentBanner,
  announcements,
}: {
  currentBanner: BannerData;
  announcements: Announcement[];
}) {
  const [loading, setLoading] = useState(false);
  const [annoLoading, setAnnoLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [annoMsg, setAnnoMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [previews, setPreviews] = useState<string[]>([]);
  const [removeMask, setRemoveMask] = useState<boolean[]>(currentBanner.photos.map(() => false));

  // Preview de fotos seleccionadas
  function onFilesChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).slice(0, 5);
    const urls: string[] = [];
    let done = 0;
    if (files.length === 0) { setPreviews([]); return; }
    files.forEach((f) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        urls.push(ev.target!.result as string);
        done++;
        if (done === files.length) setPreviews([...urls]);
      };
      reader.readAsDataURL(f);
    });
  }

  async function handleBannerSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    const fd = new FormData(e.currentTarget);
    // Adjuntar archivos por nombre individual para la action
    const fileInput = e.currentTarget.querySelector<HTMLInputElement>('input[name="photos"]');
    if (fileInput?.files) {
      Array.from(fileInput.files).slice(0, 5).forEach((f, i) => {
        fd.set(`photo_${i}`, f);
      });
    }
    // Checkboxes de eliminacion
    removeMask.forEach((checked, i) => {
      if (checked) fd.set(`remove_${i}`, 'on');
    });
    const result = await saveBannerAction(fd);
    setLoading(false);
    if (result.error) {
      setMsg({ type: 'err', text: result.error });
    } else {
      setMsg({ type: 'ok', text: 'Banner actualizado correctamente.' });
      setPreviews([]);
    }
  }

  async function handleAnnouncementSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setAnnoLoading(true);
    setAnnoMsg(null);
    const fd = new FormData(e.currentTarget);
    const result = await saveAnnouncementAction(fd);
    setAnnoLoading(false);
    if (result.error) {
      setAnnoMsg({ type: 'err', text: result.error });
    } else {
      setAnnoMsg({ type: 'ok', text: 'Anuncio publicado.' });
      (e.target as HTMLFormElement).reset();
    }
  }

  async function handleDelete(id: number) {
    await deleteAnnouncementAction(id);
  }

  return (
    <div className={styles.root}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Editar Banner e Inicio</h1>
        <p className={styles.pageDesc}>
          Configura el banner de bienvenida, las fotos y los anuncios que ven todos los usuarios al ingresar.
        </p>
      </div>

      <div className={styles.grid}>

        {/* ── BANNER ── */}
        <div className={styles.panel}>
          <h2 className={styles.sectionTitle}>Banner de bienvenida</h2>

          {msg && (
            <div className={`${styles.alert} ${msg.type === 'ok' ? styles.alertOk : styles.alertErr}`}>
              {msg.text}
            </div>
          )}

          <form onSubmit={handleBannerSubmit} className={styles.form}>
            <div className={styles.field}>
              <label className={styles.label}>Titulo principal</label>
              <input
                type="text"
                name="headline"
                defaultValue={currentBanner.headline}
                className="input-field"
                placeholder="Ej: Bienvenidos"
                required
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Subtitulo</label>
              <input
                type="text"
                name="subheading"
                defaultValue={currentBanner.subheading}
                className="input-field"
                placeholder="Ej: Comunidad Jovenes"
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>
                Fotos del banner (maximo 5, hasta 8 MB cada una)
              </label>
              <input
                type="file"
                name="photos"
                accept="image/*"
                multiple
                onChange={onFilesChange}
                className="input-field"
              />
              <p className={styles.hint}>
                Si subes fotos nuevas, reemplazaran a las actuales. Si no subes, se conservan las existentes.
              </p>
            </div>

            {/* Preview de fotos nuevas */}
            {previews.length > 0 && (
              <div className={styles.photoPreviewGrid}>
                {previews.map((src, i) => (
                  <img key={i} src={src} alt={`Preview ${i + 1}`} className={styles.photoPreview} />
                ))}
              </div>
            )}

            {/* Fotos actuales con opcion de eliminar */}
            {currentBanner.photos.length > 0 && previews.length === 0 && (
              <div className={styles.currentPhotosSection}>
                <p className={styles.label}>Fotos actuales</p>
                <div className={styles.photoPreviewGrid}>
                  {currentBanner.photos.map((src, i) => (
                    <div key={i} className={styles.currentPhotoWrap}>
                      <img src={src} alt={`Foto ${i + 1}`} className={styles.photoPreview} />
                      <label className={styles.removeLabel}>
                        <input
                          type="checkbox"
                          checked={removeMask[i] ?? false}
                          onChange={(e) => {
                            const next = [...removeMask];
                            next[i] = e.target.checked;
                            setRemoveMask(next);
                          }}
                        />
                        <span>Eliminar</span>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '8px' }}>
              {loading ? 'Guardando...' : 'Guardar banner'}
            </button>
          </form>
        </div>

        {/* ── ANUNCIOS ── */}
        <div className={styles.panel}>
          <h2 className={styles.sectionTitle}>Publicar anuncio</h2>

          {annoMsg && (
            <div className={`${styles.alert} ${annoMsg.type === 'ok' ? styles.alertOk : styles.alertErr}`}>
              {annoMsg.text}
            </div>
          )}

          <form onSubmit={handleAnnouncementSubmit} className={styles.form}>
            <div className={styles.field}>
              <label className={styles.label}>Titulo del anuncio</label>
              <input type="text" name="title" className="input-field" placeholder="Ej: Reunion este sabado" required />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Contenido</label>
              <textarea
                name="content"
                className="input-field"
                rows={4}
                placeholder="Escribe el contenido del anuncio..."
                required
                style={{ resize: 'vertical', minHeight: '100px' }}
              />
            </div>
            <button type="submit" className="btn-primary" disabled={annoLoading}>
              {annoLoading ? 'Publicando...' : 'Publicar anuncio'}
            </button>
          </form>

          {/* Lista de anuncios existentes */}
          {announcements.length > 0 && (
            <div className={styles.annoList}>
              <p className={styles.label} style={{ marginBottom: '10px' }}>Anuncios publicados</p>
              {announcements.map((a) => (
                <div key={a.id} className={styles.annoItem}>
                  <div>
                    <p className={styles.annoTitle}>{a.title}</p>
                    <p className={styles.annoContent}>{a.content.slice(0, 80)}{a.content.length > 80 ? '...' : ''}</p>
                    <p className={styles.annoDate}>{formatDate(a.publishedAt)}</p>
                  </div>
                  <button
                    className={styles.deleteBtn}
                    onClick={() => handleDelete(a.id)}
                    type="button"
                  >
                    Eliminar
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch { return ''; }
}
