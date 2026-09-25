'use server';

import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { users } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { encrypt } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function loginAction(formData: FormData) {
  const matricula = formData.get('matricula') as string;
  const password = formData.get('password') as string;

  if (!matricula || !password) {
    return { error: 'Por favor ingresa matrícula y contraseña' };
  }

  try {
    // 1. Buscar usuario
    const userResult = await db.select().from(users).where(eq(users.matricula, matricula)).limit(1);
    const user = userResult[0];

    if (!user) {
      return { error: 'Matrícula no encontrada' };
    }

    // 2. Verificar contraseña
    let isMatch = false;
    if (user.passwordHash.startsWith('$2')) {
      isMatch = await bcrypt.compare(password, user.passwordHash);
    } else {
      isMatch = password === user.passwordHash;
    }

    if (!isMatch) {
      return { error: 'Contraseña incorrecta' };
    }

    if (!user.isActive) {
      return { error: 'Usuario inactivo. Contacta a tu líder.' };
    }

    // 3. Crear sesión (JWT)
    const sessionData = {
      id: user.id,
      role: user.role,
      name: user.name,
      matricula: user.matricula,
      groupId: user.groupId,
    };

    const token = await encrypt(sessionData);

    // 4. Guardar cookie
    const cookieStore = await cookies();
    cookieStore.set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 7 días
      path: '/',
    });

    return { success: true };
  } catch (error) {
    console.error('Login error:', error);
    return { error: 'Ocurrió un error en el servidor.' };
  }
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete('session');
}
