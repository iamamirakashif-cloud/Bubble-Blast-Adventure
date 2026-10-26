import { Bubble, BubbleColor, LevelConfig, SpecialBubbleType, WorldTheme } from './types.ts';
import { GRID_COLS, getRowCols } from './grid.ts';

export const WORLDS: WorldTheme[] = [
  {
    id: 1,
    name: 'Magical Bubble Garden',
    subtitle: 'Levels 1 – 10 · The Adventure Begins',
    bgGradient: ['#064e3b', '#0f766e', '#134e4a'],
    accentColor: '#10b981',
    particleType: 'leaf',
    wallColor: '#059669',
  },
  {
    id: 2,
    name: 'Candy Cloud Kingdom',
    subtitle: 'Levels 11 – 20 · Sweet Confections',
    bgGradient: ['#831843', '#be185d', '#701a75'],
    accentColor: '#f472b6',
    particleType: 'candy',
    wallColor: '#db2777',
  },
  {
    id: 3,
    name: 'Frozen Crystal Valley',
    subtitle: 'Levels 21 – 30 · Shimmering Ice & Frost',
    bgGradient: ['#082f49', '#0369a1', '#075985'],
    accentColor: '#38bdf8',
    particleType: 'snow',
    wallColor: '#0284c7',
  },
  {
    id: 4,
    name: 'Deep Ocean Adventure',
    subtitle: 'Levels 31 – 40 · Bioluminescent Depths',
    bgGradient: ['#0f172a', '#1e3a8a', '#172554'],
    accentColor: '#60a5fa',
    particleType: 'bubble',
    wallColor: '#2563eb',
  },
  {
    id: 5,
    name: 'Space Bubble Station',
    subtitle: 'Levels 41 – 50 · Cosmic Starlight',
    bgGradient: ['#1e1b4b', '#312e81', '#2e1065'],
    accentColor: '#a855f7',
    particleType: 'star',
    wallColor: '#7c3aed',
  },
  {
    id: 6,
    name: 'Volcano of Fire',
    subtitle: 'Levels 51 – 60 · Molten Magma Sparks',
    bgGradient: ['#450a0a', '#7f1d1d', '#991b1b'],
    accentColor: '#f97316',
    particleType: 'ember',
    wallColor: '#ea580c',
  },
  {
    id: 7,
    name: 'Enchanted Forest',
    subtitle: 'Levels 61 – 70 · Twilight Whispers & Runes',
    bgGradient: ['#14532d', '#166534', '#064e3b'],
    accentColor: '#4ade80',
    particleType: 'firefly',
    wallColor: '#22c55e',
  },
  {
    id: 8,
    name: 'Rainbow Sky Kingdom',
    subtitle: 'Levels 71 – 80 · Prismatic Cloud Castles',
    bgGradient: ['#3b0764', '#581c87', '#1e1b4b'],
    accentColor: '#fbbf24',
    particleType: 'rainbow',
    wallColor: '#d97706',
  },
  {
    id: 9,
    name: 'Neon Galaxy',
    subtitle: 'Levels 81 – 90 · Cyberpulse Luminescence',
    bgGradient: ['#050515', '#0f172a', '#180d2b'],
    accentColor: '#22d3ee',
    particleType: 'neon',
    wallColor: '#06b6d4',
  },
  {
    id: 10,
    name: 'Legendary Crystal Palace',
    subtitle: 'Levels 91 – 100 · The Master Trials',
    bgGradient: ['#2e1065', '#4c1d95', '#3b0764'],
    accentColor: '#f43f5e',
    particleType: 'gem',
    wallColor: '#e11d48',
  },
];

const ALL_COLORS: BubbleColor[] = ['blue', 'red', 'yellow', 'green', 'purple', 'orange', 'pink'];

/**
 * Deterministic pseudo-random generator for level layout reproducibility
 */
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

