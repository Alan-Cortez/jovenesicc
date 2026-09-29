const fs = require('fs');

// === POSTS.TS ===
let p = fs.readFileSync('src/app/actions/posts.ts', 'utf8');

// Add XP on post creation
p = p.replace(
  "    revalidatePath('/dashboard');\n    return { success: true };\n  } catch (error) {\n    console.error('Error creating post:', error);",
  "    // Grant XP for posting (max 1/day handled by limiting UI)\n    const { grantXP } = await import('@/lib/gamification');\n    await grantXP({ userId: user.id, amount: 5, reason: 'Publicación creada', sourceType: 'devotional' });\n\n    revalidatePath('/dashboard');\n    return { success: true };\n  } catch (error) {\n    console.error('Error creating post:', error);"
);

fs.writeFileSync('src/app/actions/posts.ts', p);
console.log('Fixed posts.ts');

// === SONGS.TS ===
let s = fs.readFileSync('src/app/actions/songs.ts', 'utf8');

// Add XP on song suggestion (after the notifyMany call)
if (!s.includes('grantXP')) {
  s = s.replace(
    "    revalidatePath('/dashboard');\n    return { success: true };\n  } catch (error) {\n    console.error('Error adding song:', error);",
    "    // Grant small XP for song suggestion\n    const { grantXP } = await import('@/lib/gamification');\n    await grantXP({ userId: user.id, amount: 3, reason: 'Canción sugerida', sourceType: 'manual' });\n\n    revalidatePath('/dashboard');\n    return { success: true };\n  } catch (error) {\n    console.error('Error adding song:', error);"
  );
}

fs.writeFileSync('src/app/actions/songs.ts', s);
console.log('Fixed songs.ts');

// === Check for devotionals.ts ===
try {
  let d = fs.readFileSync('src/app/actions/devotionals.ts', 'utf8');
  // Check if it has a create function and add grantXP
  if (d.includes('insert(devotionals)') && !d.includes('grantXP')) {
    d = d.replace(
      "    revalidatePath('/dashboard/devocionales');",
      "    // Grant XP for devotional\n    const { grantXP, updateStreak } = await import('@/lib/gamification');\n    await grantXP({ userId: user.id, amount: 10, reason: 'Devocional publicado', sourceType: 'devotional' });\n    await updateStreak(user.id);\n\n    revalidatePath('/dashboard/devocionales');"
    );
    fs.writeFileSync('src/app/actions/devotionals.ts', d);
    console.log('Fixed devotionals.ts');
  }
} catch (e) {
  console.log('devotionals.ts not found or no changes needed');
}
