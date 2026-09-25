'use client';

import { useState } from 'react';
import { addSongSuggestionAction, deleteSongSuggestionAction } from '@/app/actions/songs';

type Song = {
  id: number;
  trackId: string;
  userId: number;
  userName: string;
  userAvatar: string | null;
  createdAt: string;
};

export default function SongSuggestions({ songs, currentUserId, isAdmin }: { songs: Song[], currentUserId: number, isAdmin: boolean }) {
  const [url, setUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    setIsSubmitting(true);
    setError(null);
    
    const res = await addSongSuggestionAction(url);
    if (res.error) {
      setError(res.error);
    } else {
      setUrl('');
    }
    
    setIsSubmitting(false);
  };

  const handleDelete = async (id: number) => {
    if(confirm('¿Eliminar esta canción?')) {
      await deleteSongSuggestionAction(id);
    }
  };

  return (
    <div style={{ marginBottom: '32px' }}>
      <h2 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '12px' }}>
        Playlist Colaborativa
      </h2>

      {/* Agregar Canción Form */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <input 
          type="url" 
          placeholder="Pega el enlace de Spotify aquí..." 
          value={url}
          onChange={e => setUrl(e.target.value)}
          style={{ flex: 1, padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--glass-bg)', color: 'white', fontSize: '0.9rem', outline: 'none' }}
          disabled={isSubmitting}
        />
        <button 
          type="submit" 
          disabled={isSubmitting || !url.trim()}
          style={{ padding: '0 16px', borderRadius: '8px', background: 'var(--color-primary)', color: '#000', fontWeight: 'bold', border: 'none', cursor: isSubmitting || !url.trim() ? 'not-allowed' : 'pointer', opacity: isSubmitting || !url.trim() ? 0.6 : 1 }}
        >
          {isSubmitting ? '...' : 'Agregar'}
        </button>
      </form>

      {error && <p style={{ color: '#ff6b6b', fontSize: '0.8rem', marginTop: '-8px', marginBottom: '12px' }}>{error}</p>}

      {/* Lista de Canciones */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '500px', overflowY: 'auto' }}>
        {songs.length === 0 ? (
          <div style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '16px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
            Aún no hay canciones recomendadas. ¡Sé el primero!
          </div>
        ) : (
          songs.map(song => (
            <div key={song.id} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', margin: 0, display: 'flex', justifyContent: 'space-between' }}>
                <span>Sugerencia de <b>{song.userName}</b></span>
                {(song.userId === currentUserId || isAdmin) && (
                  <button onClick={() => handleDelete(song.id)} style={{ background: 'none', border: 'none', color: '#ff6b6b', cursor: 'pointer', fontSize: '0.75rem', padding: 0 }}>
                    Eliminar
                  </button>
                )}
              </p>
              <iframe 
                style={{ borderRadius: '12px', border: 0 }} 
                src={`https://open.spotify.com/embed/track/${song.trackId}?utm_source=generator&theme=0`}
                width="100%" 
                height="80" 
                allowFullScreen={false} 
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
                loading="lazy"
              ></iframe>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
