'use client';

import React from 'react';
import styles from './LevelAvatar.module.css';
import { 
  Sprout, 
  Leaf, 
  TreeDeciduous, 
  Shield, 
  BookOpen, 
  Sword, 
  Flame 
} from 'lucide-react';

interface LevelAvatarProps {
  level: number;
  levelName: string;
}

// Configuración de las "Fases" o "Stages"
const getStageConfig = (level: number) => {
  if (level >= 1 && level <= 4) {
    return {
      stageName: 'Fase de Crecimiento',
      Icon: Sprout,
      color: '#ff9800', // Naranja/Dorado fuego inicial
      glow: 'rgba(255, 152, 0, 0.6)'
    };
  } else if (level >= 5 && level <= 8) {
    return {
      stageName: 'Fase de Fruto',
      Icon: Leaf,
      color: '#ff5722', // Naranja más intenso
      glow: 'rgba(255, 87, 34, 0.6)'
    };
  } else if (level >= 9 && level <= 10) {
    return {
      stageName: 'Roble Ardiente',
      Icon: TreeDeciduous,
      color: '#e63946', // Fuego vivo
      glow: 'rgba(230, 57, 70, 0.7)'
    };
  } else if (level >= 11 && level <= 14) {
    return {
      stageName: 'Madurez Espiritual',
      Icon: Shield,
      color: '#ffd700', // Fuego celestial / dorado brillante
      glow: 'rgba(255, 215, 0, 0.7)'
    };
  } else {
    // Nivel 15: Discípulo
    return {
      stageName: 'Discípulo de Luz',
      Icon: Sword,
      color: '#00ffff', // Fuego azul/blanco espiritual (la Espada)
      glow: 'rgba(0, 255, 255, 0.8)'
    };
  }
};

export default function LevelAvatar({ level, levelName }: LevelAvatarProps) {
  const config = getStageConfig(level);
  const { Icon, color, glow, stageName } = config;

  // Pasamos variables CSS al contenedor para manejar la animación del glow
  const customStyles = {
    '--glow-color': glow,
    '--icon-color': color,
  } as React.CSSProperties;

  return (
    <div className={styles.avatarContainer} style={customStyles}>
      <div className={styles.bgGlow} />
      
      <div className={styles.avatarIconWrapper}>
        <Icon className={styles.icon} strokeWidth={1.5} />
      </div>

      <div className={styles.levelInfo}>
        <div className={styles.levelNumber}>Nivel {level}</div>
        <div className={styles.levelName}>{levelName}</div>
        <div className={styles.stageLabel} style={{ color, borderColor: glow }}>
          {stageName}
        </div>
      </div>
    </div>
  );
}
