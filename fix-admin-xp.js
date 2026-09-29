const fs = require('fs');

// Fix admin.ts - reviewSubmissionAction
let a = fs.readFileSync('src/app/actions/admin.ts', 'utf8');

a = a.replace(
  `      // 2. Add XP to User\r\n      await db.update(users)\r\n        .set({ xp: sql\`\${users.xp} + \${submission.xpReward}\` })\r\n        .where(eq(users.id, submission.userId));\r\n        \r\n      // 3. Log XP\r\n      await db.insert(xpLog).values({\r\n        userId: submission.userId,\r\n        amount: submission.xpReward,\r\n        reason: 'Misión completada',\r\n        sourceType: 'task',\r\n        sourceId: submission.taskId,\r\n        grantedBy: admin.id,\r\n        createdAt: new Date().toISOString()\r\n      });\r\n\r\n      // 4. Send Notification`,
  `      // 2. Grant XP via gamification engine\r\n      const { grantXP } = await import('@/lib/gamification');\r\n      await grantXP({\r\n        userId: submission.userId,\r\n        amount: submission.xpReward,\r\n        reason: 'Misión completada',\r\n        sourceType: 'task',\r\n        sourceId: submission.taskId,\r\n        grantedBy: admin.id,\r\n      });\r\n\r\n      // 3. Send Notification`
);

fs.writeFileSync('src/app/actions/admin.ts', a);
