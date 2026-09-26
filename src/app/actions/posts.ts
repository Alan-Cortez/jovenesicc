'use server';

import { db } from '@/lib/db';
import { posts, postReactions, postComments, users } from '@/lib/schema';
import { eq, desc, sql, and } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { createNotification } from './notifications';

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

export async function createPostAction(data: { content: string; imageUrl?: string }) {
  const user = await verifyAuth();
  if (!user) return { error: 'No autorizado' };

  try {
    await db.insert(posts).values({
      userId: user.id,
      content: data.content,
      imageUrl: data.imageUrl || null,
    });
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Error creating post:', error);
    return { error: 'Error al crear la publicación' };
  }
}

export async function toggleLikeAction(postId: number) {
  const user = await verifyAuth();
  if (!user) return { error: 'No autorizado' };

  try {
    const existing = await db.select()
      .from(postReactions)
      .where(and(eq(postReactions.postId, postId), eq(postReactions.userId, user.id)))
      .limit(1);

    if (existing.length > 0) {
      await db.delete(postReactions).where(eq(postReactions.id, existing[0].id));
    } else {
      await db.insert(postReactions).values({
        postId,
        userId: user.id,
      });

      // Send notification to post owner
      const post = await db.select({ userId: posts.userId }).from(posts).where(eq(posts.id, postId)).limit(1);
      if (post.length > 0 && post[0].userId !== user.id) {
        await createNotification({
          userId: post[0].userId,
          actorId: user.id as number,
          type: 'like',
          content: `${user.name || 'Alguien'} reaccionó a tu publicación.`,
          link: '/dashboard'
        });
      }
    }
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    return { error: 'Error al reaccionar' };
  }
}

export async function addCommentAction(postId: number, content: string, parentId?: number) {
  const user = await verifyAuth();
  if (!user) return { error: 'No autorizado' };

  try {
    await db.insert(postComments).values({
      postId,
      userId: user.id,
      content,
      parentId: parentId || null,
    });

    // Send notification to post owner
    const post = await db.select({ userId: posts.userId }).from(posts).where(eq(posts.id, postId)).limit(1);
    if (post.length > 0 && post[0].userId !== user.id) {
      await createNotification({
        userId: post[0].userId,
        actorId: user.id as number,
        type: 'comment',
        content: `${user.name || 'Alguien'} comentó en tu publicación.`,
        link: '/dashboard'
      });
    }

    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    return { error: 'Error al comentar' };
  }
}

export async function toggleCommentLikeAction(commentId: number) {
  const user = await verifyAuth();
  if (!user) return { error: 'No autorizado' };

  try {
    const { commentReactions } = await import('@/lib/schema');
    const existing = await db.select()
      .from(commentReactions)
      .where(and(eq(commentReactions.commentId, commentId), eq(commentReactions.userId, user.id)))
      .limit(1);

    if (existing.length > 0) {
      await db.delete(commentReactions).where(eq(commentReactions.id, existing[0].id));
    } else {
      await db.insert(commentReactions).values({
        commentId,
        userId: user.id,
      });
    }
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    return { error: 'Error al reaccionar al comentario' };
  }
}

export async function deletePostAction(postId: number) {
  const user = await verifyAuth();
  if (!user) return { error: 'No autorizado' };

  try {
    const post = await db.select().from(posts).where(eq(posts.id, postId)).limit(1);
    if (!post[0] || (post[0].userId !== user.id && user.role !== 'admin')) {
      return { error: 'No tienes permiso' };
    }

    await db.delete(posts).where(eq(posts.id, postId));
    revalidatePath('/dashboard');
    revalidatePath('/dashboard/perfil');
    return { success: true };
  } catch (error) {
    return { error: 'Error al eliminar' };
  }
}
