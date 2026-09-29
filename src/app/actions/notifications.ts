'use server';

import { db } from '@/lib/db';
import { notifications, users } from '@/lib/schema';
import { eq, desc } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

async function getUser() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session')?.value;
  if (!sessionToken) return null;
  try {
    return await decrypt(sessionToken);
  } catch {
    return null;
  }
}

export async function getNotificationsAction() {
  const user = await getUser();
  if (!user) return { success: false, error: 'No autorizado' };

  try {
    const data = await db
      .select({
        id: notifications.id,
        type: notifications.type,
        content: notifications.content,
        title: notifications.title,
        link: notifications.link,
        isRead: notifications.isRead,
        createdAt: notifications.createdAt,
        actor: {
          name: users.name,
          avatar: users.avatar,
        }
      })
      .from(notifications)
      .leftJoin(users, eq(notifications.actorId, users.id))
      .where(eq(notifications.userId, user.id))
      .orderBy(desc(notifications.createdAt))
      .limit(30);

    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function markNotificationAsReadAction(id: number) {
  const user = await getUser();
  if (!user) return { success: false, error: 'No autorizado' };

  try {
    await db.update(notifications)
      .set({ isRead: 1 })
      .where(eq(notifications.id, id));
    
    // We don't revalidate globally here as this might be called on click
    // Client component can update its own state optimistically
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function markAllNotificationsAsReadAction() {
  const user = await getUser();
  if (!user) return { success: false, error: 'No autorizado' };

  try {
    await db.update(notifications)
      .set({ isRead: 1 })
      .where(eq(notifications.userId, user.id));
    
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// Utility to create a notification (Server Side internal use only)
export async function createNotification(data: {
  title?: string;
  userId: number;
  actorId?: number;
  type: string;
  content: string;
  link?: string;
}) {
  try {
    await db.insert(notifications).values({
      userId: data.userId,
      actorId: data.actorId,
      type: data.type,
      content: data.content,
      title: data.title || 'Sistema',
      link: data.link || null,
      isRead: 0
    });
  } catch (error) {
    console.error("Failed to create notification:", error);
  }
}

export async function notifyMany(data: {
  title?: string;
  type: string;
  content: string;
  link?: string;
  assignedTo: string;
  groupId?: number | null;
  userId?: number | null;
}) {
  try {
    let targetUsers: number[] = [];
    if (data.assignedTo === 'all') {
      const res = await db.select({ id: users.id }).from(users).where(eq(users.isActive, 1));
      targetUsers = res.map(r => r.id);
    } else if (data.assignedTo === 'group' && data.groupId) {
      const res = await db.select({ id: users.id }).from(users).where(eq(users.groupId, data.groupId));
      targetUsers = res.map(r => r.id);
    } else if (data.assignedTo === 'individual' && data.userId) {
      targetUsers = [data.userId];
    }

    if (targetUsers.length > 0) {
      // Create insert objects
      const values = targetUsers.map(uid => ({
        userId: uid,
        type: data.type,
        title: data.title || 'Sistema',
        content: data.content,
        link: data.link || null,
        isRead: 0
      }));
      await db.insert(notifications).values(values);
    }
  } catch (error) {
    console.error("Failed to batch create notifications:", error);
  }
}
