const fs = require('fs');

let p = fs.readFileSync('src/app/dashboard/perfil/PerfilClient.tsx', 'utf8');

p = p.replace(
  `export default function PerfilClient({
  user,
  currentTheme,
  feed,
  posts,
}: {
  user: UserData;
  currentTheme: string;
  feed: FeedItem[];
  posts?: any[];
}) {`,
  `export default function PerfilClient({
  user,
  currentTheme,
  feed,
  posts,
  earnedBadges = [],
}: {
  user: UserData;
  currentTheme: string;
  feed: FeedItem[];
  posts?: any[];
  earnedBadges?: any[];
}) {`
);

// Second error was: src/app/dashboard/perfil/PerfilClient.tsx(282,54): error TS2339: Property 'xpForNextLevel' does not exist on type 'UserData'.
p = p.replace(/\{user\.xpForNextLevel\.toLocaleString\(\)\}/g, "{user.xpNeededForNext?.toLocaleString()}");

fs.writeFileSync('src/app/dashboard/perfil/PerfilClient.tsx', p);
console.log('Fixed PerfilClient.tsx signature');
