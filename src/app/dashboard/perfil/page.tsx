import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth';
import { db } from '@/lib/db';
import { users, groups, xpLog, devotionals, prayerRequests, taskSubmissions, tasks } from '@/lib/schema';
import { eq, desc } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import PerfilClient from './PerfilClient';

export default async function PerfilPage() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session')?.value;
  const currentTheme = cookieStore.get('theme')?.value || 'dark';

  if (!sessionToken) redirect('/login');

  let sessionUser;
  try {
    sessionUser = await decrypt(sessionToken);
  } catch {
    redirect('/login');
  }

  const userResult = await db.select().from(users).where(eq(users.id, sessionUser.id)).limit(1);
  const user = userResult[0];
  if (!user) redirect('/login');

  // Nombre del grupo
  let groupName = 'Sin grupo';
  if (user.groupId) {
    const groupResult = await db.select().from(groups).where(eq(groups.id, user.groupId)).limit(1);
    if (groupResult[0]) groupName = groupResult[0].name;
  }

  // XP y Nivel (Gamification Engine)
  const { getLevelInfo } = await import('@/lib/gamification');
  const levelInfo = getLevelInfo(user.xp); // Nota: user.xp ahora es el totalXp
  
  // Obtener logros reales
  const { userBadges, badges } = await import('@/lib/schema');
  const earnedBadges = await db.select({
    id: badges.id,
    name: badges.name,
    description: badges.description,
    icon: badges.icon,
    color: badges.color,
    grantedAt: userBadges.grantedAt
  })
  .from(userBadges)
  .innerJoin(badges, eq(userBadges.badgeId, badges.id))
  .where(eq(userBadges.userId, user.id));

  // ── FEED: actividad del usuario ──
  // 1. Log de XP (lecturas completadas, misiones, devocionales, insignias)
  const xpEntries = await db
    .select()
    .from(xpLog)
    .where(eq(xpLog.userId, user.id))
    .orderBy(desc(xpLog.createdAt))
    .limit(15);

  // 2. Devocionales enviados
  const devotionalEntries = await db
    .select()
    .from(devotionals)
    .where(eq(devotionals.userId, user.id))
    .orderBy(desc(devotionals.createdAt))
    .limit(5);

  // 3. Peticiones de oración del usuario
  const prayerEntries = await db
    .select()
    .from(prayerRequests)
    .where(eq(prayerRequests.userId, user.id))
    .orderBy(desc(prayerRequests.createdAt))
    .limit(5);

  // 4. Misiones enviadas con su título
  const missionEntries = await db
    .select({
      id: taskSubmissions.id,
      taskId: taskSubmissions.taskId,
      status: taskSubmissions.status,
      submittedAt: taskSubmissions.submittedAt,
      taskTitle: tasks.title,
      xpReward: tasks.xpReward,
    })
    .from(taskSubmissions)
    .innerJoin(tasks, eq(taskSubmissions.taskId, tasks.id))
    .where(eq(taskSubmissions.userId, user.id))
    .orderBy(desc(taskSubmissions.submittedAt))
    .limit(5);

  // Construir feed unificado y ordenado por fecha
  type FeedItem = {
    id: string;
    type: 'xp' | 'devotional' | 'prayer' | 'mission';
    title: string;
    subtitle: string;
    detail: string;
    date: string;
    xp?: number;
    status?: string;
  };

  const feedItems: FeedItem[] = [];

  for (const e of xpEntries) {
    const typeLabels: Record<string, string> = {
      reading: 'Lectura completada',
      devotional: 'Devocional enviado',
      task: 'Mision completada',
      badge: 'Insignia obtenida',
      manual: 'XP otorgado',
      reversal: 'Ajuste de XP',
    };
    feedItems.push({
      id: `xp-${e.id}`,
      type: 'xp',
      title: typeLabels[e.sourceType] ?? 'Actividad',
      subtitle: e.reason,
      detail: `+${e.amount} XP`,
      date: e.createdAt,
      xp: e.amount,
    });
  }

  for (const d of devotionalEntries) {
    const statusLabels: Record<string, string> = {
      draft: 'Borrador',
      submitted: 'Enviado',
      reviewed: 'Revisado',
    };
    feedItems.push({
      id: `dev-${d.id}`,
      type: 'devotional',
      title: 'Devocional escrito',
      subtitle: d.whatIRead.slice(0, 120) + (d.whatIRead.length > 120 ? '...' : ''),
      detail: statusLabels[d.status] ?? d.status,
      date: d.createdAt,
      status: d.status,
    });
  }

  for (const p of prayerEntries) {
    feedItems.push({
      id: `pray-${p.id}`,
      type: 'prayer',
      title: p.isAnonymous ? 'Peticion de oracion (anonima)' : 'Peticion de oracion',
      subtitle: p.isAnonymous ? '' : p.content.slice(0, 120) + (p.content.length > 120 ? '...' : ''),
      detail: p.status === 'answered' ? 'Respondida' : 'En oracion',
      date: p.createdAt,
      status: p.status,
    });
  }

  for (const m of missionEntries) {
    const statusLabels: Record<string, string> = {
      pending: 'Pendiente de revision',
      submitted: 'Enviada',
      approved: 'Aprobada',
      rejected: 'Rechazada',
    };
    feedItems.push({
      id: `mission-${m.id}`,
      type: 'mission',
      title: 'Mision entregada',
      subtitle: m.taskTitle,
      detail: statusLabels[m.status] ?? m.status,
      date: m.submittedAt,
      xp: m.xpReward,
      status: m.status,
    });
  }

  // Ordenar por fecha descendente
  feedItems.sort((a, b) => {
    const da = new Date(a.date).getTime();
    const db2 = new Date(b.date).getTime();
    return isNaN(db2) || isNaN(da) ? 0 : db2 - da;
  });

  // Traer Publicaciones del usuario
  const { posts, postReactions, postComments } = await import('@/lib/schema');
  
  const userPosts = await db.select({
    id: posts.id,
    content: posts.content,
    imageUrl: posts.imageUrl,
    createdAt: posts.createdAt,
    userId: users.id,
    userName: users.name,
    userAvatar: users.avatar,
  })
  .from(posts)
  .innerJoin(users, eq(posts.userId, users.id))
  .where(eq(posts.userId, user.id))
  .orderBy(desc(posts.createdAt));

  const postIds = userPosts.map(p => p.id);
  
  let allReactions: any[] = [];
  let allComments: any[] = [];
  let allCommentReactions: any[] = [];
  
  if (postIds.length > 0) {
    const { inArray } = await import('drizzle-orm');
    const { commentReactions } = await import('@/lib/schema');
    allReactions = await db.select().from(postReactions).where(inArray(postReactions.postId, postIds));
    allComments = await db.select({
      id: postComments.id,
      postId: postComments.postId,
      content: postComments.content,
      parentId: postComments.parentId,
      createdAt: postComments.createdAt,
      userId: users.id,
      userName: users.name,
      userAvatar: users.avatar
    })
    .from(postComments)
    .innerJoin(users, eq(postComments.userId, users.id))
    .where(inArray(postComments.postId, postIds))
    .orderBy(postComments.createdAt);

    const commentIds = allComments.map(c => c.id);
    if (commentIds.length > 0) {
      allCommentReactions = await db.select().from(commentReactions).where(inArray(commentReactions.commentId, commentIds));
    }
  }

  const postsWithDetails = userPosts.map(p => ({
    ...p,
    likes: allReactions.filter(r => r.postId === p.id).map(r => r.userId),
    comments: allComments
      .filter(c => c.postId === p.id)
      .map(c => ({
        ...c,
        likes: allCommentReactions.filter(r => r.commentId === c.id).map(r => r.userId)
      })),
  }));

  const userData = {
    id: user.id,
    name: user.name,
    email: user.email ?? '',
    phone: user.phone ?? null,
    birthDate: user.birthDate ?? null,
    matricula: user.matricula ?? '',
    bio: user.bio ?? null,
    role: user.role,
    avatar: user.avatar ?? null,
    groupId: user.groupId ?? null,
    groupName,
    xp: user.xp,
    totalXp: user.xp,
    level: levelInfo.level,
    levelName: levelInfo.name,
    streakCurrent: user.streakCurrent,
    streakBest: user.streakBest,
    xpIntoCurrentLevel: levelInfo.xpIntoCurrentLevel,
    xpNeededForNext: levelInfo.xpNeededForNext,
    xpProgress: levelInfo.progress,
    isMaxLevel: levelInfo.isMaxLevel,
    joinedAt: user.joinedAt,
    shareDevotionals: user.shareDevotionals,
  };

  return (
    <PerfilClient
      user={userData}
      currentTheme={currentTheme}
      feed={feedItems.slice(0, 20)}
      posts={postsWithDetails}
      earnedBadges={earnedBadges}
    />
  );
}
