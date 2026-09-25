'use client';

import { useState } from 'react';
import styles from './lideres.module.css';

type LeaderboardUser = {
  id: number;
  name: string;
  role: string;
  level: number;
  xp: number;
  streak: number;
  totalXp: number;
  avatar?: string | null;
};

type GroupRank = {
  id: number;
  name: string;
  totalScore: number;
};

const TROPHY: Record<number, string> = {
  1: '🏆',
  2: '🥈',
  3: '🥉',
};

const PODIUM_COLORS: Record<number, { border: string; bg: string; badge: string; num: string }> = {
  1: { border: 'rgba(255,215,0,0.5)', bg: 'rgba(255,215,0,0.06)', badge: '#ffd700', num: '#ffd700' },
  2: { border: 'rgba(192,192,192,0.4)', bg: 'rgba(192,192,192,0.05)', badge: '#c0c0c0', num: '#c0c0c0' },
  3: { border: 'rgba(205,127,50,0.4)', bg: 'rgba(205,127,50,0.05)', badge: '#cd7f32', num: '#cd7f32' },
};

function Initials({ name, size = 48, color, avatar }: { name: string; size?: number; color?: string; avatar?: string | null }) {
  if (avatar) {
    return (
      <img
        src={avatar}
        alt={name}
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          objectFit: 'cover',
          border: '2px solid rgba(255,255,255,0.15)',
          flexShrink: 0,
        }}
      />
    );
  }
  return (
    <div style={{
      width: size,
      height: size,
      borderRadius: '50%',
      background: color ?? 'rgba(255,255,255,0.1)',
      border: '2px solid rgba(255,255,255,0.15)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Outfit, sans-serif',
      fontWeight: 800,
      fontSize: size * 0.35,
      color: '#fff',
      flexShrink: 0,
    }}>
      {name.substring(0, 2).toUpperCase()}
    </div>
  );
}

