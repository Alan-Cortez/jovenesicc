import React from 'react';
import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getGroupsWithMembersAction } from '@/app/actions/grupos';
import GruposClient from './GruposClient';

export default async function AdminGruposPage() {
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

  const result = await getGroupsWithMembersAction();
  const data = result.success && result.data ? result.data : { groups: [], unassigned: [] };

  return <GruposClient groups={data.groups} unassigned={data.unassigned} />;
}
