'use server';

import { db } from '@/lib/db';
import { songSuggestions } from '@/lib/schema';
import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { notifyMany } from './notifications';

async function verifyAuth() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session')?.value;
  if (!sessionToken) return null;
  try {
    return await decrypt(sessionToken);
  } catch {
    return null;
  }
}

export async function addSongSuggestionAction(url: string) {
  const user = await verifyAuth();
  if (!user) return { error: 'No autorizado' };

  if (!url) return { error: 'URL requerida' };

  // Intentar extraer el track_id
  const match = url.match(/track\/([a-zA-Z0-9]+)/);
  if (!match || !match[1]) {
    return { error: 'URL de Spotify no válida. Asegúrate de copiar el enlace de la canción (track).' };
  }

  const trackId = match[1];

  try {
    await db.insert(songSuggestions).values({
      userId: user.id,
      spotifyUrl: url,
      trackId,
    });
    
    // Notify everyone
    await notifyMany({
      title: 'Nueva Canción',
      type: 'like', // un icono de corazon o similar
      content: user.name + ' ha agregado una nueva canción a la lista.',
      assignedTo: 'all'
    });
    
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Error adding song:', error);
    return { error: 'Error al agregar la canción' };
  }
}

export async function deleteSongSuggestionAction(id: number) {
  const user = await verifyAuth();
  if (!user) return { error: 'No autorizado' };

  try {
    const song = await db.select().from(songSuggestions).where(eq(songSuggestions.id, id)).limit(1);
    if (!song[0] || (song[0].userId !== user.id && user.role !== 'admin')) {
      return { error: 'No tienes permiso' };
    }

    await db.delete(songSuggestions).where(eq(songSuggestions.id, id));
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    return { error: 'Error al eliminar' };
  }
}