export default function LideresClient({
  currentUserId,
  users,
  groups,
}: {
  currentUserId: number;
  users: LeaderboardUser[];
  groups: GroupRank[];
}) {
  const [activeTab, setActiveTab] = useState<'jovenes' | 'grupos'>('jovenes');
  const rankedUsers = users.filter(u => u.role !== 'admin');

  return (
    <div className={styles.root}>

      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Tabla de Lideres</h1>
          <p className={styles.pageSub}>Mira como vas en comparacion al grupo</p>
        </div>
        <div className={styles.tabBar}>
          {(['jovenes', 'grupos'] as const).map(tab => (
            <button
              key={tab}
              className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === 'jovenes' ? 'Jovenes' : 'Grupos'}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'jovenes' ? (
        <JovenesTab users={rankedUsers} currentUserId={currentUserId} />
      ) : (
        <GruposTab groups={groups} />
      )}
    </div>
  );
}

function JovenesTab({ users, currentUserId }: { users: LeaderboardUser[]; currentUserId: number }) {
  const top3 = users.slice(0, 3);
  const rest = users.slice(3);
  // Reordenar: 2, 1, 3 para el podio visual
  const podiumOrder = [top3[1], top3[0], top3[2]].filter(Boolean);
  const podiumPositions = [2, 1, 3];

  return (
    <>
      {/* Podium */}
      {top3.length > 0 && (
        <div className={styles.podiumSection}>
          {podiumOrder.map((u, idx) => {
            const rank = podiumPositions[idx];
            const c = PODIUM_COLORS[rank];
            const heights = { 1: 210, 2: 170, 3: 150 };
            return (
              <div
                key={u.id}
                className={styles.podiumCard}
                style={{
                  height: heights[rank as keyof typeof heights],
                  border: `1px solid ${c.border}`,
                  background: `linear-gradient(to top, ${c.bg}, rgba(255,255,255,0.03))`,
                  order: rank === 1 ? 2 : rank === 2 ? 1 : 3,
                }}
              >
                {/* Badge de posicion */}
                <div className={styles.rankBadge} style={{ background: c.badge }}>
                  {rank}
                </div>

                {/* Trofeo */}
                <span className={styles.trophyIcon}>{TROPHY[rank]}</span>

                {/* Avatar */}
                <Initials name={u.name} size={rank === 1 ? 56 : 44} avatar={u.avatar} />

                {/* Nombre */}
                <p className={styles.podiumName}>{u.name}</p>

                {/* XP */}
                <div className={styles.podiumXp} style={{ color: c.num }}>
                  {u.totalXp.toLocaleString()} XP
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Lista completa */}
      <div className={styles.list}>
        {users.map((u, i) => {
          const rank = i + 1;
          const isMe = u.id === currentUserId;
          const medal = PODIUM_COLORS[rank];
          return (
            <div
              key={u.id}
              className={`${styles.row} ${isMe ? styles.rowMe : ''}`}
            >
              {/* Posicion */}
              <div className={styles.colRank}>
                <span
                  className={styles.rankNum}
                  style={medal ? { color: medal.num } : undefined}
                >
                  {rank <= 3 ? TROPHY[rank] : rank}
                </span>
              </div>

              {/* Avatar + nombre */}
              <div className={styles.colName}>
                <Initials
                  name={u.name}
                  size={38}
                  color={isMe ? 'rgba(255,255,255,0.2)' : undefined}
                  avatar={u.avatar}
                />
                <div>
                  <span className={styles.nameText}>
                    {u.name}
                    {isMe && <span className={styles.meTag}> (Tu)</span>}
                  </span>
                  <span className={styles.levelBadge}>Nivel {u.level}</span>
                </div>
              </div>

              {/* Stats */}
              <div className={styles.colStats}>
                {u.streak > 0 && (
                  <span className={styles.streakBadge}>{u.streak} dias</span>
                )}
                <span className={styles.xpText}>
                  {u.totalXp.toLocaleString()} XP
                </span>
              </div>
            </div>
          );
        })}
        {users.length === 0 && (
          <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '32px 0', fontSize: '0.9rem' }}>
            No hay datos disponibles todavia.
          </p>
        )}
      </div>
    </>
  );
}

function GruposTab({ groups }: { groups: GroupRank[] }) {
  const top3 = groups.slice(0, 3);
  const podiumOrder = [top3[1], top3[0], top3[2]].filter(Boolean);
  const podiumPositions = [2, 1, 3];
  const GROUP_COLORS = ['#4ae290', '#4a90e2', '#e24a4a', '#e2c44a', '#a44ae2'];

  return (
    <>
      {top3.length > 0 && (
        <div className={styles.podiumSection}>
          {podiumOrder.map((g, idx) => {
            const rank = podiumPositions[idx];
            const c = PODIUM_COLORS[rank];
            const heights = { 1: 210, 2: 170, 3: 150 };
            const gc = GROUP_COLORS[(g.id - 1) % GROUP_COLORS.length];
            return (
              <div
                key={g.id}
                className={styles.podiumCard}
                style={{
                  height: heights[rank as keyof typeof heights],
                  border: `1px solid ${c.border}`,
                  background: `linear-gradient(to top, ${c.bg}, rgba(255,255,255,0.03))`,
                  order: rank === 1 ? 2 : rank === 2 ? 1 : 3,
                }}
              >
                <div className={styles.rankBadge} style={{ background: c.badge }}>{rank}</div>
                <span className={styles.trophyIcon}>{TROPHY[rank]}</span>
                <Initials name={g.name} size={rank === 1 ? 56 : 44} color={gc + '33'} />
                <p className={styles.podiumName}>{g.name}</p>
                <div className={styles.podiumXp} style={{ color: c.num }}>
                  {g.totalScore.toLocaleString()} pts
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className={styles.list}>
        {groups.map((g, i) => {
          const rank = i + 1;
          const medal = PODIUM_COLORS[rank];
          const gc = GROUP_COLORS[(g.id - 1) % GROUP_COLORS.length];
          return (
            <div key={g.id} className={styles.row}>
              <div className={styles.colRank}>
                <span className={styles.rankNum} style={medal ? { color: medal.num } : undefined}>
                  {rank <= 3 ? TROPHY[rank] : rank}
                </span>
              </div>
              <div className={styles.colName}>
                <Initials name={g.name} size={38} color={gc + '33'} />
                <span className={styles.nameText}>{g.name}</span>
              </div>
              <div className={styles.colStats}>
                <span className={styles.xpText}>{g.totalScore.toLocaleString()} pts</span>
              </div>
            </div>
          );
        })}
        {groups.length === 0 && (
          <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '32px 0', fontSize: '0.9rem' }}>
            No hay grupos registrados.
          </p>
        )}
      </div>
    </>
  );
}
