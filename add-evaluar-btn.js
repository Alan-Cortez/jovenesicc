const fs = require('fs');
let p = fs.readFileSync('src/app/dashboard/admin/grupos/GruposClient.tsx', 'utf8');

const t = `<h3 style={{ fontSize: '1rem', marginBottom: '12px' }}>Sin Grupo ({unassigned.length})</h3>`;
const r = `<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '1rem', margin: 0 }}>Sin Grupo ({unassigned.length})</h3>
              {sinGrupoId && unassigned.length > 0 && (
                <Link href={\`/dashboard/admin/grupos/\${sinGrupoId}/evaluar\`} style={{ backgroundColor: '#4ae290', color: '#000', padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold', textDecoration: 'none' }}>
                  Evaluar
                </Link>
              )}
            </div>`;

p = p.replace(t, r);
fs.writeFileSync('src/app/dashboard/admin/grupos/GruposClient.tsx', p);
