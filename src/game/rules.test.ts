import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getNeighbors,
  getRowCols,
  findMatchingCluster,
  findFloatingBubbles,
  getBombExplosionCells,
  GRID_COLS,
} from './grid.ts';
import {
  calculateMatchScore,
  calculateDropScore,
  calculateStarRating,
  checkObjectiveComplete,
  checkGameOver,
} from './rules.ts';
import { Bubble } from './types.ts';
import { generateLevel } from './levels.ts';

test('hex grid columns alternate between even and odd rows', () => {
  assert.equal(getRowCols(0, GRID_COLS), 8);
  assert.equal(getRowCols(1, GRID_COLS), 7);
  assert.equal(getRowCols(2, GRID_COLS), 8);
  assert.equal(getRowCols(3, GRID_COLS), 7);
});

test('hex neighbors lookup produces valid coordinates for even row', () => {
  const neighbors = getNeighbors(2, 3, 10, 8);
  // (2, 3) is an even row. Deltas: (0, -1), (0, 1), (-1, -1), (-1, 0), (1, -1), (1, 0)
  // Expected: (2,2), (2,4), (1,2), (1,3), (3,2), (3,3)
  assert.equal(neighbors.length, 6);
  assert.deepEqual(neighbors, [
    { row: 2, col: 2 },
    { row: 2, col: 4 },
    { row: 1, col: 2 },
    { row: 1, col: 3 },
    { row: 3, col: 2 },
    { row: 3, col: 3 },
  ]);
});

test('hex neighbors lookup handles boundary clipping cleanly', () => {
  const ceilingCorner = getNeighbors(0, 0, 10, 8);
  // Row 0 has no row -1, and col 0 has no col -1
  // Valid neighbors: (0, 1), (1, 0)
  assert.equal(ceilingCorner.length, 2);
  assert.deepEqual(ceilingCorner, [
    { row: 0, col: 1 },
    { row: 1, col: 0 },
  ]);
});

test('cluster matching identifies groups of 3+ connected identical colors', () => {
  // Create a 3x8 mock grid with 3 connected blue bubbles
  const grid: (Bubble | null)[][] = [
    [
      { id: '1', row: 0, col: 0, color: 'blue', type: 'none' },
      { id: '2', row: 0, col: 1, color: 'blue', type: 'none' },
      { id: '3', row: 0, col: 2, color: 'red', type: 'none' },
      null, null, null, null, null
    ],
    [
      { id: '4', row: 1, col: 0, color: 'blue', type: 'none' }, // connected to (0,0) and (0,1)
      { id: '5', row: 1, col: 1, color: 'yellow', type: 'none' },
      null, null, null, null, null
    ],
  ];

  const cluster = findMatchingCluster(0, 0, grid, 8);
  assert.equal(cluster.length, 3);
  assert.ok(cluster.some(c => c.row === 0 && c.col === 0));
  assert.ok(cluster.some(c => c.row === 0 && c.col === 1));
  assert.ok(cluster.some(c => c.row === 1 && c.col === 0));
});

test('cluster matching includes Rainbow bubble as wild card', () => {
  const grid: (Bubble | null)[][] = [
    [
      { id: '1', row: 0, col: 0, color: 'red', type: 'none' },
      { id: '2', row: 0, col: 1, color: 'blue', type: 'rainbow' },
      { id: '3', row: 0, col: 2, color: 'red', type: 'none' },
      null, null, null, null, null
    ],
  ];

  const cluster = findMatchingCluster(0, 0, grid, 8);
  assert.equal(cluster.length, 3);
});

test('floating bubble detection identifies disconnected bubbles to drop', () => {
  // Row 0 has bubbles at col 0, 1.
  // Row 2 has an isolated bubble at col 5 with no connection to ceiling.
  const grid: (Bubble | null)[][] = [
    [
      { id: '1', row: 0, col: 0, color: 'blue', type: 'none' },
      { id: '2', row: 0, col: 1, color: 'blue', type: 'none' },
      null, null, null, null, null, null
    ],
    [null, null, null, null, null, null, null],
    [
      null, null, null, null, null,
      { id: 'isolated', row: 2, col: 5, color: 'green', type: 'none' },
      null, null
    ],
  ];

  const floating = findFloatingBubbles(grid, 8);
  assert.equal(floating.length, 1);
  assert.equal(floating[0].row, 2);
  assert.equal(floating[0].col, 5);
});

test('bomb explosion clears 2-radius hex area', () => {
  const grid: (Bubble | null)[][] = [
    [
      { id: '1', row: 0, col: 0, color: 'blue', type: 'none' },
      { id: '2', row: 0, col: 1, color: 'blue', type: 'none' },
      null, null, null, null, null, null
    ],
    [
      { id: '3', row: 1, col: 0, color: 'red', type: 'bomb' },
      { id: '4', row: 1, col: 1, color: 'red', type: 'none' },
      null, null, null, null, null
    ],
  ];

  const bombCells = getBombExplosionCells(1, 0, grid, 8);
  assert.ok(bombCells.length >= 3);
  assert.ok(bombCells.some(c => c.row === 1 && c.col === 0));
  assert.ok(bombCells.some(c => c.row === 0 && c.col === 0));
});

test('scoring rules reward matches and drops with progressive points', () => {
  const score3 = calculateMatchScore(3, 1);
  const score5 = calculateMatchScore(5, 1);
  assert.equal(score3, 30);
  assert.ok(score5 > score3 * 1.5, 'Larger cluster yields bonus multiplier');

  const dropScore = calculateDropScore(3);
  assert.ok(dropScore >= 60, 'Dropped bubbles reward points');
});

test('star ratings evaluate accurately against thresholds', () => {
  const thresholds: [number, number, number] = [1000, 2000, 3000];
  assert.equal(calculateStarRating(500, thresholds), 1);
  assert.equal(calculateStarRating(1200, thresholds), 1);
  assert.equal(calculateStarRating(2400, thresholds), 2);
  assert.equal(calculateStarRating(3500, thresholds), 3);
});

test('checkObjectiveComplete handles clearAll, collectStars, and reachScore', () => {
  assert.equal(
    checkObjectiveComplete({ type: 'clearAll', description: '' }, 0, 500, 0),
    true
  );
  assert.equal(
    checkObjectiveComplete({ type: 'clearAll', description: '' }, 4, 500, 0),
    false
  );
  assert.equal(
    checkObjectiveComplete({ type: 'collectStars', targetCount: 3, description: '' }, 10, 500, 3),
    true
  );
  assert.equal(
    checkObjectiveComplete({ type: 'reachScore', targetCount: 1500, description: '' }, 10, 1550, 0),
    true
  );
});

test('checkGameOver validates victory vs shots depleted', () => {
  assert.deepEqual(checkGameOver(5, true, false), { isGameOver: true, isVictory: true });
  assert.deepEqual(checkGameOver(0, false, false), { isGameOver: true, isVictory: false });
  assert.deepEqual(checkGameOver(5, false, false), { isGameOver: false, isVictory: false });
  // If projectile is still in flight, do not end game yet
  assert.deepEqual(checkGameOver(0, false, true), { isGameOver: false, isVictory: false });
});

test('level generator produces valid configs for all 100 levels', () => {
  for (const lvl of [1, 10, 25, 50, 75, 100]) {
    const config = generateLevel(lvl);
    assert.equal(config.id, lvl);
    assert.ok(config.initialGrid.length >= 4);
    assert.ok(config.maxShots >= 15);
    assert.ok(config.theme.name.length > 0);
  }
});
