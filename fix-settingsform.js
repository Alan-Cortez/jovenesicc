const fs = require('fs');

let c = fs.readFileSync('src/app/dashboard/perfil/SettingsForm.tsx', 'utf8');

// Add initialBio to destructured props
c = c.replace(
  /initialAvatar,\s*initialEmail,/g,
  "initialAvatar,\n  initialBio,\n  initialEmail,"
);

// Add initialBio to typescript types
c = c.replace(
  /initialAvatar: string \| null,\s*initialEmail\?: string \| null,/g,
  "initialAvatar: string | null,\n  initialBio?: string | null,\n  initialEmail?: string | null,"
);

// Add textarea to form, before Nombre Público
c = c.replace(
  /<div>\s*<label style=\{\{ display: 'block', fontSize: '0.8rem', color: '#a0aab2', marginBottom: '8px' \}\}>Nombre Público<\/label>/g,
  `<div>
        <label style={{ display: 'block', fontSize: '0.8rem', color: '#a0aab2', marginBottom: '8px' }}>Presentación</label>
        <textarea name="bio" defaultValue={initialBio || ''} className="input-field" placeholder="Agrega una breve descripción..." rows={3} maxLength={150} style={{ resize: 'vertical' }}></textarea>
        <span style={{ fontSize: '0.7rem', color: '#63657a', marginTop: '4px', display: 'block' }}>Máximo 150 caracteres.</span>
      </div>

      <div>
        <label style={{ display: 'block', fontSize: '0.8rem', color: '#a0aab2', marginBottom: '8px' }}>Nombre Público</label>`
);

fs.writeFileSync('src/app/dashboard/perfil/SettingsForm.tsx', c);
