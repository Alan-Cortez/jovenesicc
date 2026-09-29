'use client';

import { useState } from 'react';
import { updateProfileSettingsAction } from '@/app/actions/user';

export default function PerfilSettingsForm({ 
  initialName, 
  initialAvatar,
  initialEmail,
  initialPhone,
  initialBirthDate,
  currentTheme 
}: { 
  initialName: string, 
  initialAvatar: string | null,
  initialEmail?: string | null,
  initialPhone?: string | null,
  initialBirthDate?: string | null,
  currentTheme: string 
}) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);
  const [compressedAvatar, setCompressedAvatar] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 500;
        const MAX_HEIGHT = 500;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Compress to JPEG with 0.7 quality
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        setCompressedAvatar(dataUrl);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setMessage(null);
    const result = await updateProfileSettingsAction(formData);
    setLoading(false);

    if (result.error) {
      setMessage({ type: 'error', text: result.error });
    } else if (result.success) {
      setMessage({ type: 'success', text: 'Perfil actualizado correctamente.' });
      // Recargar página para aplicar tema
      window.location.reload();
    }
  }

  return (
    <form action={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
      {message && (
        <div style={{ 
          padding: '12px', 
          borderRadius: '6px', 
          backgroundColor: message.type === 'error' ? 'rgba(255,107,107,0.1)' : 'rgba(74, 226, 144, 0.1)',
          color: message.type === 'error' ? '#ff6b6b' : '#4ae290',
          border: `1px solid ${message.type === 'error' ? '#ff6b6b' : '#4ae290'}`,
          fontSize: '0.9rem'
        }}>
          {message.text}
        </div>
      )}
      
      <div>
        <label style={{ display: 'block', fontSize: '0.8rem', color: '#a0aab2', marginBottom: '8px' }}>Foto de Perfil (Galería)</label>
        <input type="file" accept="image/*" className="input-field" style={{ backgroundColor: 'var(--glass-bg)' }} onChange={handleFileChange} />
        {compressedAvatar && <input type="hidden" name="avatarBase64" value={compressedAvatar} />}
        <span style={{ fontSize: '0.7rem', color: '#63657a', marginTop: '4px', display: 'block' }}>Selecciona una imagen desde tu dispositivo.</span>
      </div>

      <div>
        <label style={{ display: 'block', fontSize: '0.8rem', color: '#a0aab2', marginBottom: '8px' }}>Nombre Público</label>
        <input type="text" name="name" defaultValue={initialName} className="input-field" required />
      </div>

      <div>
        <label style={{ display: 'block', fontSize: '0.8rem', color: '#a0aab2', marginBottom: '8px' }}>Correo Electrónico</label>
        <input type="email" name="email" defaultValue={initialEmail || ''} className="input-field" placeholder="ejemplo@correo.com" />
      </div>

      <div style={{ display: 'flex', gap: '16px' }}>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', fontSize: '0.8rem', color: '#a0aab2', marginBottom: '8px' }}>Teléfono</label>
          <input type="tel" name="phone" defaultValue={initialPhone || ''} className="input-field" placeholder="10 dígitos" />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', fontSize: '0.8rem', color: '#a0aab2', marginBottom: '8px' }}>Cumpleaños</label>
          <input type="date" name="birthDate" defaultValue={initialBirthDate || ''} className="input-field" style={{ colorScheme: 'dark' }} />
          <span style={{ fontSize: '0.7rem', color: '#63657a', marginTop: '4px', display: 'block' }}>Tu matrícula se actualizará usando esta fecha (DDMMYY).</span>
        </div>
      </div>

      <div>
        <label style={{ display: 'block', fontSize: '0.8rem', color: '#a0aab2', marginBottom: '8px' }}>Apariencia (Tema)</label>
        <select name="theme" defaultValue={currentTheme} className="input-field" style={{ backgroundColor: 'var(--glass-bg)', cursor: 'pointer', color: 'var(--color-text-main)' }}>
          <option value="dark" style={{ backgroundColor: '#111' }}>Oscuro (Dark Mode)</option>
          <option value="light" style={{ backgroundColor: '#fff', color: '#000' }}>Claro (Light Mode)</option>
        </select>
      </div>

      <div>
        <label style={{ display: 'block', fontSize: '0.8rem', color: '#a0aab2', marginBottom: '8px' }}>Cambiar Contraseña (opcional)</label>
        <input 
          type="password" 
          name="password" 
          className="input-field" 
          placeholder="Dejar en blanco para no cambiar (6 dígitos numéricos)" 
          pattern="\d{6}"
          title="La contraseña debe tener exactamente 6 dígitos numéricos"
        />
      </div>
      
      <div style={{ marginTop: '8px' }}>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'GUARDANDO...' : 'GUARDAR CAMBIOS'}
        </button>
      </div>
    </form>
  );
}
