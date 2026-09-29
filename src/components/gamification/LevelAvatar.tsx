'use client';

import React from 'react';
import styles from './LevelAvatar.module.css';

interface LevelAvatarProps {
  level: number;
  levelName: string;
}

// Colores de glow dependiendo de la fase
const getGlowColor = (level: number) => {
  if (level >= 1 && level <= 4) return 'rgba(255, 152, 0, 0.6)';
  if (level >= 5 && level <= 8) return 'rgba(255, 87, 34, 0.6)';
  if (level >= 9 && level <= 10) return 'rgba(230, 57, 70, 0.7)';
  if (level >= 11 && level <= 14) return 'rgba(255, 215, 0, 0.7)';
  return 'rgba(0, 255, 255, 0.8)';
};

export default function LevelAvatar({ level, levelName }: LevelAvatarProps) {
  const glow = getGlowColor(level);

  // Fallback to highest level image if level > 15
  const imageLevel = Math.min(level, 15);
  const imageUrl = `/mascot/lvl${imageLevel}.jpg`;

  const customStyles = {
    '--glow-color': glow,
    '--icon-color': '#fff',
  } as React.CSSProperties;

  return (
    <div className={styles.avatarContainer} style={customStyles}>
      <div className={styles.bgGlow} />
      
      <div className={styles.avatarImageWrapper}>
        <img src={imageUrl} alt={levelName} className={styles.mascotImage} />
      </div>

      <div className={styles.levelInfo}>
        <div className={styles.levelNumber}>Nivel {level}</div>
        <div className={styles.levelName}>{levelName}</div>
      </div>
    </div>
  );
}
