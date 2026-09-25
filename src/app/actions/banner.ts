'use server';

import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth';
import { db } from '@/lib/db';
import { announcements } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function saveBannerAction(formData: FormData) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session')?.value;
  if (!sessionToken) return { error: 'No autenticado' };

  let admin;
  try {
    admin = await decrypt(sessionToken);
    if (admin.role !== 'admin' && admin.role !== 'lider') {
      return { error: 'No autorizado' };
    }
  } catch {
    return { error: 'No autenticado' };
  }

  const headline = (formData.get('headline') as string) || 'Bienvenidos';
  const subheading = (formData.get('subheading') as string) || 'Comunidad Jovenes';

  // Procesar hasta 5 fotos subidas
  const photos: string[] = [];
  for (let i = 0; i < 5; i++) {
    const file = formData.get(`photo_${i}`) as File | null;
    if (file && file.size > 0) {
      if (file.size > 8 * 1024 * 1024) {
        return { error: `La foto ${i + 1} supera el limite de 8MB` };
      }
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const base64 = `data:${file.type};base64,${buffer.toString('base64')}`;
      photos.push(base64);
    }
  }

  // Mantener fotos existentes si no se subieron nuevas
  const existing = await db
    .select()
    .from(announcements)
    .where(eq(announcements.title, '__banner__'))
    .limit(1);

  let finalPhotos = photos;
  if (photos.length === 0 && existing[0]) {
    try {
      const prev = JSON.parse(existing[0].content);
      finalPhotos = prev.photos || [];
    } catch {
      finalPhotos = [];
    }
  }

  // Fotos a eliminar (checkboxes marcados)
  if (photos.length === 0 && existing[0]) {
    try {
      const prev = JSON.parse(existing[0].content);
      const prevPhotos: string[] = prev.photos || [];
      const toRemove: number[] = [];
      for (let i = 0; i < prevPhotos.length; i++) {
        if (formData.get(`remove_${i}`) === 'on') {
          toRemove.push(i);
        }
      }
      finalPhotos = prevPhotos.filter((_, idx) => !toRemove.includes(idx));
    } catch {
      finalPhotos = [];
    }
  }

  const content = JSON.stringify({ headline, subheading, photos: finalPhotos });

  if (existing[0]) {
    await db
      .update(announcements)
      .set({ content, publishedAt: new Date().toISOString() })
      .where(eq(announcements.title, '__banner__'));
  } else {
    await db.insert(announcements).values({
      title: '__banner__',
      content,
      authorId: admin.id,
      isPinned: 1,
      publishedAt: new Date().toISOString(),
    });
  }

  revalidatePath('/dashboard');
  return { success: true };
}

export async function saveAnnouncementAction(formData: FormData) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session')?.value;
  if (!sessionToken) return { error: 'No autenticado' };

  let admin;
  try {
    admin = await decrypt(sessionToken);
    if (admin.role !== 'admin' && admin.role !== 'lider') {
      return { error: 'No autorizado' };
    }
  } catch {
    return { error: 'No autenticado' };
  }

  const title = formData.get('title') as string;
  const content = formData.get('content') as string;

  if (!title || !content) return { error: 'Titulo y contenido son obligatorios' };

  await db.insert(announcements).values({
    title,
    content,
    authorId: admin.id,
    isPinned: 1,
    publishedAt: new Date().toISOString(),
  });

  revalidatePath('/dashboard');
  return { success: true };
}

export async function deleteAnnouncementAction(id: number) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session')?.value;
  if (!sessionToken) return { error: 'No autenticado' };

  let admin;
  try {
    admin = await decrypt(sessionToken);
    if (admin.role !== 'admin' && admin.role !== 'lider') {
      return { error: 'No autorizado' };
    }
  } catch {
    return { error: 'No autenticado' };
  }

  await db.delete(announcements).where(eq(announcements.id, id));
  revalidatePath('/dashboard');
  return { success: true };
}
