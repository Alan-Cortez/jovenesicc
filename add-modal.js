const fs = require('fs');

let p = fs.readFileSync('src/app/dashboard/perfil/PerfilClient.tsx', 'utf8');

// 1. Add allBadges to signature
p = p.replace(
  `  posts?: any[];
  earnedBadges?: any[];
}) {`,
  `  posts?: any[];
  earnedBadges?: any[];
  allBadges?: any[];
}) {`
);

// 2. Add state
p = p.replace(
  `const [activeEditTab, setActiveEditTab] = useState<'perfil' | 'preferencias' | 'seguridad'>('perfil');`,
  `const [activeEditTab, setActiveEditTab] = useState<'perfil' | 'preferencias' | 'seguridad'>('perfil');\n  const [showLevelInfo, setShowLevelInfo] = useState(false);`
);

// 3. Make panel clickable
p = p.replace(
  `<div className={styles.panel} style={{ padding: 0, overflow: 'hidden' }}>`,
  `<div className={styles.panel} style={{ padding: 0, overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.2s' }} onClick={() => setShowLevelInfo(true)} onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.02)'} onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}>`
);

// 4. Inject Modal JSX before the last closing div of the component
// The component ends with:
//       </div>
//     </div>
//   );
// }
const modalJsx = `
      {/* ── MODAL DE NIVEL Y LOGROS ── */}
      {showLevelInfo && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: '16px', padding: '2rem', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}>
            <button 
              onClick={() => setShowLevelInfo(false)}
              style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '1.5rem' }}
            >
              &times;
            </button>
            
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Flame color="#ff9800" /> ¿Cómo subir de Nivel?
            </h2>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem', lineHeight: '1.6' }}>
              Ganas <strong>XP (Puntos de Experiencia)</strong> al interactuar con la aplicación. Entre más participes, más rápido crecerá tu nivel espiritual.
              <br/><br/>
              • <strong>+5 XP</strong> por cada día que completes en un Plan de Lectura.<br/>
              • <strong>+5 XP</strong> por enviar un devocional.<br/>
              • <strong>+2 XP</strong> por dar like o comentar.<br/>
              • <strong>+10 a +50 XP</strong> al completar misiones especiales aprobadas por un líder.<br/>
              • <strong>Bonus:</strong> ¡Mantén tu racha diaria (🔥) para multiplicar tus puntos en el futuro!
            </p>

            <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', borderTop: '1px solid var(--color-border)', paddingTop: '1.5rem' }}>Logros por Cumplir</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
              {allBadges?.map(badge => {
                const isEarned = earnedBadges?.some(b => b.id === badge.id);
                return (
                  <div key={badge.id} style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '12px', 
                    padding: '12px', 
                    background: 'rgba(255,255,255,0.03)', 
                    borderRadius: '12px',
                    opacity: isEarned ? 1 : 0.4,
                    filter: isEarned ? 'none' : 'grayscale(100%)'
                  }}>
                    <div style={{ fontSize: '2rem' }}>{badge.icon || '🏅'}</div>
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: '0.9rem', color: isEarned ? badge.color || '#fff' : '#aaa' }}>{badge.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{badge.description}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
`;

p = p.replace(
  `      </div>\n    </div>\n  );\n}`,
  `${modalJsx}\n      </div>\n    </div>\n  );\n}`
);

fs.writeFileSync('src/app/dashboard/perfil/PerfilClient.tsx', p);
console.log('Fixed PerfilClient.tsx to include Level Modal');
