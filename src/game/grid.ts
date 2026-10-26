import { Bubble, BubbleColor, SpecialBubbleType } from './types.ts';

export const GRID_COLS = 8;
export const MAX_GRID_ROWS = 14;

export const BUBBLE_PALETTE: Record<BubbleColor, {
  name: string;
  base: string;
  dark: string;
  light: string;
  highlight: string;
  glow: string;
}> = {
  blue: {
    name: 'Electric Blue',
    base: '#0284c7',
    dark: '#0369a1',
    light: '#38bdf8',
    highlight: '#e0f2fe',
    glow: 'rgba(56, 189, 248, 0.6)',
  },
  red: {
    name: 'Bright Red',
    base: '#e11d48',
    dark: '#be123c',
    light: '#fb7185',
    highlight: '#ffe4e6',
    glow: 'rgba(251, 113, 133, 0.6)',
  },
  yellow: {
    name: 'Golden Yellow',
    base: '#eab308',
    dark: '#ca8a04',
    light: '#fde047',
    highlight: '#fef9c3',
    glow: 'rgba(253, 224, 71, 0.6)',
  },
  green: {
    name: 'Emerald Green',
    base: '#10b981',
    dark: '#047857',
    light: '#34d399',
    highlight: '#d1fae5',
    glow: 'rgba(52, 211, 153, 0.6)',
  },
  purple: {
    name: 'Amethyst Purple',
    base: '#8b5cf6',
    dark: '#6d28d9',
    light: '#a78bfa',
    highlight: '#ede9fe',
    glow: 'rgba(167, 139, 250, 0.6)',
  },
  orange: {
    name: 'Vibrant Orange',
    base: '#f97316',
    dark: '#c2410c',
    light: '#fb923c',
    highlight: '#ffedd5',
    glow: 'rgba(251, 146, 60, 0.6)',
  },
  pink: {
    name: 'Candy Pink',
    base: '#ec4899',
    dark: '#be185d',
    light: '#f472b6',
    highlight: '#fce7f3',
    glow: 'rgba(244, 114, 182, 0.6)',
  },
};

export function getRowCols(row: number, baseCols = GRID_COLS): number {
  return row % 2 === 0 ? baseCols : baseCols - 1;
}

export function getBubbleCenter(
  row: number,
  col: number,
  radius: number,
  gridOffsetX: number,
  gridOffsetY: number,
  baseCols = GRID_COLS
): { x: number; y: number } {
  const rowHeight = radius * Math.sqrt(3);
  const isEven = row % 2 === 0;
  const startX = isEven ? gridOffsetX + radius : gridOffsetX + radius * 2;
  const x = startX + col * (radius * 2);
  const y = gridOffsetY + radius + row * rowHeight;
  return { x, y };
}

export function isValidCell(row: number, col: number, maxRows = MAX_GRID_ROWS, baseCols = GRID_COLS): boolean {
  if (row < 0 || row >= maxRows) return false;
  const colsInRow = getRowCols(row, baseCols);
  return col >= 0 && col < colsInRow;
}

export function getNeighbors(row: number, col: number, maxRows = MAX_GRID_ROWS, baseCols = GRID_COLS): Array<{ row: number; col: number }> {
  const isEven = row % 2 === 0;
  const deltas = isEven
    ? [
        { r: 0, c: -1 }, // Left
        { r: 0, c: 1 },  // Right
        { r: -1, c: -1 }, // Top-Left
        { r: -1, c: 0 },  // Top-Right
        { r: 1, c: -1 },  // Bottom-Left
        { r: 1, c: 0 },   // Bottom-Right
      ]
    : [
        { r: 0, c: -1 }, // Left
        { r: 0, c: 1 },  // Right
        { r: -1, c: 0 }, // Top-Left
        { r: -1, c: 1 }, // Top-Right
        { r: 1, c: 0 },  // Bottom-Left
        { r: 1, c: 1 },  // Bottom-Right
      ];

  const result: Array<{ row: number; col: number }> = [];
  for (const d of deltas) {
    const nr = row + d.r;
    const nc = col + d.c;
    if (isValidCell(nr, nc, maxRows, baseCols)) {
      result.push({ row: nr, col: nc });
    }
  }
  return result;
}

/**
 * Finds the nearest unoccupied valid hex cell to the given world point (x, y)
 * that is adjacent to at least one existing bubble, or in row 0.
 */
