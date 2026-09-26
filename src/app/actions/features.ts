'use server';

import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth';
import { db } from '@/lib/db';
import { prayerRequests, taskSubmissions } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

// ─── Oracion ────────────────────────────────────────────

export async function createPrayerRequestAction(formData: FormData) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session')?.value;
  if (!sessionToken) return { error: 'No autenticado' };

  let user;
  try { user = await decrypt(sessionToken); } catch { return { error: 'No autenticado' }; }

  const content = formData.get('content') as string;
  const isAnonymous = formData.get('isAnonymous') === 'on' ? 1 : 0;
  const isPublic = formData.get('isPublic') === 'on' ? 1 : 0;

  if (!content?.trim()) return { error: 'Escribe el contenido de tu peticion.' };

  await db.insert(prayerRequests).values({
    userId: user.id,
    content: content.trim(),
    isAnonymous,
    isPublic,
    status: 'praying',
    createdAt: new Date().toISOString(),
  });

  revalidatePath('/dashboard/oracion');
  return { success: true };
}

export async function markPrayerAnsweredAction(id: number) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session')?.value;
  if (!sessionToken) return { error: 'No autenticado' };

  let user;
  try { user = await decrypt(sessionToken); } catch { return { error: 'No autenticado' }; }

  await db
    .update(prayerRequests)
    .set({ status: 'answered', answeredAt: new Date().toISOString() })
    .where(eq(prayerRequests.id, id));

  revalidatePath('/dashboard/oracion');
  return { success: true };
}

// ─── Misiones ────────────────────────────────────────────

export async function submitMissionEvidenceAction(formData: FormData) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session')?.value;
  if (!sessionToken) return { error: 'No autenticado' };

  let user;
  try { user = await decrypt(sessionToken); } catch { return { error: 'No autenticado' }; }

  const taskId = parseInt(formData.get('taskId') as string);
  const evidenceText = formData.get('evidenceText') as string;
  const evidenceFiles = formData.getAll('evidenceFile') as File[];

  if (isNaN(taskId)) return { error: 'Mision invalida.' };

  // Verificar si ya envio esta mision
  const existing = await db
    .select()
    .from(taskSubmissions)
    .where(eq(taskSubmissions.taskId, taskId))
    .limit(1);

  // Buscar si ya envio este usuario
  const userExisting = existing.find((s: any) => s.userId === user.id);
  if (userExisting && userExisting.status !== 'rejected') {
    return { error: 'Ya enviaste evidencia para esta mision.' };
  }

  let evidenceTextStr = evidenceText?.trim() || '';
  
  let fileBase64Array: string[] = [];
  for (const f of evidenceFiles) {
    if (f.size > 0) {
      if (f.size > 10 * 1024 * 1024) return { error: 'Cada archivo no puede superar 10MB.' };
      const bytes = await f.arrayBuffer();
      const buffer = Buffer.from(bytes);
      fileBase64Array.push(`data:${f.type};base64,${buffer.toString('base64')}`);
    }
  }

  let evidence = null;
  if (evidenceTextStr || fileBase64Array.length > 0) {
    evidence = JSON.stringify({ text: evidenceTextStr, files: fileBase64Array });
  }

  await db.insert(taskSubmissions).values({
    taskId,
    userId: user.id,
    evidence,
    status: 'submitted',
    submittedAt: new Date().toISOString(),
  });

  revalidatePath('/dashboard/misiones');
  return { success: true };
}
