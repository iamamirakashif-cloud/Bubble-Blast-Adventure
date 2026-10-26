/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { TitleScreen } from './components/TitleScreen.tsx';
import { PlayingHUD } from './components/PlayingHUD.tsx';
import { VictoryModal } from './components/VictoryModal.tsx';
import { GameOverModal } from './components/GameOverModal.tsx';
import { PauseModal } from './components/PauseModal.tsx';
import { LevelSelectModal } from './components/LevelSelectModal.tsx';
import { HelpModal } from './components/HelpModal.tsx';
import {
  Bubble,
  BubbleColor,
  BoosterType,
  DroppingBubble,
  FloatingText,
  LevelConfig,
  Particle,
  PlayerProgress,
  Projectile,
  SpecialBubbleType,
} from './game/types.ts';
import {
  calculateTrajectory,
  findBestSnapCell,
  findFloatingBubbles,
  findMatchingCluster,
  getBombExplosionCells,
  getBubbleCenter,
  getLightningCells,
  getNeighbors,
  getRowCols,
  GRID_COLS,
  MAX_GRID_ROWS,
  TrajectoryPoint,
} from './game/grid.ts';
import { generateLevel, TOTAL_LEVELS } from './game/levels.ts';
import {
  calculateDropScore,
  calculateMatchScore,
  calculateRemainingShotsBonus,
  calculateStarRating,
  checkGameOver,
  checkObjectiveComplete,
} from './game/rules.ts';
import { GameRenderer } from './game/renderer.ts';
import { sounds } from './game/audio.ts';

type GameState = 'title' | 'playing' | 'paused' | 'victory' | 'gameover';

const INITIAL_PROGRESS: PlayerProgress = {
  unlockedLevel: 1,
  levelStars: {},
  levelScores: {},
  coins: 100,
  boosters: {
    aimExtender: 3,
    bomb: 2,
    rainbow: 2,
    colorSwap: 5,
    extraShots: 3,
  },
  highScore: 0,
};

