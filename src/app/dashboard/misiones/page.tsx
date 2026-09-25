import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth';
import { db } from '@/lib/db';
import { tasks, taskSubmissions } from '@/lib/schema';
import { eq, desc, or } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import MisionesClient from './MisionesClient';

export default async function MisionesPage() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session')?.value;
  if (!sessionToken) redirect('/login');

  let user;
  try {
    user = await decrypt(sessionToken);
  } catch {
    redirect('/login');
  }

  // Misiones activas para este usuario (all, o por grupo/userId)
  const activeTasks = await db
    .select()
    .from(tasks)
    .where(eq(tasks.isActive, 1))
    .orderBy(desc(tasks.createdAt));

  // Filtrar: assignedTo='all', o asignadas a este usuario, o a su grupo
  const relevantTasks = activeTasks.filter((t) => {
    if (t.assignedTo === 'all') return true;
    if (t.assignedTo === 'individual' && t.userId === user.id) return true;
    if (t.assignedTo === 'group' && user.groupId && t.groupId === user.groupId) return true;
    return false;
  });

  // Obtener el estado de submission del usuario para cada tarea
  const taskIds = relevantTasks.map((t) => t.id);
  const submissions = taskIds.length > 0
    ? await db
        .select()
        .from(taskSubmissions)
        .where(eq(taskSubmissions.userId, user.id))
    : [];

  // Mapa taskId → submission
  const submissionMap = new Map(submissions.map((s) => [s.taskId, s]));

  return (
    <MisionesClient
      userId={user.id}
      tasks={relevantTasks.map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description ?? '',
        xpReward: t.xpReward,
        evidenceType: t.evidenceType,
        deadline: t.deadline ?? null,
        submission: submissionMap.has(t.id)
          ? {
              status: submissionMap.get(t.id)!.status,
              submittedAt: submissionMap.get(t.id)!.submittedAt,
            }
          : null,
      }))}
    />
  );
}
