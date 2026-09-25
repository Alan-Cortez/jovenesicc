import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { announcements, users } from '@/lib/schema';
import { eq, desc } from 'drizzle-orm';
import DashboardHomeClient from './HomeClient';

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session')?.value;
  if (!sessionToken) redirect('/login');

  let sessionUser;
  try {
    sessionUser = await decrypt(sessionToken);
  } catch {
    redirect('/login');
  }

  // Traer datos del usuario
  const userResult = await db.select().from(users).where(eq(users.id, sessionUser.id)).limit(1);
  const user = userResult[0];

  // Traer el banner (announcement con title='__banner__')
  const bannerResult = await db
    .select()
    .from(announcements)
    .where(eq(announcements.title, '__banner__'))
    .limit(1);

  let bannerData: { headline: string; subheading: string; photos: string[] } = {
    headline: 'Bienvenidos',
    subheading: 'Comunidad Jovenes',
    photos: [],
  };

  if (bannerResult[0]) {
    try {
      bannerData = JSON.parse(bannerResult[0].content);
    } catch {
      // usar defaults
    }
  }

  // Traer anuncios normales (no banner)
  const announcementList = await db
    .select()
    .from(announcements)
    .where(eq(announcements.isPinned, 1))
    .orderBy(desc(announcements.publishedAt))
    .limit(5);

  const filteredAnnouncements = announcementList
    .filter((a) => a.title !== '__banner__')
    .map((a) => ({
      id: a.id,
      title: a.title,
      content: a.content,
      publishedAt: a.publishedAt,
      expiresAt: a.expiresAt ?? null,
    }));

  const { readingProgress, readingPlanDays, readingPlans, tasks, taskSubmissions } = await import('@/lib/schema');
  const { and, isNull } = await import('drizzle-orm');

  // Buscar el plan activo del usuario (el primer día 'available')
  const activePlanResult = await db.select({
    planId: readingPlans.id,
    planTitle: readingPlans.title,
    dayId: readingPlanDays.id,
    dayNumber: readingPlanDays.dayNumber
  })
  .from(readingProgress)
  .innerJoin(readingPlanDays, eq(readingProgress.planDayId, readingPlanDays.id))
  .innerJoin(readingPlans, eq(readingProgress.planId, readingPlans.id))
  .where(and(
    eq(readingProgress.userId, user.id),
    eq(readingProgress.status, 'available')
  ))
  .limit(1);

  const activePlan = activePlanResult[0] || null;

  // Buscar una misión pendiente (asignada al grupo o a todos, que no esté completada)
  // Por simplicidad, traemos las tareas y vemos si el usuario ya envió algo
  const userTasks = await db.select().from(tasks).orderBy(desc(tasks.createdAt)).limit(10);
  
  let activeMission = null;
  for (const t of userTasks) {
    if (t.assignedTo === 'group' && t.groupId !== user.groupId) continue;
    
    // Verificar si el usuario ya la hizo
    const subResult = await db.select().from(taskSubmissions)
      .where(and(eq(taskSubmissions.taskId, t.id), eq(taskSubmissions.userId, user.id)))
      .limit(1);
      
    if (subResult.length === 0 || subResult[0].status === 'rejected') {
      activeMission = t;
      break;
    }
  }

  const isAdmin = user?.role === 'admin' || user?.role === 'lider';

  const { posts, postReactions, postComments } = await import('@/lib/schema');
  
  // Fetch posts with author info
  const allPosts = await db.select({
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
  .orderBy(desc(posts.createdAt))
  .limit(20);

  // Fetch reactions and comments for these posts
  const postIds = allPosts.map(p => p.id);
  
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

  // Fetch song suggestions
  const { songSuggestions } = await import('@/lib/schema');
  const allSongs = await db.select({
    id: songSuggestions.id,
    trackId: songSuggestions.trackId,
    createdAt: songSuggestions.createdAt,
    userId: users.id,
    userName: users.name,
    userAvatar: users.avatar
  })
  .from(songSuggestions)
  .innerJoin(users, eq(songSuggestions.userId, users.id))
  .orderBy(desc(songSuggestions.createdAt))
  .limit(10);

  const postsWithDetails = allPosts.map(p => ({
    ...p,
    likes: allReactions.filter(r => r.postId === p.id).map(r => r.userId),
    comments: allComments
      .filter(c => c.postId === p.id)
      .map(c => ({
        ...c,
        likes: allCommentReactions.filter(r => r.commentId === c.id).map(r => r.userId)
      })),
  }));

  return (
    <DashboardHomeClient
      userId={sessionUser.id}
      userName={sessionUser.name}
      userAvatar={user?.avatar ?? null}
      userLevel={user?.level ?? 1}
      userXp={user?.xp ?? 0}
      userStreak={user?.streakCurrent ?? 0}
      banner={bannerData}
      announcements={filteredAnnouncements}
      isAdmin={isAdmin}
      activePlan={activePlan}
      activeMission={activeMission}
      posts={postsWithDetails}
      songs={allSongs}
    />
  );
}
