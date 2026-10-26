import { Bubble, BubbleColor, DroppingBubble, FloatingText, Particle, SpecialBubbleType, WorldTheme } from './types.ts';
import { BUBBLE_PALETTE, getBubbleCenter, GRID_COLS, getRowCols } from './grid.ts';

export class GameRenderer {
  private ctx: CanvasRenderingContext2D;
  private width: number;
  private height: number;

  constructor(ctx: CanvasRenderingContext2D, width: number, height: number) {
    this.ctx = ctx;
    this.width = width;
    this.height = height;
  }

  public setDimensions(width: number, height: number) {
    this.width = width;
    this.height = height;
  }

  // Draw background and ambient world elements
  public drawBackground(theme: WorldTheme, time: number, ambientParticles: Particle[]) {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    // Rich gradient
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, theme.bgGradient[0]);
    grad.addColorStop(0.5, theme.bgGradient[1]);
    grad.addColorStop(1, theme.bgGradient[2]);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Subtle atmospheric ambient glow in center
    const centerGlow = ctx.createRadialGradient(w / 2, h * 0.4, 40, w / 2, h * 0.4, w * 0.7);
    centerGlow.addColorStop(0, 'rgba(255, 255, 255, 0.08)');
    centerGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = centerGlow;
    ctx.fillRect(0, 0, w, h);

