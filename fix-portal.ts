import fs from 'fs';

let c = fs.readFileSync('src/app/dashboard/NotificationBell.tsx', 'utf8');

c = c.replace(
  "import { Bell, Heart, MessageSquare, Gift, Award, ShieldAlert, CheckCircle, Info, ArrowLeft } from 'lucide-react';",
  "import { Bell, Heart, MessageSquare, Gift, Award, ShieldAlert, CheckCircle, Info, ArrowLeft } from 'lucide-react';\nimport { createPortal } from 'react-dom';"
);

c = c.replace(
  "const dropdownRef = useRef<HTMLDivElement>(null);",
  "const dropdownRef = useRef<HTMLDivElement>(null);\n  const bellRef = useRef<HTMLButtonElement>(null);\n  const [mounted, setMounted] = useState(false);\n\n  useEffect(() => {\n    setMounted(true);\n  }, []);"
);

c = c.replace(
  "if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {",
  "if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) && bellRef.current && !bellRef.current.contains(event.target as Node)) {"
);

c = c.replace(
  /<div className=\{styles\.wrapper\} ref=\{dropdownRef\}>/,
  "<div className={styles.wrapper}>"
);

c = c.replace(
  /<button \n        className=\{styles\.bellBtn\}/,
  "<button \n        ref={bellRef}\n        className={styles.bellBtn}"
);

c = c.replace(
  /\{isOpen && \(\n        <div className=\{styles\.dropdown\}>/,
  "{isOpen && mounted && createPortal(\n        <div className={styles.dropdown} ref={dropdownRef}>"
);

c = c.replace(
  /<\/div>\n      \)\}\n    <\/div>/,
  "</div>\n      , document.body)}\n    </div>"
);

fs.writeFileSync('src/app/dashboard/NotificationBell.tsx', c);
