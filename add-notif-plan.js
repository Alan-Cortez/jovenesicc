const fs = require('fs');
let c = fs.readFileSync('src/app/actions/admin.ts', 'utf8');

c = c.replace(
  "    // SQLite has limits on bulk insert size, but for a small prototype this is fine\n      await db.insert(readingProgress).values(progressInserts);\n    }\n\n    revalidatePath('/dashboard/admin/planes');",
  `    // SQLite has limits on bulk insert size, but for a small prototype this is fine
      await db.insert(readingProgress).values(progressInserts);
    }
    
    // Notificar asignación del plan
    await notifyMany({
      title: 'Nuevo Plan',
      type: 'mission', // usaremos el mismo ícono de misión
      content: 'Tienes un nuevo plan de lectura asignado.',
      link: '/dashboard/planes/' + planId,
      assignedTo,
      groupId,
      userId
    });

    revalidatePath('/dashboard/admin/planes');`
);

fs.writeFileSync('src/app/actions/admin.ts', c);