export function generateLevel(levelId: number): LevelConfig {
  const clampedId = Math.max(1, Math.min(100, levelId));
  const worldIndex = Math.floor((clampedId - 1) / 10);
  const theme = WORLDS[worldIndex] || WORLDS[0];
  const worldLevel = ((clampedId - 1) % 10) + 1; // 1 to 10 within world
  const rand = seededRandom(levelId * 7919 + 104729);

  // Difficulty scaling: colors available
  let numColors = 3;
  if (clampedId > 10) numColors = 4;
  if (clampedId > 25) numColors = 5;
  if (clampedId > 50) numColors = 6;
  if (clampedId > 80) numColors = 7;
  const availableColors = ALL_COLORS.slice(0, numColors);

  // Rows of bubbles
  let initialRows = 5;
  if (clampedId > 15) initialRows = 6;
  if (clampedId > 40) initialRows = 7;
  if (clampedId > 70) initialRows = 8;

  // Objective determination:
  // Every 3rd level has a "collectStars" objective
  // Every 5th level has a "reachScore" objective
  // Others are "clearAll"
  let objectiveType: 'clearAll' | 'collectStars' | 'reachScore' = 'clearAll';
  let targetCount: number | undefined = undefined;
  let description = 'Pop all the hanging bubbles!';

  if (clampedId % 3 === 0) {
    objectiveType = 'collectStars';
    targetCount = Math.min(6, 2 + Math.floor(clampedId / 20));
    description = `Free and collect ${targetCount} Star Bubbles!`;
  } else if (clampedId % 5 === 0) {
    objectiveType = 'reachScore';
    targetCount = 2000 + clampedId * 250;
    description = `Reach ${targetCount.toLocaleString()} points!`;
  }

  // Base shots available
  let maxShots = 28 - Math.floor(worldLevel * 0.7);
  if (clampedId > 50) maxShots = Math.max(18, 26 - Math.floor(worldLevel * 0.9));
  if (objectiveType === 'reachScore') maxShots += 6;

  // Construct initial grid
  const initialGrid: (Bubble | null)[][] = [];
  let starsPlaced = 0;
  const starsToPlace = objectiveType === 'collectStars' ? (targetCount || 3) : 0;

  for (let r = 0; r < initialRows; r++) {
    const rowList: (Bubble | null)[] = [];
    const cols = getRowCols(r, GRID_COLS);

    for (let c = 0; c < cols; c++) {
      // Shape patterns based on world & level:
      // In higher levels, create interesting holes, diamonds, shields
      let shouldPlaceBubble = true;
      if (worldLevel === 3 && (c === 0 || c === cols - 1) && r > 2) shouldPlaceBubble = false;
      if (worldLevel === 6 && r === 2 && (c === 2 || c === 3)) shouldPlaceBubble = false;
      if (worldLevel === 8 && r % 2 === 1 && (c === 1 || c === cols - 2)) shouldPlaceBubble = false;

      if (!shouldPlaceBubble) {
        rowList.push(null);
        continue;
      }

      // Pick color with pattern cohesion (connected adjacent clusters)
      const color = availableColors[Math.floor(rand() * availableColors.length)];
      let type: SpecialBubbleType = 'none';

      // Special bubble assignment
      const roll = rand();
      if (starsPlaced < starsToPlace && (r >= 2 || (r === initialRows - 1 && rand() > 0.4))) {
        type = 'star';
        starsPlaced++;
      } else if (clampedId >= 8 && roll < 0.05) {
        type = 'bomb';
      } else if (clampedId >= 15 && roll >= 0.05 && roll < 0.09) {
        type = 'rainbow';
      } else if (clampedId >= 25 && roll >= 0.09 && roll < 0.13) {
        type = 'ice';
      } else if (clampedId >= 35 && roll >= 0.13 && roll < 0.16) {
        type = 'lightning';
      } else if (clampedId >= 45 && roll >= 0.16 && roll < 0.19) {
        type = 'stone';
      } else if (clampedId >= 12 && roll >= 0.19 && roll < 0.23) {
        type = 'golden';
      } else if (clampedId >= 60 && roll >= 0.23 && roll < 0.26) {
        type = 'fire';
      }

      rowList.push({
        id: `b_${r}_${c}_${levelId}`,
        row: r,
        col: c,
        color,
        type,
        hp: type === 'ice' ? 2 : 1,
      });
    }
    initialGrid.push(rowList);
  }

  // Target score & Star thresholds
  const targetScore = 1500 + clampedId * 150;
  const starScores: [number, number, number] = [
    Math.round(targetScore * 0.45),
    Math.round(targetScore * 0.8),
    Math.round(targetScore * 1.25),
  ];

  return {
    id: clampedId,
    worldId: theme.id,
    worldName: theme.name,
    theme,
    rows: initialRows,
    cols: GRID_COLS,
    maxShots,
    targetScore,
    starScores,
    objective: {
      type: objectiveType,
      targetCount,
      currentCount: 0,
      description,
    },
    availableColors,
    initialGrid,
  };
}

export const TOTAL_LEVELS = 100;