    // Decorative background pattern (hex grid silhouette)
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)';
    ctx.lineWidth = 1;
    const hexSize = 36;
    for (let x = 0; x < w + hexSize; x += hexSize * 1.5) {
      for (let y = 0; y < h + hexSize; y += hexSize * 1.732) {
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    ctx.restore();

    // Ambient floating theme particles
    for (const p of ambientParticles) {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // Arena borders and ceiling
  public drawArenaBorders(leftWall: number, rightWall: number, ceilingY: number, theme: WorldTheme) {
    const ctx = this.ctx;
    const h = this.height;

    ctx.save();
    // Ceiling Bar
    const ceilGrad = ctx.createLinearGradient(0, ceilingY - 12, 0, ceilingY);
    ceilGrad.addColorStop(0, '#1e293b');
    ceilGrad.addColorStop(0.7, '#334155');
    ceilGrad.addColorStop(1, theme.accentColor);
    ctx.fillStyle = ceilGrad;
    ctx.fillRect(leftWall - 4, ceilingY - 12, rightWall - leftWall + 8, 14);

    // Metallic screws/rivets on ceiling
    ctx.fillStyle = '#cbd5e1';
    for (let rx = leftWall + 20; rx < rightWall; rx += 45) {
      ctx.beginPath();
      ctx.arc(rx, ceilingY - 5, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Side wall glowing guide lines
    ctx.strokeStyle = theme.wallColor;
    ctx.lineWidth = 3;
    ctx.shadowColor = theme.accentColor;
    ctx.shadowBlur = 8;

    // Left wall
    ctx.beginPath();
    ctx.moveTo(leftWall, ceilingY);
    ctx.lineTo(leftWall, h);
    ctx.stroke();

    // Right wall
    ctx.beginPath();
    ctx.moveTo(rightWall, ceilingY);
    ctx.lineTo(rightWall, h);
    ctx.stroke();

    ctx.restore();
  }

  // Draw 3D glossy bubble
  public drawBubble(
    x: number,
    y: number,
    radius: number,
    color: BubbleColor,
    type: SpecialBubbleType = 'none',
    alpha: number = 1,
    scale: number = 1
  ) {
    const ctx = this.ctx;
    const r = radius * scale;
    if (r <= 0) return;

    ctx.save();
    ctx.globalAlpha = alpha;

    // Outer drop shadow
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y + r * 0.12, r * 0.95, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
    ctx.filter = 'blur(3px)';
    ctx.fill();
    ctx.restore();

    // Base spherical body
    const palette = BUBBLE_PALETTE[color] || BUBBLE_PALETTE.blue;
    let baseColor = palette.base;
    let lightColor = palette.light;
    let darkColor = palette.dark;
    let highlightColor = palette.highlight;

    if (type === 'rainbow') {
      // Prismatic rotating gradient
      const angle = (Date.now() / 800) % (Math.PI * 2);
      const radGrad = ctx.createLinearGradient(
        x + Math.cos(angle) * r,
        y + Math.sin(angle) * r,
        x - Math.cos(angle) * r,
        y - Math.sin(angle) * r
      );
      radGrad.addColorStop(0, '#f43f5e');
      radGrad.addColorStop(0.2, '#f59e0b');
      radGrad.addColorStop(0.4, '#10b981');
      radGrad.addColorStop(0.6, '#06b6d4');
      radGrad.addColorStop(0.8, '#8b5cf6');
      radGrad.addColorStop(1, '#ec4899');
      ctx.fillStyle = radGrad;
    } else if (type === 'bomb') {
      baseColor = '#1e293b';
      lightColor = '#475569';
      darkColor = '#090d16';
      highlightColor = '#cbd5e1';
      const radGrad = ctx.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.1, x, y, r);
      radGrad.addColorStop(0, lightColor);
      radGrad.addColorStop(0.6, baseColor);
      radGrad.addColorStop(1, darkColor);
      ctx.fillStyle = radGrad;
    } else if (type === 'stone') {
      baseColor = '#64748b';
      lightColor = '#94a3b8';
      darkColor = '#334155';
      const radGrad = ctx.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.1, x, y, r);
      radGrad.addColorStop(0, lightColor);
      radGrad.addColorStop(0.7, baseColor);
      radGrad.addColorStop(1, darkColor);
      ctx.fillStyle = radGrad;
    } else if (type === 'golden') {
      baseColor = '#eab308';
      lightColor = '#fef08a';
      darkColor = '#854d0e';
      const radGrad = ctx.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.1, x, y, r);
      radGrad.addColorStop(0, lightColor);
      radGrad.addColorStop(0.6, baseColor);
      radGrad.addColorStop(1, darkColor);
      ctx.fillStyle = radGrad;
    } else {
      const radGrad = ctx.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.1, x, y, r);
      radGrad.addColorStop(0, lightColor);
      radGrad.addColorStop(0.65, baseColor);
      radGrad.addColorStop(1, darkColor);
      ctx.fillStyle = radGrad;
    }

    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();

    // Glossy primary specular highlight (top-left oval)
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(x - r * 0.32, y - r * 0.36, r * 0.35, r * 0.22, -Math.PI / 4, 0, Math.PI * 2);
    const specGrad = ctx.createLinearGradient(x - r * 0.35, y - r * 0.5, x - r * 0.2, y - r * 0.2);
    specGrad.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
    specGrad.addColorStop(1, 'rgba(255, 255, 255, 0.1)');
    ctx.fillStyle = specGrad;
    ctx.fill();
    ctx.restore();

    // Subtle bottom inner reflection
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y + r * 0.4, r * 0.5, 0, Math.PI);
    ctx.lineWidth = r * 0.12;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
    ctx.stroke();
    ctx.restore();

    // Special bubble icons & embellishments
    this.drawSpecialEmbellishment(x, y, r, type);

    ctx.restore();
  }

  // Draw special bubble emblems (bomb fuse, star, lightning, ice crystal, etc.)
  private drawSpecialEmbellishment(x: number, y: number, r: number, type: SpecialBubbleType) {
    const ctx = this.ctx;
    if (type === 'none') return;

    ctx.save();

    if (type === 'bomb') {
      // Glowing animated bomb fuse and skull/flame
      ctx.fillStyle = '#ef4444';
      ctx.shadowColor = '#f97316';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(x, y + r * 0.1, r * 0.32, 0, Math.PI * 2);
      ctx.fill();

      // Bomb fuse on top
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(x, y - r * 0.3, r * 0.25, Math.PI * 0.5, Math.PI * 1.2);
      ctx.stroke();

      // Spark on fuse
      const sparkT = (Date.now() / 150) % 1;
      ctx.fillStyle = sparkT > 0.5 ? '#fef08a' : '#ea580c';
      ctx.beginPath();
      ctx.arc(x - r * 0.25, y - r * 0.5, 3, 0, Math.PI * 2);
      ctx.fill();
    } else if (type === 'star') {
      // Golden gleaming star
      ctx.fillStyle = '#fef08a';
      ctx.strokeStyle = '#ca8a04';
      ctx.lineWidth = 1.5;
      ctx.shadowColor = '#fde047';
      ctx.shadowBlur = 10;

      ctx.beginPath();
      const points = 5;
      const outerR = r * 0.52;
      const innerR = r * 0.25;
      for (let i = 0; i < points * 2; i++) {
        const rad = (i * Math.PI) / points - Math.PI / 2;
        const curR = i % 2 === 0 ? outerR : innerR;
        const px = x + Math.cos(rad) * curR;
        const py = y + Math.sin(rad) * curR;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (type === 'lightning') {
      // Electric lightning bolt
      ctx.fillStyle = '#fef08a';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 12;

      ctx.beginPath();
      ctx.moveTo(x - r * 0.15, y - r * 0.5);
      ctx.lineTo(x + r * 0.25, y - r * 0.05);
      ctx.lineTo(x, y - r * 0.05);
      ctx.lineTo(x + r * 0.2, y + r * 0.5);
      ctx.lineTo(x - r * 0.25, y + r * 0.05);
      ctx.lineTo(x, y + r * 0.05);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (type === 'rainbow') {
      // Prismatic swirl star
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(x, y, r * 0.26, 0, Math.PI * 2);
      ctx.fill();
    } else if (type === 'golden') {
      // Coin $ icon
      ctx.fillStyle = '#78350f';
      ctx.font = `bold ${Math.round(r * 0.7)}px Outfit, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('$', x, y + 1);
    } else if (type === 'ice') {
      // Ice crystal snowflake
      ctx.strokeStyle = '#e0f2fe';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      for (let a = 0; a < 3; a++) {
        const rad = (a * Math.PI) / 3;
        ctx.moveTo(x + Math.cos(rad) * r * 0.45, y + Math.sin(rad) * r * 0.45);
        ctx.lineTo(x - Math.cos(rad) * r * 0.45, y - Math.sin(rad) * r * 0.45);
      }
      ctx.stroke();
    } else if (type === 'fire') {
      // Flame teardrop
      ctx.fillStyle = '#ea580c';
      ctx.shadowColor = '#f97316';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(x, y + r * 0.15, r * 0.3, 0, Math.PI);
      ctx.quadraticCurveTo(x + r * 0.35, y - r * 0.1, x, y - r * 0.5);
      ctx.quadraticCurveTo(x - r * 0.35, y - r * 0.1, x - r * 0.3, y + r * 0.15);
      ctx.fill();
    } else if (type === 'stone') {
      // Granite cracks
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x - r * 0.3, y - r * 0.2);
      ctx.lineTo(x, y + r * 0.1);
      ctx.lineTo(x + r * 0.35, y - r * 0.1);
      ctx.moveTo(x, y + r * 0.1);
      ctx.lineTo(x - r * 0.1, y + r * 0.4);
      ctx.stroke();
    }

    ctx.restore();
  }

  // Draw the full bubble grid
  public drawGrid(
    grid: (Bubble | null)[][],
    radius: number,
    gridOffsetX: number,
    gridOffsetY: number,
    baseCols = GRID_COLS
  ) {
    for (let r = 0; r < grid.length; r++) {
      if (!grid[r]) continue;
      const cols = getRowCols(r, baseCols);
      for (let c = 0; c < cols; c++) {
        const bubble = grid[r][c];
        if (bubble) {
          const pos = getBubbleCenter(r, c, radius, gridOffsetX, gridOffsetY, baseCols);
          this.drawBubble(pos.x, pos.y, radius, bubble.color, bubble.type);
        }
      }
    }
  }

  // Draw animated trajectory aiming guideline with predicted bounce and ghost target bubble
  public drawTrajectory(
    points: { x: number; y: number }[],
    hitCell: { row: number; col: number } | null,
    currentBubbleColor: BubbleColor,
    currentBubbleType: SpecialBubbleType,
    radius: number,
    gridOffsetX: number,
    gridOffsetY: number,
    time: number
  ) {
    if (points.length < 2) return;
    const ctx = this.ctx;

    ctx.save();
    ctx.setLineDash([8, 10]);
    ctx.lineDashOffset = -time * 30; // marching dash animation
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 8;

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.stroke();
    ctx.restore();

    // Landing ghost preview circle at hit cell
    if (hitCell) {
      const targetPos = getBubbleCenter(hitCell.row, hitCell.col, radius, gridOffsetX, gridOffsetY, GRID_COLS);
      ctx.save();
      ctx.beginPath();
      ctx.arc(targetPos.x, targetPos.y, radius * 0.95, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([4, 4]);
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 10;
      ctx.stroke();

      // Faint ghost tint inside
      this.drawBubble(targetPos.x, targetPos.y, radius * 0.88, currentBubbleColor, currentBubbleType, 0.45);
      ctx.restore();
    }
  }

  // Draw launcher & canon mechanism
  public drawLauncher(
    centerX: number,
    centerY: number,
    angle: number,
    currentBubbleColor: BubbleColor,
    currentBubbleType: SpecialBubbleType,
    nextBubbleColor: BubbleColor,
    nextBubbleType: SpecialBubbleType,
    radius: number
  ) {
    const ctx = this.ctx;

    ctx.save();

    // Launcher base pedestal shadow
    ctx.beginPath();
    ctx.ellipse(centerX, centerY + 30, radius * 2.2, radius * 0.8, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.fill();

    // Launcher pedestal ring
    const pedestalGrad = ctx.createLinearGradient(centerX - 40, centerY, centerX + 40, centerY + 35);
    pedestalGrad.addColorStop(0, '#334155');
    pedestalGrad.addColorStop(0.5, '#1e293b');
    pedestalGrad.addColorStop(1, '#0f172a');
    ctx.fillStyle = pedestalGrad;
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 3;

    ctx.beginPath();
    ctx.arc(centerX, centerY + 18, radius * 1.8, Math.PI * 0.8, Math.PI * 2.2);
    ctx.fill();
    ctx.stroke();

    // Next bubble preview chamber on the left side
    const nextX = centerX - radius * 2.5;
    const nextY = centerY + 14;

    ctx.beginPath();
    ctx.arc(nextX, nextY, radius * 0.95, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    ctx.fill();
    ctx.stroke();

    // Small next bubble
    this.drawBubble(nextX, nextY, radius * 0.65, nextBubbleColor, nextBubbleType);

    // Swap arrow indicator between next and launcher
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(centerX - radius * 1.3, centerY + 6, radius * 0.4, Math.PI * 0.8, Math.PI * 1.6);
    ctx.stroke();

    // Swiveling Canon Barrel
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(angle);

    // Cannon guide barrel arrows
    const barrelGrad = ctx.createLinearGradient(0, -radius * 1.6, radius * 1.4, radius * 1.6);
    barrelGrad.addColorStop(0, '#38bdf8');
    barrelGrad.addColorStop(1, '#0284c7');

    ctx.fillStyle = barrelGrad;
    ctx.strokeStyle = '#bae6fd';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#0ea5e9';
    ctx.shadowBlur = 8;

    // Outer barrel ring
    ctx.beginPath();
    ctx.arc(radius * 1.1, 0, radius * 0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Directional pointer arrow
    ctx.beginPath();
    ctx.moveTo(radius * 1.4, -radius * 0.4);
    ctx.lineTo(radius * 2.2, 0);
    ctx.lineTo(radius * 1.4, radius * 0.4);
    ctx.closePath();
    ctx.fillStyle = '#f8fafc';
    ctx.fill();

    ctx.restore();

    // Current bubble loaded in launcher chamber
    this.drawBubble(centerX, centerY, radius * 1.05, currentBubbleColor, currentBubbleType);

    ctx.restore();
  }

  // Draw falling disconnected bubbles
  public drawDroppingBubbles(bubbles: DroppingBubble[]) {
    for (const b of bubbles) {
      this.ctx.save();
      this.ctx.translate(b.x, b.y);
      this.ctx.rotate(b.rotation);
      this.drawBubble(0, 0, b.radius, b.color, b.type, b.alpha);
      this.ctx.restore();
    }
  }

  // Draw explosion / pop particles
  public drawParticles(particles: Particle[]) {
    const ctx = this.ctx;
    for (const p of particles) {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 6;

      if (p.shape === 'star') {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  // Draw floating popup scores
  public drawFloatingTexts(texts: FloatingText[]) {
    const ctx = this.ctx;
    for (const t of texts) {
      ctx.save();
      ctx.globalAlpha = t.alpha;
      ctx.font = `800 ${t.size}px Fredoka, Outfit, sans-serif`;
      ctx.fillStyle = t.color;
      ctx.textAlign = 'center';
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 4;
      ctx.strokeText(t.text, t.x, t.y);
      ctx.fillText(t.text, t.x, t.y);
      ctx.restore();
    }
  }
}
