import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { announcements } from '@/lib/schema';
import { eq, ne, desc } from 'drizzle-orm';
import BannerAdminClient from './BannerAdminClient';

export default async function BannerAdminPage() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session')?.value;
  if (!sessionToken) redirect('/login');

  let admin;
  try {
    admin = await decrypt(sessionToken);
    if (admin.role !== 'admin' && admin.role !== 'lider') redirect('/dashboard');
  } catch {
    redirect('/login');
  }

  // Banner actual
  const bannerResult = await db
    .select()
    .from(announcements)
    .where(eq(announcements.title, '__banner__'))
    .limit(1);

  let currentBanner = { headline: 'Bienvenidos', subheading: 'Comunidad Jovenes', photos: [] as string[] };
  if (bannerResult[0]) {
    try {
      currentBanner = JSON.parse(bannerResult[0].content);
    } catch {}
  }

  // Anuncios normales
  const announcementList = await db
    .select()
    .from(announcements)
    .where(ne(announcements.title, '__banner__'))
    .orderBy(desc(announcements.publishedAt));

  return (
    <BannerAdminClient
      currentBanner={currentBanner}
      announcements={announcementList.map((a) => ({
        id: a.id,
        title: a.title,
        content: a.content,
        publishedAt: a.publishedAt,
      }))}
    />
  );
}