export function findBestSnapCell(
  x: number,
  y: number,
  grid: (Bubble | null)[][],
  radius: number,
  gridOffsetX: number,
  gridOffsetY: number,
  maxRows = MAX_GRID_ROWS,
  baseCols = GRID_COLS
): { row: number; col: number } | null {
  let closestCell: { row: number; col: number } | null = null;
  let minDistance = Infinity;

  // Only check cells up to grid.length + 1
  const limitRow = Math.min(maxRows, grid.length + 1);

  for (let r = 0; r < limitRow; r++) {
    const colsInRow = getRowCols(r, baseCols);
    for (let c = 0; c < colsInRow; c++) {
      if (grid[r] && grid[r][c] !== null) {
        continue; // already occupied
      }

      // Candidate cell must either be on the ceiling (r === 0) or adjacent to an existing bubble
      let hasNeighbor = r === 0;
      if (!hasNeighbor) {
        const neighbors = getNeighbors(r, c, maxRows, baseCols);
        for (const n of neighbors) {
          if (grid[n.row] && grid[n.row][n.col] !== null) {
            hasNeighbor = true;
            break;
          }
        }
      }

      if (hasNeighbor) {
        const pos = getBubbleCenter(r, c, radius, gridOffsetX, gridOffsetY, baseCols);
        const distSq = (pos.x - x) ** 2 + (pos.y - y) ** 2;
        if (distSq < minDistance) {
          minDistance = distSq;
          closestCell = { row: r, col: c };
        }
      }
    }
  }

  // Snapping distance threshold (within 2.2 radii)
  if (minDistance <= (radius * 2.5) ** 2) {
    return closestCell;
  }
  return closestCell;
}

/**
 * Find matching group of 3 or more connected bubbles of the same color.
 * Supports Rainbow bubbles which connect to any adjacent color.
 */
export function findMatchingCluster(
  startRow: number,
  startCol: number,
  grid: (Bubble | null)[][],
  baseCols = GRID_COLS
): Array<{ row: number; col: number }> {
  const startBubble = grid[startRow]?.[startCol];
  if (!startBubble) return [];

  // Determine target color. If startBubble is rainbow, pick the most frequent adjacent color.
  let targetColor: BubbleColor = startBubble.color;
  if (startBubble.type === 'rainbow') {
    const neighborColors: Record<string, number> = {};
    const nList = getNeighbors(startRow, startCol, grid.length, baseCols);
    for (const n of nList) {
      const b = grid[n.row]?.[n.col];
      if (b && b.type !== 'stone' && b.color) {
        neighborColors[b.color] = (neighborColors[b.color] || 0) + 1;
      }
    }
    let maxCount = 0;
    for (const [colStr, count] of Object.entries(neighborColors)) {
      if (count > maxCount) {
        maxCount = count;
        targetColor = colStr as BubbleColor;
      }
    }
  }

  const visited = new Set<string>();
  const cluster: Array<{ row: number; col: number }> = [];
  const queue: Array<{ row: number; col: number }> = [{ row: startRow, col: startCol }];
  visited.add(`${startRow},${startCol}`);

  while (queue.length > 0) {
    const current = queue.shift()!;
    const bubble = grid[current.row]?.[current.col];
    if (!bubble) continue;

    // A bubble matches if it's the target color, a rainbow bubble, or chain bubble
    const matchesColor =
      bubble.color === targetColor ||
      bubble.type === 'rainbow';

    if (matchesColor && bubble.type !== 'stone') {
      cluster.push(current);
      const neighbors = getNeighbors(current.row, current.col, grid.length, baseCols);
      for (const n of neighbors) {
        const key = `${n.row},${n.col}`;
        if (!visited.has(key)) {
          const neighborBubble = grid[n.row]?.[n.col];
          if (neighborBubble) {
            visited.add(key);
            queue.push(n);
          }
        }
      }
    }
  }

  return cluster;
}

/**
 * Identifies all bubbles that are disconnected from the ceiling (row 0).
 * Any bubble not reachable via BFS from row 0 should fall!
 */
export function findFloatingBubbles(
  grid: (Bubble | null)[][],
  baseCols = GRID_COLS
): Array<{ row: number; col: number }> {
  const visited = new Set<string>();
  const queue: Array<{ row: number; col: number }> = [];

  // Anchor points: all non-empty bubbles in row 0
  if (grid[0]) {
    for (let c = 0; c < grid[0].length; c++) {
      if (grid[0][c] !== null) {
        queue.push({ row: 0, col: c });
        visited.add(`0,${c}`);
      }
    }
  }

  // BFS to find all connected-to-ceiling bubbles
  while (queue.length > 0) {
    const curr = queue.shift()!;
    const neighbors = getNeighbors(curr.row, curr.col, grid.length, baseCols);
    for (const n of neighbors) {
      const key = `${n.row},${n.col}`;
      if (!visited.has(key)) {
        if (grid[n.row]?.[n.col] !== null && grid[n.row]?.[n.col] !== undefined) {
          visited.add(key);
          queue.push(n);
        }
      }
    }
  }

  // Any non-empty bubble not visited is floating
  const floating: Array<{ row: number; col: number }> = [];
  for (let r = 0; r < grid.length; r++) {
    const colsInRow = getRowCols(r, baseCols);
    for (let c = 0; c < colsInRow; c++) {
      if (grid[r]?.[c] !== null && grid[r]?.[c] !== undefined) {
        if (!visited.has(`${r},${c}`)) {
          floating.push({ row: r, col: c });
        }
      }
    }
  }

  return floating;
}