export default function App() {
  const [gameState, setGameState] = useState<GameState>('title');
  const [currentLevelId, setCurrentLevelId] = useState<number>(1);
  const [levelConfig, setLevelConfig] = useState<LevelConfig>(() => generateLevel(1));
  const [score, setScore] = useState<number>(0);
  const [remainingShots, setRemainingShots] = useState<number>(25);
  const [starsCollected, setStarsCollected] = useState<number>(0);
  const [remainingBubblesCount, setRemainingBubblesCount] = useState<number>(0);
  const [activeBooster, setActiveBooster] = useState<BoosterType | null>(null);
  const [isLevelMapOpen, setIsLevelMapOpen] = useState<boolean>(false);
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(() => sounds.getMuted());

  // Player persistent progress
  const [progress, setProgress] = useState<PlayerProgress>(() => {
    try {
      const saved = localStorage.getItem('bba_progress_v1');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return INITIAL_PROGRESS;
  });

  const saveProgress = useCallback((newProgress: PlayerProgress) => {
    setProgress(newProgress);
    try {
      localStorage.setItem('bba_progress_v1', JSON.stringify(newProgress));
    } catch {
      // fallback
    }
  }, []);

  // Sync document.body.dataset.state for ultra-mode and accessibility
  useEffect(() => {
    document.body.dataset.state = gameState;
  }, [gameState]);

  // Autostart URL support (?autostart=1)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') {
      startLevel(1);
    }
  }, []);

  // Keyboard navigation for Title (Enter/Space to start) and Playing (Escape/P to pause)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState === 'title' && (e.code === 'Space' || e.code === 'Enter')) {
        e.preventDefault();
        startLevel(progress.unlockedLevel);
      } else if (gameState === 'playing' && (e.code === 'Escape' || e.code === 'KeyP')) {
        e.preventDefault();
        setGameState('paused');
      } else if (gameState === 'paused' && (e.code === 'Escape' || e.code === 'KeyP')) {
        e.preventDefault();
        setGameState('playing');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, progress.unlockedLevel]);

  // Canvas and Game Loop references
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const gridRef = useRef<(Bubble | null)[][]>([]);
  const projectileRef = useRef<Projectile | null>(null);
  const currentBubbleRef = useRef<{ color: BubbleColor; type: SpecialBubbleType }>({
    color: 'blue',
    type: 'none',
  });
  const nextBubbleRef = useRef<{ color: BubbleColor; type: SpecialBubbleType }>({
    color: 'red',
    type: 'none',
  });
  const aimAngleRef = useRef<number>(-Math.PI / 2); // aiming straight up by default
  const isAimingRef = useRef<boolean>(false);
  const comboStreakRef = useRef<number>(1);
  const particlesRef = useRef<Particle[]>([]);
  const droppingBubblesRef = useRef<DroppingBubble[]>([]);
  const floatingTextsRef = useRef<FloatingText[]>([]);
  const ambientParticlesRef = useRef<Particle[]>([]);
  const screenShakeRef = useRef<{ trauma: number }>({ trauma: 0 });

  // Geometry dimensions
  const dimsRef = useRef({
    width: 480,
    height: 720,
    playWidth: 420,
    leftWall: 30,
    rightWall: 450,
    ceilingY: 70,
    bubbleRadius: 26,
    launcherX: 240,
    launcherY: 640,
  });

  // Helper: Count remaining bubbles
  const countBubbles = (grid: (Bubble | null)[][]): number => {
    let count = 0;
    for (const row of grid) {
      if (!row) continue;
      for (const b of row) {
        if (b) count++;
      }
    }
    return count;
  };

  // Helper: Pick random bubble color from available level colors
  const getRandomLevelBubble = useCallback((level: LevelConfig): { color: BubbleColor; type: SpecialBubbleType } => {
    // Collect active colors in grid to ensure playable shots
    const activeColors = new Set<BubbleColor>();
    for (const row of gridRef.current) {
      if (!row) continue;
      for (const b of row) {
        if (b && b.type !== 'stone') activeColors.add(b.color);
      }
    }
    const colorPool = activeColors.size > 0 ? Array.from(activeColors) : level.availableColors;
    const color = colorPool[Math.floor(Math.random() * colorPool.length)] || level.availableColors[0];
    return { color, type: 'none' };
  }, []);

  // Start or restart a level
  const startLevel = useCallback((lvlId = 1) => {
    const config = generateLevel(lvlId);
    setCurrentLevelId(lvlId);
    setLevelConfig(config);
    setScore(0);
    setRemainingShots(config.maxShots);
    setStarsCollected(0);
    setActiveBooster(null);

    // Deep copy initial grid
    const freshGrid: (Bubble | null)[][] = config.initialGrid.map(row =>
      row.map(cell => (cell ? { ...cell } : null))
    );
    gridRef.current = freshGrid;
    setRemainingBubblesCount(countBubbles(freshGrid));

    // Reset shots
    projectileRef.current = null;
    currentBubbleRef.current = getRandomLevelBubble(config);
    nextBubbleRef.current = getRandomLevelBubble(config);
    aimAngleRef.current = -Math.PI / 2;
    comboStreakRef.current = 1;
    particlesRef.current = [];
    droppingBubblesRef.current = [];
    floatingTextsRef.current = [];

    // Ambient particles init
    const ambients: Particle[] = [];
    for (let i = 0; i < 25; i++) {
      ambients.push({
        x: Math.random() * 480,
        y: Math.random() * 720,
        vx: (Math.random() - 0.5) * 0.4,
        vy: -0.2 - Math.random() * 0.5,
        size: 1.5 + Math.random() * 3,
        color: config.theme.accentColor,
        alpha: 0.15 + Math.random() * 0.4,
        life: 0,
        maxLife: 100,
      });
    }
    ambientParticlesRef.current = ambients;

    setGameState('playing');
    sounds.playClick();
  }, [getRandomLevelBubble]);

  // Swap loaded bubble with preview bubble
  const handleSwapBubble = useCallback(() => {
    if (projectileRef.current?.active) return;
    const temp = { ...currentBubbleRef.current };
    currentBubbleRef.current = { ...nextBubbleRef.current };
    nextBubbleRef.current = temp;
    sounds.playBounce();
  }, []);

  // Activate power-up booster
  const handleActivateBooster = useCallback((booster: BoosterType) => {
    if (projectileRef.current?.active) return;
    if (activeBooster === booster) {
      // Toggle off
      setActiveBooster(null);
      return;
    }

    if (booster === 'bomb') {
      currentBubbleRef.current.type = 'bomb';
      setActiveBooster('bomb');
      sounds.playClick();
    } else if (booster === 'rainbow') {
      currentBubbleRef.current.type = 'rainbow';
      setActiveBooster('rainbow');
      sounds.playClick();
    } else if (booster === 'aimExtender') {
      setActiveBooster('aimExtender');
      sounds.playClick();
    }
  }, [activeBooster]);

  // Trigger floating popup score text
  const addFloatingText = (text: string, x: number, y: number, color = '#fde047', size = 20) => {
    floatingTextsRef.current.push({
      id: Math.random().toString(),
      text,
      x,
      y,
      color,
      size,
      alpha: 1,
      vy: -1.8,
      life: 0,
      maxLife: 45,
    });
  };

  // Burst particle effect
  const addBubblePopParticles = (x: number, y: number, color: BubbleColor, count = 12) => {
    const palette = ['#ffffff', '#bae6fd', '#38bdf8', '#0284c7'];
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
      const speed = 2.5 + Math.random() * 4.5;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2.5 + Math.random() * 3.5,
        color: palette[Math.floor(Math.random() * palette.length)],
        alpha: 1,
        life: 0,
        maxLife: 25 + Math.random() * 15,
        shape: Math.random() > 0.5 ? 'sparkle' : 'circle',
      });
    }
  };

  // Bomb explosion blast shockwave
  const addExplosionParticles = (x: number, y: number) => {
    screenShakeRef.current.trauma = 0.8;
    for (let i = 0; i < 35; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 3 + Math.random() * 8;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3 + Math.random() * 6,
        color: Math.random() > 0.4 ? '#f97316' : '#ef4444',
        alpha: 1,
        life: 0,
        maxLife: 35,
        shape: 'circle',
      });
    }
  };

  // Fire current bubble
  const shootCurrentBubble = useCallback(() => {
    if (projectileRef.current?.active || gameState !== 'playing') return;

    const dims = dimsRef.current;
    const angle = aimAngleRef.current;
    const speed = 19; // fast, responsive projectile

    projectileRef.current = {
      x: dims.launcherX,
      y: dims.launcherY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: dims.bubbleRadius,
      color: currentBubbleRef.current.color,
      type: currentBubbleRef.current.type,
      active: true,
    };

    sounds.playShoot();

    // Advance loaded bubble
    currentBubbleRef.current = { ...nextBubbleRef.current };
    nextBubbleRef.current = getRandomLevelBubble(levelConfig);
    setActiveBooster(null);
  }, [gameState, levelConfig, getRandomLevelBubble]);

  // Main Canvas & Simulation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    const renderer = new GameRenderer(ctx, dimsRef.current.width, dimsRef.current.height);

    // Responsive Canvas Resizing
    const handleResize = () => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const w = rect.width;
      const h = rect.height;
      const playWidth = Math.min(w - 20, 480);
      const leftWall = (w - playWidth) / 2;
      const rightWall = leftWall + playWidth;
      const bubbleRadius = playWidth / (GRID_COLS * 2);
      const ceilingY = 84;
      const launcherX = w / 2;
      const launcherY = h - 92;

      dimsRef.current = {
        width: w,
        height: h,
        playWidth,
        leftWall,
        rightWall,
        ceilingY,
        bubbleRadius,
        launcherX,
        launcherY,
      };

      renderer.setDimensions(w, h);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    // Main animation loop
    let lastTime = performance.now();
    const gameLoop = (currentTime: number) => {
      const dt = Math.min((currentTime - lastTime) / 1000, 0.05);
      lastTime = currentTime;
      const dims = dimsRef.current;

      // Screen shake decay
      let shakeOffsetX = 0;
      let shakeOffsetY = 0;
      if (screenShakeRef.current.trauma > 0) {
        const shake = screenShakeRef.current.trauma * screenShakeRef.current.trauma * 12;
        shakeOffsetX = (Math.random() * 2 - 1) * shake;
        shakeOffsetY = (Math.random() * 2 - 1) * shake;
        screenShakeRef.current.trauma = Math.max(0, screenShakeRef.current.trauma - dt * 2.5);
      }

      ctx.save();
      ctx.translate(shakeOffsetX, shakeOffsetY);

      // 1. Draw Background & Ambient Atmosphere
      renderer.drawBackground(levelConfig.theme, currentTime * 0.001, ambientParticlesRef.current);

      // Update ambient particles
      for (const p of ambientParticlesRef.current) {
        p.y += p.vy;
        p.x += p.vx;
        if (p.y < 0) p.y = dims.height;
        if (p.x < 0) p.x = dims.width;
        if (p.x > dims.width) p.x = 0;
      }

      // 2. Draw Arena Borders
      renderer.drawArenaBorders(dims.leftWall, dims.rightWall, dims.ceilingY, levelConfig.theme);

      // 3. Draw Stationary Grid Bubbles
      renderer.drawGrid(gridRef.current, dims.bubbleRadius, dims.leftWall, dims.ceilingY);

      // 4. Update and Draw Projectile
      const proj = projectileRef.current;
      if (proj && proj.active) {
        proj.x += proj.vx;
        proj.y += proj.vy;

        // Wall collisions
        const minX = dims.leftWall + proj.radius;
        const maxX = dims.rightWall - proj.radius;
        if (proj.x <= minX) {
          proj.x = minX;
          proj.vx = -proj.vx;
          sounds.playBounce();
        } else if (proj.x >= maxX) {
          proj.x = maxX;
          proj.vx = -proj.vx;
          sounds.playBounce();
        }

        // Collision with ceiling or existing bubbles
        let hit = false;
        let snapCell: { row: number; col: number } | null = null;

        // Ceiling collision
        if (proj.y - proj.radius <= dims.ceilingY) {
          hit = true;
          snapCell = findBestSnapCell(
            proj.x,
            dims.ceilingY + proj.radius,
            gridRef.current,
            proj.radius,
            dims.leftWall,
            dims.ceilingY
          );
        } else {
          // Bubble collision check
          for (let r = 0; r < gridRef.current.length; r++) {
            const row = gridRef.current[r];
            if (!row) continue;
            const cols = getRowCols(r, GRID_COLS);
            for (let c = 0; c < cols; c++) {
              const b = row[c];
              if (b) {
                const bPos = getBubbleCenter(r, c, proj.radius, dims.leftWall, dims.ceilingY);
                const distSq = (proj.x - bPos.x) ** 2 + (proj.y - bPos.y) ** 2;
                if (distSq <= (proj.radius * 1.95) ** 2) {
                  hit = true;
                  snapCell = findBestSnapCell(
                    proj.x,
                    proj.y,
                    gridRef.current,
                    proj.radius,
                    dims.leftWall,
                    dims.ceilingY
                  );
                  break;
                }
              }
            }
            if (hit) break;
          }
        }

        if (hit && snapCell) {
          // Attach projectile to grid cell
          proj.active = false;
          const { row, col } = snapCell;

          // Ensure row exists in grid
          while (gridRef.current.length <= row) {
            gridRef.current.push([]);
          }

          const newBubble: Bubble = {
            id: `b_${row}_${col}_${Date.now()}`,
            row,
            col,
            color: proj.color,
            type: proj.type,
          };
          gridRef.current[row][col] = newBubble;

          // Process bubble hit & mechanics
          let matchedCells: Array<{ row: number; col: number }> = [];

          if (proj.type === 'bomb') {
            // Bomb explosion
            matchedCells = getBombExplosionCells(row, col, gridRef.current);
            const pos = getBubbleCenter(row, col, proj.radius, dims.leftWall, dims.ceilingY);
            addExplosionParticles(pos.x, pos.y);
            sounds.playExplosion();
          } else if (proj.type === 'lightning') {
            // Lightning zap entire row
            matchedCells = getLightningCells(row, gridRef.current);
            sounds.playLightning();
          } else {
            // Normal / Rainbow match 3+
            matchedCells = findMatchingCluster(row, col, gridRef.current);
          }

          if (matchedCells.length >= (proj.type === 'none' ? 3 : 1)) {
            // Pop matched bubbles
            let matchScore = 0;
            let starsPopped = 0;
            let coinsPopped = 0;

            for (const cell of matchedCells) {
              const b = gridRef.current[cell.row]?.[cell.col];
              if (b) {
                const pos = getBubbleCenter(cell.row, cell.col, proj.radius, dims.leftWall, dims.ceilingY);
                addBubblePopParticles(pos.x, pos.y, b.color, 12);
                if (b.type === 'star') starsPopped++;
                if (b.type === 'golden') coinsPopped += 50;
                gridRef.current[cell.row][cell.col] = null;
              }
            }

            matchScore = calculateMatchScore(matchedCells.length, comboStreakRef.current);
            comboStreakRef.current += 1;
            sounds.playPop(comboStreakRef.current);

            const hitPos = getBubbleCenter(row, col, proj.radius, dims.leftWall, dims.ceilingY);
            addFloatingText(`+${matchScore}`, hitPos.x, hitPos.y - 10, '#fde047', 22);

            if (starsPopped > 0) {
              sounds.playStarCollect();
              setStarsCollected(prev => prev + starsPopped);
              addFloatingText(`+${starsPopped} STAR!`, hitPos.x, hitPos.y - 30, '#38bdf8', 24);
            }

            if (coinsPopped > 0) {
              sounds.playCoin();
              addFloatingText(`+${coinsPopped} COINS!`, hitPos.x, hitPos.y - 45, '#fbbf24', 22);
            }

            // Check for floating / disconnected bubbles to drop!
            const floating = findFloatingBubbles(gridRef.current);
            if (floating.length > 0) {
              const dropScore = calculateDropScore(floating.length);
              sounds.playDrop(floating.length);

              for (const f of floating) {
                const b = gridRef.current[f.row]?.[f.col];
                if (b) {
                  const bPos = getBubbleCenter(f.row, f.col, proj.radius, dims.leftWall, dims.ceilingY);
                  if (b.type === 'star') starsPopped++;
                  if (b.type === 'golden') coinsPopped += 50;

                  droppingBubblesRef.current.push({
                    id: b.id,
                    x: bPos.x,
                    y: bPos.y,
                    vx: (Math.random() - 0.5) * 5,
                    vy: 2 + Math.random() * 3,
                    radius: proj.radius,
                    color: b.color,
                    type: b.type,
                    rotation: 0,
                    vRot: (Math.random() - 0.5) * 0.2,
                    alpha: 1,
                  });
                  gridRef.current[f.row][f.col] = null;
                }
              }

              addFloatingText(`AVALANCHE +${dropScore}`, hitPos.x, hitPos.y - 50, '#34d399', 24);
              matchScore += dropScore;
            }

            setScore(prev => prev + matchScore);
          } else {
            // No match
            comboStreakRef.current = 1;
          }

          // Decrement shots
          setRemainingShots(prev => {
            const nextShots = Math.max(0, prev - 1);
            return nextShots;
          });

          // Update remaining bubbles count
          const currentCount = countBubbles(gridRef.current);
          setRemainingBubblesCount(currentCount);

          // Check Win/Loss states
          setTimeout(() => {
            const isWon = checkObjectiveComplete(
              levelConfig.objective,
              currentCount,
              score,
              starsCollected
            );

            if (isWon) {
              sounds.playVictory();
              // Calculate star rating and save progress
              const stars = calculateStarRating(score, levelConfig.starScores);
              const remainingShotsBonus = calculateRemainingShotsBonus(remainingShots);
              const earnedCoins = 30 + stars * 15;

              saveProgress({
                ...progress,
                unlockedLevel: Math.max(progress.unlockedLevel, Math.min(TOTAL_LEVELS, currentLevelId + 1)),
                levelStars: {
                  ...progress.levelStars,
                  [currentLevelId]: Math.max(progress.levelStars[currentLevelId] || 0, stars),
                },
                levelScores: {
                  ...progress.levelScores,
                  [currentLevelId]: Math.max(progress.levelScores[currentLevelId] || 0, score + remainingShotsBonus),
                },
                coins: progress.coins + earnedCoins,
                highScore: Math.max(progress.highScore, score + remainingShotsBonus),
              });

              setGameState('victory');
            } else if (remainingShots <= 1) {
              sounds.playDefeat();
              setGameState('gameover');
            }
          }, 300);
        }

        // Draw projectile in flight
        renderer.drawBubble(proj.x, proj.y, proj.radius, proj.color, proj.type);
      }

      // 5. Draw Dropping Bubbles
      for (let i = droppingBubblesRef.current.length - 1; i >= 0; i--) {
        const b = droppingBubblesRef.current[i];
        b.x += b.vx;
        b.y += b.vy;
        b.vy += 0.45; // gravity
        b.rotation += b.vRot;
        if (b.y > dims.height + 60) {
          droppingBubblesRef.current.splice(i, 1);
        }
      }
      renderer.drawDroppingBubbles(droppingBubblesRef.current);

      // 6. Draw Trajectory Guideline when aiming
      if (isAimingRef.current && (!proj || !proj.active)) {
        const maxBounces = activeBooster === 'aimExtender' ? 3 : 1;
        const traj = calculateTrajectory(
          dims.launcherX,
          dims.launcherY,
          aimAngleRef.current,
          dims.bubbleRadius,
          dims.leftWall,
          dims.rightWall,
          dims.ceilingY,
          gridRef.current,
          dims.leftWall,
          dims.ceilingY,
          maxBounces
        );
        renderer.drawTrajectory(
          traj.points,
          traj.hitCell,
          currentBubbleRef.current.color,
          currentBubbleRef.current.type,
          dims.bubbleRadius,
          dims.leftWall,
          dims.ceilingY,
          currentTime * 0.001
        );
      }

      // 7. Draw Launcher & Loaded Bubble
      renderer.drawLauncher(
        dims.launcherX,
        dims.launcherY,
        aimAngleRef.current,
        currentBubbleRef.current.color,
        currentBubbleRef.current.type,
        nextBubbleRef.current.color,
        nextBubbleRef.current.type,
        dims.bubbleRadius
      );

      // 8. Update and Draw Particles
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life += 1;
        p.alpha = Math.max(0, 1 - p.life / p.maxLife);
        if (p.life >= p.maxLife) {
          particlesRef.current.splice(i, 1);
        }
      }
      renderer.drawParticles(particlesRef.current);

      // 9. Update and Draw Floating Texts
      for (let i = floatingTextsRef.current.length - 1; i >= 0; i--) {
        const t = floatingTextsRef.current[i];
        t.y += t.vy;
        t.life += 1;
        t.alpha = Math.max(0, 1 - t.life / t.maxLife);
        if (t.life >= t.maxLife) {
          floatingTextsRef.current.splice(i, 1);
        }
      }
      renderer.drawFloatingTexts(floatingTextsRef.current);

      ctx.restore();

      animationFrameId = requestAnimationFrame(gameLoop);
    };

    animationFrameId = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [gameState, levelConfig, currentLevelId, score, remainingShots, starsCollected, activeBooster, progress, saveProgress]);

  // Touch and Mouse Aiming Handlers
  const updateAimAngleFromPointer = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const px = clientX - rect.left;
    const py = clientY - rect.top;
    const dims = dimsRef.current;

    const dx = px - dims.launcherX;
    const dy = py - dims.launcherY;

    // Only allow upward aiming (angles between -170 deg and -10 deg)
    let angle = Math.atan2(dy, dx);
    const minAngle = -Math.PI * 0.94; // approx -170 deg
    const maxAngle = -Math.PI * 0.06; // approx -10 deg

    if (angle > 0) {
      angle = dx < 0 ? minAngle : maxAngle;
    } else {
      angle = Math.max(minAngle, Math.min(maxAngle, angle));
    }

    aimAngleRef.current = angle;
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (gameState !== 'playing') return;
    isAimingRef.current = true;
    updateAimAngleFromPointer(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (gameState !== 'playing') return;
    if (isAimingRef.current || e.pointerType === 'mouse') {
      updateAimAngleFromPointer(e.clientX, e.clientY);
    }
  };

  const handlePointerUp = () => {
    if (gameState !== 'playing') return;
    if (isAimingRef.current) {
      isAimingRef.current = false;
      shootCurrentBubble();
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 flex items-center justify-center select-none font-sans">
      {/* Desktop Left Side Panel: World & Mission Details */}
      <div className="hidden lg:flex flex-col justify-between w-64 h-[720px] p-5 mr-4 bg-slate-900/60 border border-slate-800/80 rounded-3xl backdrop-blur-md shadow-2xl text-white">
        <div>
          <div className="text-[11px] font-extrabold uppercase tracking-widest text-cyan-400">
            WORLD {levelConfig.worldId} OF 10
          </div>
          <h3 className="text-xl font-black text-white mt-0.5">{levelConfig.theme.name}</h3>
          <p className="text-xs text-slate-400 mt-1">{levelConfig.theme.subtitle}</p>

          <div className="mt-6 bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300">STAGE MISSION</span>
            <p className="text-xs font-semibold text-slate-200 mt-1">
              {levelConfig.objective.description}
            </p>
          </div>

          <div className="mt-4 bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">STAR TARGETS</span>
            <div className="flex flex-col gap-1.5 mt-2 text-xs">
              <div className="flex justify-between items-center text-slate-300">
                <span className="flex items-center gap-1 text-amber-400">
                  ★ 1 Star
                </span>
                <span className="font-mono">{levelConfig.starScores[0].toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span className="flex items-center gap-1 text-amber-400">
                  ★★ 2 Stars
                </span>
                <span className="font-mono">{levelConfig.starScores[1].toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span className="flex items-center gap-1 text-amber-300 font-bold">
                  ★★★ 3 Stars
                </span>
                <span className="font-mono font-bold text-amber-300">{levelConfig.starScores[2].toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="text-[11px] text-slate-400 border-t border-slate-800/80 pt-3">
          Level {currentLevelId} · Bubble Blast Adventure
        </div>
      </div>

      {/* Interactive Main Canvas Arena */}
      <div className="canvas-container relative w-full h-full max-w-[500px] flex items-center justify-center shadow-2xl overflow-hidden border-x border-slate-800/50">
        <canvas
          ref={canvasRef}
          data-testid="game-canvas"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={() => {
            isAimingRef.current = false;
          }}
          className="w-full h-full cursor-crosshair touch-none"
        />

        {/* HUD Overlay when playing */}
        {gameState === 'playing' && (
          <PlayingHUD
            level={levelConfig}
            score={score}
            remainingShots={remainingShots}
            starsCollected={starsCollected}
            remainingBubblesCount={remainingBubblesCount}
            activeBooster={activeBooster}
            progress={progress}
            isMuted={isMuted}
            onPause={() => setGameState('paused')}
            onToggleMute={() => setIsMuted(sounds.toggleMute())}
            onActivateBooster={handleActivateBooster}
            onSwapBubble={handleSwapBubble}
          />
        )}
      </div>

      {/* Desktop Right Side Panel: Controls & Boosters */}
      <div className="hidden lg:flex flex-col justify-between w-64 h-[720px] p-5 ml-4 bg-slate-900/60 border border-slate-800/80 rounded-3xl backdrop-blur-md shadow-2xl text-white">
        <div>
          <div className="text-[11px] font-extrabold uppercase tracking-widest text-emerald-400">
            CONTROLS GUIDE
          </div>
          <h3 className="text-lg font-black text-white mt-0.5">Arcade Mechanics</h3>

          <div className="mt-4 space-y-3 text-xs text-slate-300">
            <div className="flex items-start gap-2 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60">
              <span className="font-bold text-cyan-400">Aim:</span>
              <span>Move mouse or drag finger to aim trajectory.</span>
            </div>
            <div className="flex items-start gap-2 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60">
              <span className="font-bold text-amber-400">Shoot:</span>
              <span>Click or release finger to launch bubble.</span>
            </div>
            <div className="flex items-start gap-2 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60">
              <span className="font-bold text-pink-400">Ricochet:</span>
              <span>Bounce shots off side borders to reach angles.</span>
            </div>
          </div>

          <div className="mt-5 bg-slate-950/70 p-3 rounded-2xl border border-slate-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">SHORTCUTS</span>
            <div className="mt-2 space-y-1.5 text-xs text-slate-300 font-mono">
              <div className="flex justify-between">
                <span>[Esc] or [P]</span>
                <span className="text-slate-400 font-sans">Pause</span>
              </div>
              <div className="flex justify-between">
                <span>[Space]</span>
                <span className="text-slate-400 font-sans">Start/Shoot</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80 flex items-center justify-between text-xs">
          <span className="text-slate-400">Coins:</span>
          <span className="text-amber-400 font-bold font-mono">{progress.coins}</span>
        </div>
      </div>

      {/* Screen & Modal Layers */}
      {gameState === 'title' && (
        <TitleScreen
          progress={progress}
          isMuted={isMuted}
          onStartGame={startLevel}
          onOpenLevelMap={() => setIsLevelMapOpen(true)}
          onOpenHelp={() => setIsHelpOpen(true)}
          onToggleMute={() => setIsMuted(sounds.toggleMute())}
        />
      )}

      {gameState === 'paused' && (
        <PauseModal
          levelId={currentLevelId}
          worldName={levelConfig.theme.name}
          isMuted={isMuted}
          onResume={() => setGameState('playing')}
          onRestart={() => startLevel(currentLevelId)}
          onOpenLevelMap={() => {
            setGameState('title');
            setIsLevelMapOpen(true);
          }}
          onExitTitle={() => setGameState('title')}
          onToggleMute={() => setIsMuted(sounds.toggleMute())}
        />
      )}

      {gameState === 'victory' && (
        <VictoryModal
          level={levelConfig}
          score={score}
          starsEarned={calculateStarRating(score, levelConfig.starScores)}
          remainingShots={remainingShots}
          bonusShotsScore={calculateRemainingShotsBonus(remainingShots)}
          coinsEarned={30 + calculateStarRating(score, levelConfig.starScores) * 15}
          isLastLevel={currentLevelId >= TOTAL_LEVELS}
          onNextLevel={() => startLevel(currentLevelId + 1)}
          onReplay={() => startLevel(currentLevelId)}
          onOpenLevelMap={() => {
            setGameState('title');
            setIsLevelMapOpen(true);
          }}
        />
      )}

      {gameState === 'gameover' && (
        <GameOverModal
          level={levelConfig}
          score={score}
          progress={progress}
          remainingBubblesCount={remainingBubblesCount}
          starsCollected={starsCollected}
          onRetry={() => startLevel(currentLevelId)}
          onAddShots={() => {
            if (progress.coins >= 50) {
              saveProgress({ ...progress, coins: progress.coins - 50 });
              setRemainingShots(prev => prev + 5);
              setGameState('playing');
            }
          }}
          onOpenLevelMap={() => {
            setGameState('title');
            setIsLevelMapOpen(true);
          }}
        />
      )}

      {isLevelMapOpen && (
        <LevelSelectModal
          progress={progress}
          onSelectLevel={lvlId => {
            setIsLevelMapOpen(false);
            startLevel(lvlId);
          }}
          onClose={() => setIsLevelMapOpen(false)}
        />
      )}

      {isHelpOpen && (
        <HelpModal onClose={() => setIsHelpOpen(false)} />
      )}
    </div>
  );
}
