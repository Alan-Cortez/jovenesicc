import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth';
import { db } from '@/lib/db';
import { users } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { updateUserAction } from '@/app/actions/admin';
import Link from 'next/link';

export default async function EditUsuarioPage({ params }: { params: Promise<{ id: string }> }) {
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

  const { id } = await params;
  const userId = parseInt(id, 10);
  if (isNaN(userId)) redirect('/dashboard/admin/usuarios');

  const userResult = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  const targetUser = userResult[0];

  if (!targetUser) {
    return (
      <div style={{ padding: '40px 24px' }}>
        <p style={{ color: '#a0aab2' }}>Usuario no encontrado.</p>
        <Link href="/dashboard/admin/usuarios" style={{ color: '#ffffff', textDecoration: 'underline' }}>Volver</Link>
      </div>
    );
  }

  return (
    <div style={{ padding: '40px 24px', maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <Link href="/dashboard/admin/usuarios" style={{ color: '#a0aab2', textDecoration: 'none', fontSize: '0.9rem' }}>
          ← Volver a Usuarios
        </Link>
      </div>

      <div className="glass-panel" style={{ backgroundColor: '#000000', border: '1px solid rgba(255,255,255,0.2)' }}>
        <h3 style={{ fontSize: '1.2rem', marginBottom: '16px' }}>Editar Usuario #{targetUser.id}</h3>
        <form action={async (formData) => {
          'use server';
          const { updateUserAction } = await import('@/app/actions/admin');
          const result = await updateUserAction(formData);
          if (result.success) {
            const { redirect } = await import('next/navigation');
            redirect('/dashboard/admin/usuarios');
          }
        }} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <input type="hidden" name="userId" value={targetUser.id} />
          
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#a0aab2', marginBottom: '8px' }}>Nombre completo *</label>
            <input type="text" name="name" defaultValue={targetUser.name} className="input-field" required />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#a0aab2', marginBottom: '8px' }}>ID de Grupo (opcional)</label>
            <input type="number" name="groupId" className="input-field" defaultValue={targetUser.groupId === null ? '' : targetUser.groupId} placeholder="ID del grupo (opcional)" />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#a0aab2', marginBottom: '8px' }}>Matrícula *</label>
            <input type="text" name="matricula" defaultValue={targetUser.matricula ?? ''} className="input-field" required />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#a0aab2', marginBottom: '8px' }}>Rol *</label>
            <select name="role" defaultValue={targetUser.role} className="input-field" style={{ backgroundColor: '#111111', cursor: 'pointer' }} required>
              <option value="joven">Joven</option>
              <option value="lider">Líder</option>
              {admin.role === 'admin' && <option value="admin">Administrador</option>}
            </select>
          </div>
          <button type="submit" className="btn-primary" style={{ marginTop: '8px', padding: '12px' }}>
            GUARDAR CAMBIOS
          </button>
        </form>
      </div>
    </div>
  );
}
