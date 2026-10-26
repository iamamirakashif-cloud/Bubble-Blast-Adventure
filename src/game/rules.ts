import { LevelConfig, LevelObjective } from './types.ts';

export interface ScoreBreakdown {
  matchPoints: number;
  dropPoints: number;
  bonusPoints: number;
  total: number;
  coinsEarned: number;
}

export function calculateMatchScore(poppedCount: number, comboMultiplier = 1): number {
  if (poppedCount < 3) return 0;
  // Base 10 pts per bubble, scaled with cluster size and combo
  const basePoints = poppedCount * 10;
  const sizeMultiplier = 1 + (poppedCount - 3) * 0.5;
  return Math.round(basePoints * sizeMultiplier * comboMultiplier);
}

export function calculateDropScore(droppedCount: number): number {
  if (droppedCount <= 0) return 0;
  // Disconnected falling bubbles reward bold play!
  // Progressive bonus: 20 pts each + exponential multiplier for huge avalanches
  let total = 0;
  for (let i = 1; i <= droppedCount; i++) {
    total += 20 + i * 10;
  }
  return total;
}

export function calculateRemainingShotsBonus(remainingShots: number): number {
  return remainingShots * 150;
}

export function calculateStarRating(score: number, starScores: [number, number, number]): number {
  if (score >= starScores[2]) return 3;
  if (score >= starScores[1]) return 2;
  if (score >= starScores[0]) return 1;
  return 1; // Stage clear grants at least 1 star
}

export function checkObjectiveComplete(
  objective: LevelObjective,
  remainingBubblesCount: number,
  score: number,
  starsCollected: number
): boolean {
  switch (objective.type) {
    case 'clearAll':
      return remainingBubblesCount === 0;
    case 'collectStars':
      return starsCollected >= (objective.targetCount || 1);
    case 'reachScore':
      return score >= (objective.targetCount || 1000);
    default:
      return remainingBubblesCount === 0;
  }
}

export function checkGameOver(
  remainingShots: number,
  objectiveCompleted: boolean,
  isProjectileActive: boolean
): { isGameOver: boolean; isVictory: boolean } {
  if (isProjectileActive) {
    return { isGameOver: false, isVictory: false };
  }

  if (objectiveCompleted) {
    return { isGameOver: true, isVictory: true };
  }

  if (remainingShots <= 0) {
    return { isGameOver: true, isVictory: false };
  }

  return { isGameOver: false, isVictory: false };
}
