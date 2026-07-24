import { PLAYER_RADIUS, TILE } from "./levels.js";

const COL = {
  bg: "#0a0c12",
  floor: "#12151e",
  wall: "#2a3040",
  wallEdge: "#3a4255",
  plateOff: "#3a3040",
  plateOn: "#c9a227",
  doorClosed: "#5a3a4a",
  doorOpen: "#1a2a28",
  exit: "#2a5a48",
  exitCore: "#4ec9a0",
  player: "#e8eef6",
  playerGlow: "rgba(200, 220, 255, 0.25)",
  ghost: "rgba(78, 201, 208, 0.45)",
  ghostCore: "rgba(78, 201, 208, 0.85)",
  hud: "#c8d0dc",
  hudDim: "#6a7a90",
  barBg: "#1c2230",
  barFill: "#4ec9d0",
  barWarn: "#e0a040",
  win: "#4ec9a0",
};

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} cssW
 * @param {number} cssH
 * @param {ReturnType<import('./game.js').Game['view']>} v
 */
export function render(ctx, cssW, cssH, v) {
  const level = v.level;
  const scale = Math.min(cssW / level.width, cssH / level.height) * 0.92;
  const ox = (cssW - level.width * scale) / 2;
  const oy = (cssH - level.height * scale) / 2 + 12;

  ctx.fillStyle = COL.bg;
  ctx.fillRect(0, 0, cssW, cssH);

  ctx.save();
  ctx.translate(ox, oy);
  ctx.scale(scale, scale);

  // Floor
  ctx.fillStyle = COL.floor;
  ctx.fillRect(0, 0, level.width, level.height);

  // Subtle grid
  ctx.strokeStyle = "rgba(255,255,255,0.03)";
  ctx.lineWidth = 1;
  for (let x = 0; x <= level.width; x += TILE) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, level.height);
    ctx.stroke();
  }
  for (let y = 0; y <= level.height; y += TILE) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(level.width, y);
    ctx.stroke();
  }

  // Walls
  for (const w of level.walls) {
    ctx.fillStyle = COL.wall;
    ctx.fillRect(w.x, w.y, w.w, w.h);
    ctx.strokeStyle = COL.wallEdge;
    ctx.lineWidth = 1;
    ctx.strokeRect(w.x + 0.5, w.y + 0.5, w.w - 1, w.h - 1);
  }

  // Exit
  const ex = v.exit;
  ctx.fillStyle = COL.exit;
  ctx.fillRect(ex.x, ex.y, ex.w, ex.h);
  ctx.strokeStyle = COL.exitCore;
  ctx.lineWidth = 2;
  ctx.strokeRect(ex.x + 2, ex.y + 2, ex.w - 4, ex.h - 4);
  ctx.fillStyle = COL.exitCore;
  ctx.globalAlpha = 0.35 + 0.15 * Math.sin(v.hintPulse * 3);
  ctx.fillRect(ex.x + 6, ex.y + 6, ex.w - 12, ex.h - 12);
  ctx.globalAlpha = 1;

  // Plates
  for (const p of v.plates) {
    const on = v.plateOn[p.id];
    ctx.fillStyle = on ? COL.plateOn : COL.plateOff;
    roundRect(ctx, p.x, p.y, p.w, p.h, 4);
    ctx.fill();
    ctx.strokeStyle = on ? "#f0d060" : "#5a4a5a";
    ctx.lineWidth = 2;
    ctx.stroke();
    if (on) {
      ctx.fillStyle = "rgba(240, 200, 80, 0.25)";
      ctx.beginPath();
      ctx.arc(p.x + p.w / 2, p.y + p.h / 2, PLAYER_RADIUS * 1.8, 0, Math.PI * 2);
      ctx.fill();
    }
    // Label
    ctx.fillStyle = on ? "#1a1408" : "#c8b080";
    ctx.font = "bold 9px ui-monospace, Menlo, monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(on ? "HELD" : "PLATE", p.x + p.w / 2, p.y + p.h / 2);
    ctx.textBaseline = "alphabetic";
  }

  // Doors
  for (const d of v.doors) {
    if (d.open) {
      ctx.fillStyle = COL.doorOpen;
      ctx.globalAlpha = 0.35;
      ctx.fillRect(d.x + 4, d.y + 4, d.w - 8, d.h - 8);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = "rgba(78, 201, 160, 0.5)";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(d.x + 4, d.y + 4, d.w - 8, d.h - 8);
      ctx.setLineDash([]);
      ctx.fillStyle = "#4ec9a0";
      ctx.font = "bold 9px ui-monospace, Menlo, monospace";
      ctx.textAlign = "center";
      ctx.fillText("OPEN", d.x + d.w / 2, d.y + d.h / 2 + 3);
    } else {
      ctx.fillStyle = COL.doorClosed;
      ctx.fillRect(d.x, d.y, d.w, d.h);
      ctx.strokeStyle = "#8a5a6a";
      ctx.lineWidth = 2;
      ctx.strokeRect(d.x + 2, d.y + 2, d.w - 4, d.h - 4);
      ctx.fillStyle = "#e0b0b8";
      ctx.font = "bold 8px ui-monospace, Menlo, monospace";
      ctx.textAlign = "center";
      ctx.fillText("DOOR", d.x + d.w / 2, d.y + d.h / 2 + 3);
    }
  }

  // Exit label
  {
    const ex = v.exit;
    ctx.fillStyle = COL.exitCore;
    ctx.font = "bold 9px ui-monospace, Menlo, monospace";
    ctx.textAlign = "center";
    ctx.fillText("EXIT", ex.x + ex.w / 2, ex.y + ex.h / 2 + 3);
  }

  // Ghosts
  for (const g of v.ghosts) {
    ctx.beginPath();
    ctx.fillStyle = COL.ghost;
    ctx.arc(g.x, g.y, PLAYER_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = COL.ghostCore;
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // Player
  ctx.beginPath();
  ctx.fillStyle = COL.playerGlow;
  ctx.arc(v.player.x, v.player.y, PLAYER_RADIUS * 1.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.fillStyle = COL.player;
  ctx.arc(v.player.x, v.player.y, PLAYER_RADIUS, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();

  // HUD (screen space)
  drawHud(ctx, cssW, cssH, v);
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} w
 * @param {number} h
 * @param {ReturnType<import('./game.js').Game['view']>} v
 */
function drawHud(ctx, w, h, v) {
  const pad = 16;
  ctx.fillStyle = COL.hud;
  ctx.font = "600 14px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx.textAlign = "left";
  ctx.fillText("LOOPSELF", pad, pad + 12);

  ctx.fillStyle = COL.hudDim;
  ctx.font = "12px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx.fillText(v.level.name, pad, pad + 30);

  // Timer bar
  const barW = Math.min(280, w - pad * 2);
  const barH = 8;
  const barX = (w - barW) / 2;
  const barY = pad + 8;
  const frac = 1 - Math.min(1, v.t / v.loopSec);
  ctx.fillStyle = COL.barBg;
  roundRect(ctx, barX, barY, barW, barH, 4);
  ctx.fill();
  ctx.fillStyle = frac < 0.25 ? COL.barWarn : COL.barFill;
  roundRect(ctx, barX, barY, Math.max(2, barW * frac), barH, 4);
  ctx.fill();

  ctx.fillStyle = COL.hudDim;
  ctx.font = "11px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx.textAlign = "center";
  ctx.fillText(
    `${(v.loopSec - v.t).toFixed(1)}s  ·  ghosts ${v.ghostCount}/${v.maxGhosts}`,
    w / 2,
    barY + barH + 16
  );

  // Coach banner
  if (!v.won) {
    const boxW = Math.min(560, w - 32);
    const boxH = 56;
    const bx = (w - boxW) / 2;
    const by = h - boxH - 16;
    ctx.fillStyle = "rgba(17, 20, 31, 0.92)";
    roundRect(ctx, bx, by, boxW, boxH, 8);
    ctx.fill();
    ctx.strokeStyle = v.phase === 1 ? "rgba(240, 192, 96, 0.45)" : "rgba(78, 201, 208, 0.45)";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = COL.hud;
    ctx.font = "13px ui-monospace, SFMono-Regular, Menlo, monospace";
    ctx.textAlign = "center";
    wrapText(ctx, v.hint, w / 2, by + 22, boxW - 24, 16);

    ctx.fillStyle = "rgba(106,122,144,0.9)";
    ctx.font = "11px ui-monospace, SFMono-Regular, Menlo, monospace";
    ctx.fillText("WASD move  ·  timer auto-loops  ·  R = wipe ghosts & restart", w / 2, by + boxH - 10);
  }

  if (v.maxedToast > 0) {
    ctx.fillStyle = "rgba(224, 160, 64, 0.95)";
    ctx.font = "12px ui-monospace, SFMono-Regular, Menlo, monospace";
    ctx.textAlign = "center";
    ctx.fillText("Max ghosts — win with these, or R to wipe", w / 2, 72);
  }

  if (v.won) {
    ctx.fillStyle = "rgba(10, 12, 18, 0.55)";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = COL.win;
    ctx.font = "700 28px ui-monospace, SFMono-Regular, Menlo, monospace";
    ctx.textAlign = "center";
    ctx.fillText("CLEAR", w / 2, h / 2 - 8);
    ctx.fillStyle = COL.hud;
    ctx.font = "13px ui-monospace, SFMono-Regular, Menlo, monospace";
    ctx.fillText(
      `Ghosts used: ${v.ghostCount}  ·  R to replay`,
      w / 2,
      h / 2 + 22
    );
  }
}

function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function wrapText(ctx, text, x, y, maxW, lineH) {
  const words = text.split(" ");
  let line = "";
  let yy = y;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, x, yy);
      line = word;
      yy += lineH;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, yy);
}
