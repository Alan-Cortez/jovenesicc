const fs = require('fs');

let c = fs.readFileSync('src/app/actions/songs.ts', 'utf8');

if (!c.includes('notifyMany')) {
  c = c.replace(
    "import { eq } from 'drizzle-orm';",
    "import { eq } from 'drizzle-orm';\nimport { notifyMany } from './notifications';"
  );
  
  c = c.replace(
    "    await db.insert(songSuggestions).values({\n      userId: user.id,\n      spotifyUrl: url,\n      trackId,\n    });\n    revalidatePath('/dashboard');",
    `    await db.insert(songSuggestions).values({
      userId: user.id,
      spotifyUrl: url,
      trackId,
    });
    
    // Notify everyone
    await notifyMany({
      title: 'Nueva Canción',
      type: 'like', // un icono de corazon o similar
      content: user.name + ' ha agregado una nueva canción a la lista.',
      assignedTo: 'all'
    });
    
    revalidatePath('/dashboard');`
  );

  fs.writeFileSync('src/app/actions/songs.ts', c);
}
