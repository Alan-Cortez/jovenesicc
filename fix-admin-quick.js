const fs = require('fs');
let a = fs.readFileSync('src/app/actions/admin.ts', 'utf8');

// Fix quickCompleteMissionAction - first occurrence (existing submission)
a = a.replace(
  "await db.update(users).set({ xp: sql`${users.xp} + ${mission.xpReward}` }).where(eq(users.id, targetUserId));\n      }\n    } else {",
  "const { grantXP: grantXP1 } = await import('@/lib/gamification');\n        await grantXP1({ userId: targetUserId, amount: mission.xpReward, reason: 'Misión completada', sourceType: 'task', sourceId: taskId, grantedBy: admin.id });\n      }\n    } else {"
);

// Fix quickCompleteMissionAction - second occurrence (new submission)
a = a.replace(
  "await db.update(users).set({ xp: sql`${users.xp} + ${mission.xpReward}` }).where(eq(users.id, targetUserId));\n    }",
  "const { grantXP: grantXP2 } = await import('@/lib/gamification');\n      await grantXP2({ userId: targetUserId, amount: mission.xpReward, reason: 'Misión completada', sourceType: 'task', sourceId: taskId, grantedBy: admin.id });\n    }"
);

fs.writeFileSync('src/app/actions/admin.ts', a);
console.log('Fixed quickCompleteMissionAction');
