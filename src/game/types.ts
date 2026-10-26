export type BubbleColor = 'blue' | 'red' | 'yellow' | 'green' | 'purple' | 'orange' | 'pink';

export type SpecialBubbleType =
  | 'none'
  | 'rainbow'
  | 'bomb'
  | 'lightning'
  | 'fire'
  | 'ice'
  | 'stone'
  | 'star'
  | 'mystery'
  | 'golden'
  | 'chain';

export interface Bubble {
  id: string;
  row: number;
  col: number;
  color: BubbleColor;
  type: SpecialBubbleType;
  hp?: number; // for ice (e.g. 2 hits)
  isAnchored?: boolean;
}

export interface Projectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: BubbleColor;
  type: SpecialBubbleType;
  active: boolean;
}

export interface DroppingBubble {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: BubbleColor;
  type: SpecialBubbleType;
  rotation: number;
  vRot: number;
  alpha: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  maxLife: number;
  life: number;
  shape?: 'circle' | 'sparkle' | 'star' | 'smoke';
}

export interface FloatingText {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  size: number;
  alpha: number;
  vy: number;
  life: number;
  maxLife: number;
}

export type ObjectiveType = 'clearAll' | 'collectStars' | 'reachScore';

export interface LevelObjective {
  type: ObjectiveType;
  targetCount?: number; // e.g. collect 4 stars
  currentCount?: number;
  description: string;
}

export interface WorldTheme {
  id: number;
  name: string;
  subtitle: string;
  bgGradient: [string, string, string];
  accentColor: string;
  particleType: 'leaf' | 'candy' | 'snow' | 'bubble' | 'star' | 'ember' | 'firefly' | 'rainbow' | 'neon' | 'gem';
  wallColor: string;
}

export interface LevelConfig {
  id: number;
  worldId: number;
  worldName: string;
  theme: WorldTheme;
  rows: number;
  cols: number; // e.g. 8 for even, 7 for odd
  maxShots: number;
  targetScore: number;
  starScores: [number, number, number];
  objective: LevelObjective;
  availableColors: BubbleColor[];
  initialGrid: (Bubble | null)[][];
}

export type BoosterType = 'aimExtender' | 'bomb' | 'rainbow' | 'colorSwap' | 'extraShots';

export interface BoosterInventory {
  aimExtender: number;
  bomb: number;
  rainbow: number;
  colorSwap: number;
  extraShots: number;
}

export interface PlayerProgress {
  unlockedLevel: number;
  levelStars: Record<number, number>; // levelId -> stars (1-3)
  levelScores: Record<number, number>;
  coins: number;
  boosters: BoosterInventory;
  highScore: number;
}
