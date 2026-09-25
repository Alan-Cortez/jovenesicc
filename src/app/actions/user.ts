'use server';

import { cookies } from 'next/headers';
import { decrypt, encrypt } from '@/lib/auth';
import { db } from '@/lib/db';
import { users } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';

export async function updateProfileSettingsAction(formData: FormData) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session')?.value;
  if (!sessionToken) return { error: 'No autenticado' };
  
  let user;
  try {
    user = await decrypt(sessionToken);
  } catch {
    return { error: 'No autenticado' };
  }

  const name = formData.get('name') as string;
  const newPassword = formData.get('password') as string;
  const avatarFile = formData.get('avatar') as File;
  const theme = formData.get('theme') as string;
  const email = formData.get('email') as string;
  const phone = formData.get('phone') as string;
  const birthDate = formData.get('birthDate') as string;

  if (!name) {
    return { error: 'El nombre no puede estar vacío' };
  }

  try {
    const updateData: any = { 
      name, 
      email: email || null,
      phone: phone || null,
      birthDate: birthDate || null,
      updatedAt: new Date().toISOString() 
    };

    if (birthDate) {
      const [year, month, day] = birthDate.split('-');
      if (year && month && day) {
        const yy = year.slice(-2);
        updateData.matricula = `${day}${month}${yy}`;
      }
    }
    
    // Handle File upload to Base64
    if (avatarFile && avatarFile.size > 0) {
      if (avatarFile.size > 5 * 1024 * 1024) { // 5MB limit
        return { error: 'La imagen de perfil no debe superar los 5MB' };
      }
      const bytes = await avatarFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const base64 = `data:${avatarFile.type};base64,${buffer.toString('base64')}`;
      updateData.avatar = base64;
    }
    
    if (newPassword && newPassword.trim().length > 0) {
      if (!/^\d{6}$/.test(newPassword.trim())) {
        return { error: 'La nueva contraseña debe tener exactamente 6 dígitos numéricos.' };
      }
      updateData.passwordHash = await bcrypt.hash(newPassword.trim(), 12);
    }

    await db.update(users).set(updateData).where(eq(users.id, user.id));
    
    // Si cambia de tema, guardamos la cookie de tema.
    if (theme === 'light' || theme === 'dark') {
      cookieStore.set('theme', theme, {
        httpOnly: false, // Accesible por CSS o cliente si hace falta
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 365,
        path: '/',
      });
    }

    // If name or matricula changes, we must update the JWT payload so the Sidebar updates
    if (name !== user.name || (updateData.matricula && updateData.matricula !== user.matricula)) {
      const newToken = await encrypt({ ...user, name, matricula: updateData.matricula || user.matricula });
      cookieStore.set('session', newToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
      });
    }

    revalidatePath('/dashboard');
    return { success: true };
  } catch (error: any) {
    console.error('Error updating profile:', error);
    if (error.message?.includes('UNIQUE') || error.message?.includes('matricula')) {
      return { error: 'Ya existe alguien registrado con esa misma fecha de nacimiento (Matrícula duplicada).' };
    }
    return { error: 'Error al actualizar el perfil' };
  }
}
