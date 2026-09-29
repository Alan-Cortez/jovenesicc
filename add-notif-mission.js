const fs = require('fs');

let c = fs.readFileSync('src/app/actions/admin.ts', 'utf8');

c = c.replace(
  "import { createNotification } from './notifications';",
  "import { createNotification, notifyMany } from './notifications';"
);

c = c.replace(
  "    revalidatePath('/dashboard/admin/misiones');\n    return { success: true };\n  } catch (error) {",
  `    
    // Enviar notificación a los involucrados
    await notifyMany({
      title: 'Misión Nueva',
      type: 'mission',
      content: 'Se ha publicado una nueva misión: ' + title,
      link: '/dashboard/misiones',
      assignedTo,
      groupId,
      userId
    });
    
    revalidatePath('/dashboard/admin/misiones');
    return { success: true };
  } catch (error) {`
);

fs.writeFileSync('src/app/actions/admin.ts', c);