/**
 * Returns bubbles destroyed by a Bomb bubble explosion (radius ~ 2 hex cells)
 */
export function getBombExplosionCells(
  centerRow: number,
  centerCol: number,
  grid: (Bubble | null)[][],
  baseCols = GRID_COLS
): Array<{ row: number; col: number }> {
  const result: Array<{ row: number; col: number }> = [];
  const visited = new Set<string>();

  // Collect depth-2 neighbors
  const queue: Array<{ row: number; col: number; depth: number }> = [
    { row: centerRow, col: centerCol, depth: 0 }
  ];
  visited.add(`${centerRow},${centerCol}`);

  while (queue.length > 0) {
    const curr = queue.shift()!;
    if (grid[curr.row]?.[curr.col] !== null && grid[curr.row]?.[curr.col] !== undefined) {
      result.push({ row: curr.row, col: curr.col });
    }

    if (curr.depth < 2) {
      const neighbors = getNeighbors(curr.row, curr.col, grid.length, baseCols);
      for (const n of neighbors) {
        const key = `${n.row},${n.col}`;
        if (!visited.has(key)) {
          visited.add(key);
          queue.push({ row: n.row, col: n.col, depth: curr.depth + 1 });
        }
      }
    }
  }

  return result;
}

/**
 * Returns bubbles cleared by Lightning bubble (entire row)
 */
export function getLightningCells(
  row: number,
  grid: (Bubble | null)[][]
): Array<{ row: number; col: number }> {
  const result: Array<{ row: number; col: number }> = [];
  if (!grid[row]) return result;
  for (let c = 0; c < grid[row].length; c++) {
    if (grid[row][c] !== null) {
      result.push({ row, col: c });
    }
  }
  return result;
}

/**
 * Calculates trajectory line with wall bounces.
 */
export interface TrajectoryPoint {
  x: number;
  y: number;
}

export function calculateTrajectory(
  startX: number,
  startY: number,
  angleRad: number,
  radius: number,
  leftWall: number,
  rightWall: number,
  topCeiling: number,
  grid: (Bubble | null)[][],
  gridOffsetX: number,
  gridOffsetY: number,
  maxBounces = 2,
  baseCols = GRID_COLS
): { points: TrajectoryPoint[]; hitCell: { row: number; col: number } | null; hitBubble: boolean } {
  const points: TrajectoryPoint[] = [{ x: startX, y: startY }];
  let curX = startX;
  let curY = startY;
  let dx = Math.cos(angleRad);
  let dy = Math.sin(angleRad);
  let hitCell: { row: number; col: number } | null = null;
  let hitBubble = false;

  const minX = leftWall + radius;
  const maxX = rightWall - radius;
  const step = radius * 0.4;
  const maxDistance = 1400;
  let traveled = 0;
  let bounces = 0;

  while (traveled < maxDistance && bounces <= maxBounces && curY > topCeiling) {
    curX += dx * step;
    curY += dy * step;
    traveled += step;

    // Wall bounce
    if (curX <= minX) {
      curX = minX;
      dx = -dx;
      bounces++;
      points.push({ x: curX, y: curY });
    } else if (curX >= maxX) {
      curX = maxX;
      dx = -dx;
      bounces++;
      points.push({ x: curX, y: curY });
    }

    // Check collision with ceiling
    if (curY - radius <= topCeiling) {
      hitCell = findBestSnapCell(curX, topCeiling + radius, grid, radius, gridOffsetX, gridOffsetY, MAX_GRID_ROWS, baseCols);
      points.push({ x: curX, y: curY });
      break;
    }

    // Check collision with existing bubbles
    let collided = false;
    for (let r = 0; r < grid.length; r++) {
      if (!grid[r]) continue;
      const colsInRow = getRowCols(r, baseCols);
      for (let c = 0; c < colsInRow; c++) {
        if (grid[r][c] !== null) {
          const bPos = getBubbleCenter(r, c, radius, gridOffsetX, gridOffsetY, baseCols);
          const distSq = (curX - bPos.x) ** 2 + (curY - bPos.y) ** 2;
          // Collision distance is 2 * radius (with slight leeway)
          if (distSq <= (radius * 1.95) ** 2) {
            collided = true;
            hitBubble = true;
            hitCell = findBestSnapCell(curX, curY, grid, radius, gridOffsetX, gridOffsetY, MAX_GRID_ROWS, baseCols);
            break;
          }
        }
      }
      if (collided) break;
    }

    if (collided) {
      points.push({ x: curX, y: curY });
      break;
    }
  }

  if (points[points.length - 1].x !== curX || points[points.length - 1].y !== curY) {
    points.push({ x: curX, y: curY });
  }

  return { points, hitCell, hitBubble };
}
