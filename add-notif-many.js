const fs = require('fs');
let c = fs.readFileSync('src/app/actions/notifications.ts', 'utf8');

const newCode = `
export async function notifyMany(data: {
  title?: string;
  type: string;
  content: string;
  link?: string;
  assignedTo: string;
  groupId?: number | null;
  userId?: number | null;
}) {
  try {
    let targetUsers = [];
    if (data.assignedTo === 'all') {
      const res = await db.select({ id: users.id }).from(users).where(eq(users.isActive, 1));
      targetUsers = res.map(r => r.id);
    } else if (data.assignedTo === 'group' && data.groupId) {
      const res = await db.select({ id: users.id }).from(users).where(eq(users.groupId, data.groupId));
      targetUsers = res.map(r => r.id);
    } else if (data.assignedTo === 'individual' && data.userId) {
      targetUsers = [data.userId];
    }

    if (targetUsers.length > 0) {
      // Create insert objects
      const values = targetUsers.map(uid => ({
        userId: uid,
        type: data.type,
        title: data.title || 'Sistema',
        content: data.content,
        link: data.link || null,
        isRead: 0
      }));
      await db.insert(notifications).values(values);
    }
  } catch (error) {
    console.error("Failed to batch create notifications:", error);
  }
}
`;

c = c + newCode;
fs.writeFileSync('src/app/actions/notifications.ts', c);
