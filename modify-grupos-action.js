const fs = require('fs');
let p = fs.readFileSync('src/app/actions/grupos.ts', 'utf8');

const target = `    const allGroups = await db.select().from(groups);
    const allUsers = await db.select({`;

const replacement = `    let allGroups = await db.select().from(groups);
    
    // Ensure _SIN_GRUPO_ exists
    let sinGrupoGroup = allGroups.find(g => g.name === '_SIN_GRUPO_');
    if (!sinGrupoGroup) {
      const res = await db.insert(groups).values({ name: '_SIN_GRUPO_', description: 'Virtual' }).returning();
      sinGrupoGroup = res[0];
      allGroups.push(sinGrupoGroup);
    }

    const allUsers = await db.select({`;

p = p.replace(target, replacement);

const target2 = `    const groupsWithMembers = allGroups.map(g => {`;
const replacement2 = `    const groupsWithMembers = allGroups.filter(g => g.name !== '_SIN_GRUPO_').map(g => {`;

p = p.replace(target2, replacement2);

const target3 = `    const unassigned = allUsers.filter(u => !u.groupId);

    return { success: true, data: { groups: groupsWithMembers, unassigned } };`;

const replacement3 = `    const unassigned = allUsers.filter(u => !u.groupId);

    return { success: true, data: { groups: groupsWithMembers, unassigned, sinGrupoId: sinGrupoGroup.id } };`;

p = p.replace(target3, replacement3);

fs.writeFileSync('src/app/actions/grupos.ts', p);
console.log('Modified grupos.ts');
