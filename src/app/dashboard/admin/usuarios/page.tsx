import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth';
import { db } from '@/lib/db';
import { users } from '@/lib/schema';
import { redirect } from 'next/navigation';
import { createUserAction } from '@/app/actions/admin';
import Link from 'next/link';

export default async function AdminUsuariosPage() {
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

  // Traer todos los usuarios
  const allUsers = await db.select().from(users);

  // Calcular la próxima matrícula para mostrarla como placeholder
  let maxMatricula = 0;
  for (const u of allUsers) {
    if (u.matricula) {
      const num = parseInt(u.matricula, 10);
      if (!isNaN(num) && num > maxMatricula && num < 100000) {
        maxMatricula = num;
      }
    }
  }
  const nextMatricula = (maxMatricula + 1).toString().padStart(6, '0');

  return (
    <div style={{ padding: '40px 24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <h2 style={{ fontSize: '2rem' }}>Gestión de Usuarios</h2>
      </div>

      <div className="responsive-grid" style={{ gridTemplateColumns: '1fr 350px' }}>
        {/* Tabla de Usuarios */}
        <div className="glass-panel" style={{ backgroundColor: '#111111' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '16px' }}>Usuarios Registrados ({allUsers.length})</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#a0aab2', fontSize: '0.85rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '12px' }}>ID / Matrícula</th>
                  <th style={{ padding: '12px' }}>Nombre</th>
                  <th style={{ padding: '12px' }}>Rol</th>
                  <th style={{ padding: '12px' }}>Nivel</th>
                  <th style={{ padding: '12px' }}>Estado</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {allUsers.map(u => (
                  <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', opacity: u.isActive ? 1 : 0.5 }}>
                    <td style={{ padding: '12px', fontSize: '0.9rem' }}>
                      <span style={{ color: '#a0aab2' }}>#{u.id}</span> - {u.matricula}
                    </td>
                    <td style={{ padding: '12px', fontWeight: 'bold' }}>{u.name}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ 
                        fontSize: '0.75rem', 
                        padding: '4px 8px', 
                        borderRadius: '4px',
                        backgroundColor: u.role === 'admin' ? 'rgba(255, 255, 255, 0.2)' : u.role === 'lider' ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                        color: u.role === 'admin' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                        border: u.role === 'joven' ? '1px solid var(--glass-border)' : 'none'
                      }}>
                        {u.role.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>Lvl {u.level}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        fontSize: '0.7rem',
                        padding: '3px 8px',
                        borderRadius: '10px',
                        fontWeight: 600,
                        backgroundColor: u.isActive ? 'rgba(74,226,144,0.12)' : 'rgba(255,255,255,0.07)',
                        color: u.isActive ? '#4ae290' : 'var(--color-text-muted)',
                      }}>
                        {u.isActive ? 'ACTIVO' : 'INACTIVO'}
                      </span>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                        <Link href={`/dashboard/admin/usuarios/${u.id}`} style={{ textDecoration: 'none' }}>
                          <button style={{ backgroundColor: 'transparent', border: '1px solid rgba(255,255,255,0.3)', color: '#ffffff', borderRadius: '4px', padding: '4px 8px', fontSize: '0.75rem', cursor: 'pointer' }}>
                            Editar
                          </button>
                        </Link>

                        {u.isActive ? (
                          /* Usuario activo → solo Inactivar */
                          <form action={async (formData) => {
                            'use server';
                            const { deactivateUserAction } = await import('@/app/actions/admin');
                            await deactivateUserAction(formData);
                          }}>
                            <input type="hidden" name="userId" value={u.id} />
                            <button type="submit" style={{ backgroundColor: 'transparent', border: '1px solid rgba(255,107,107,0.4)', color: '#ff6b6b', borderRadius: '4px', padding: '4px 8px', fontSize: '0.75rem', cursor: 'pointer' }}>
                              Inactivar
                            </button>
                          </form>
                        ) : (
                          /* Usuario inactivo → Reactivar + Eliminar permanentemente */
                          <>
                            <form action={async (formData) => {
                              'use server';
                              const { reactivateUserAction } = await import('@/app/actions/admin');
                              await reactivateUserAction(formData);
                            }}>
                              <input type="hidden" name="userId" value={u.id} />
                              <button type="submit" style={{ backgroundColor: 'transparent', border: '1px solid rgba(74,226,144,0.4)', color: '#4ae290', borderRadius: '4px', padding: '4px 8px', fontSize: '0.75rem', cursor: 'pointer' }}>
                                Reactivar
                              </button>
                            </form>
                            <form action={async (formData) => {
                              'use server';
                              const { deleteUserAction } = await import('@/app/actions/admin');
                              await deleteUserAction(formData);
                            }}>
                              <input type="hidden" name="userId" value={u.id} />
                              <button type="submit" style={{ backgroundColor: 'rgba(255,71,87,0.12)', border: '1px solid rgba(255,71,87,0.4)', color: '#ff4757', borderRadius: '4px', padding: '4px 8px', fontSize: '0.75rem', cursor: 'pointer' }}>
                                Eliminar
                              </button>
                            </form>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Formulario Alta */}
        <div className="glass-panel" style={{ height: 'fit-content', backgroundColor: '#000000', border: '1px solid rgba(255,255,255,0.2)' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '16px' }}>Alta de Usuario</h3>
          <form action={async (formData) => {
            'use server';
            const { createUserAction } = await import('@/app/actions/admin');
            await createUserAction(formData);
          }} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#a0aab2', marginBottom: '8px' }}>Nombre completo *</label>
              <input type="text" name="name" className="input-field" placeholder="Ej. Juan Pérez" required />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#a0aab2', marginBottom: '8px' }}>Matrícula (Se autogenera)</label>
              <input type="text" name="matricula" className="input-field" placeholder={`Ej. ${nextMatricula} (Dejar vacío)`} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#a0aab2', marginBottom: '8px' }}>Contraseña Inicial *</label>
              <input type="text" name="password" className="input-field" defaultValue="123123" required />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#a0aab2', marginBottom: '8px' }}>Rol *</label>
              <select name="role" className="input-field" style={{ backgroundColor: '#111111', cursor: 'pointer' }} required>
                <option value="joven">Joven</option>
                <option value="lider">Líder</option>
                {admin.role === 'admin' && <option value="admin">Administrador</option>}
              </select>
            </div>
            <button type="submit" className="btn-primary" style={{ marginTop: '8px', padding: '12px' }}>
              REGISTRAR USUARIO
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
