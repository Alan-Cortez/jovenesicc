const fs = require('fs');

// Songs
let s = fs.readFileSync('src/app/actions/songs.ts', 'utf8');
s = s.replace(
  "assignedTo: 'all'",
  "assignedTo: 'all',\n      actorId: user.id"
);
fs.writeFileSync('src/app/actions/songs.ts', s);

// Admin Missions
let a = fs.readFileSync('src/app/actions/admin.ts', 'utf8');
a = a.replace(
  "assignedTo,\n      groupId,\n      userId\n    });\n    \n    revalidatePath('/dashboard/admin/misiones');",
  "assignedTo,\n      groupId,\n      userId,\n      actorId: admin.id\n    });\n    \n    revalidatePath('/dashboard/admin/misiones');"
);

// Admin Plans
a = a.replace(
  "assignedTo,\n      groupId,\n      userId\n    });\n\n    revalidatePath('/dashboard/admin/planes');",
  "assignedTo,\n      groupId,\n      userId,\n      actorId: admin.id\n    });\n\n    revalidatePath('/dashboard/admin/planes');"
);
fs.writeFileSync('src/app/actions/admin.ts', a);
