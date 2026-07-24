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
  card: "#11141f",
  cardBorder: "#2a3040",
  cardHot: "#1a2230",
  accent: "#4ec9d0",
};

/**
 * Layout for level select cards (CSS pixels).
 * @param {number} w
 * @param {number} h
 * @param {number} count
 */
export function menuLayout(w, h, count) {
  const titleY = Math.max(48, h * 0.12);
  const cardW = Math.min(420, w - 48);
  const cardH = 64;
  const gap = 12;
  const totalH = count * cardH + (count - 1) * gap;
  let startY = titleY + 56;
  if (startY + totalH > h - 40) {
    startY = Math.max(100, (h - totalH) / 2);
  }
  const x = (w - cardW) / 2;
  /** @type {{ index: number, x: number, y: number, w: number, h: number }[]} */
  const cards = [];
  for (let i = 0; i < count; i++) {
    cards.push({
      index: i,
      x,
      y: startY + i * (cardH + gap),
      w: cardW,
      h: cardH,
    });
  }
  return { titleY, cards };
}

/**
 * Clear-screen button layout.
 * @param {number} w
 * @param {number} h
 */
export function clearLayout(w, h) {
  const bw = 140;
  const bh = 40;
  const gap = 12;
  const total = bw * 3 + gap * 2;
  const x0 = (w - total) / 2;
  const y = h / 2 + 48;
  return {
    replay: { x: x0, y, w: bw, h: bh, id: "replay" },
    next: { x: x0 + bw + gap, y, w: bw, h: bh, id: "next" },
    menu: { x: x0 + (bw + gap) * 2, y, w: bw, h: bh, id: "menu" },
  };
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} cssW
 * @param {number} cssH
 * @param {object} state
 */
export function renderMenu(ctx, cssW, cssH, state) {
  const { levels, bests, hoverIndex } = state;
  ctx.fillStyle = COL.bg;
  ctx.fillRect(0, 0, cssW, cssH);

  const layout = menuLayout(cssW, cssH, levels.length);

  ctx.fillStyle = COL.hud;
  ctx.font = "700 28px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx.textAlign = "center";
  ctx.fillText("LOOPSELF", cssW / 2, layout.titleY);

  ctx.fillStyle = COL.hudDim;
  ctx.font = "13px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx.fillText("Short loops. Past you helps present you.", cssW / 2, layout.titleY + 28);

  for (const card of layout.cards) {
    const lv = levels[card.index];
    const hot = hoverIndex === card.index;
    ctx.fillStyle = hot ? COL.cardHot : COL.card;
    roundRect(ctx, card.x, card.y, card.w, card.h, 8);
    ctx.fill();
    ctx.strokeStyle = hot ? COL.accent : COL.cardBorder;
    ctx.lineWidth = hot ? 2 : 1;
    ctx.stroke();

    const num = String(card.index + 1).padStart(2, "0");
    ctx.fillStyle = COL.accent;
    ctx.font = "700 16px ui-monospace, Menlo, monospace";
    ctx.textAlign = "left";
    ctx.fillText(num, card.x + 16, card.y + 28);

    ctx.fillStyle = COL.hud;
    ctx.font = "600 15px ui-monospace, Menlo, monospace";
    ctx.fillText(lv.name, card.x + 52, card.y + 28);

    ctx.fillStyle = COL.hudDim;
    ctx.font = "12px ui-monospace, Menlo, monospace";
    ctx.fillText(lv.brief, card.x + 52, card.y + 48);

    const best = bests[lv.id];
    ctx.textAlign = "right";
    if (best != null) {
      ctx.fillStyle = COL.win;
      ctx.font = "12px ui-monospace, Menlo, monospace";
      ctx.fillText(`best ${best}g`, card.x + card.w - 16, card.y + 36);
    } else {
      ctx.fillStyle = COL.hudDim;
      ctx.font = "12px ui-monospace, Menlo, monospace";
      ctx.fillText("—", card.x + card.w - 16, card.y + 36);
    }
  }

  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(106,122,144,0.85)";
  ctx.font = "11px ui-monospace, Menlo, monospace";
  ctx.fillText("Click a level  ·  or press 1–9", cssW / 2, cssH - 20);

  return layout;
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} cssW
 * @param {number} cssH
 * @param {ReturnType<import('./game.js').Game['view']>} v
 * @param {{ best: number | null, isNew: boolean, hasNext: boolean }} clearInfo
 */
export function renderPlay(ctx, cssW, cssH, v, clearInfo) {
  drawWorld(ctx, cssW, cssH, v);
  drawHud(ctx, cssW, cssH, v, clearInfo);
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} cssW
 * @param {number} cssH
 * @param {ReturnType<import('./game.js').Game['view']>} v
 * @param {{ best: number | null, isNew: boolean, hasNext: boolean }} clearInfo
 */
export function renderClear(ctx, cssW, cssH, v, clearInfo) {
  drawWorld(ctx, cssW, cssH, v);

  ctx.fillStyle = "rgba(10, 12, 18, 0.62)";
  ctx.fillRect(0, 0, cssW, cssH);

  ctx.fillStyle = COL.win;
  ctx.font = "700 32px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx.textAlign = "center";
  ctx.fillText("CLEAR", cssW / 2, cssH / 2 - 36);

  ctx.fillStyle = COL.hud;
  ctx.font = "14px ui-monospace, SFMono-Regular, Menlo, monospace";
  const ghosts = v.winGhosts ?? v.ghostCount;
  let line = `Ghosts used: ${ghosts}`;
  if (clearInfo.best != null) {
    line += `  ·  best: ${clearInfo.best}`;
  }
  if (clearInfo.isNew) line += "  ·  NEW BEST";
  ctx.fillText(line, cssW / 2, cssH / 2);

  ctx.fillStyle = COL.hudDim;
  ctx.font = "12px ui-monospace, Menlo, monospace";
  ctx.fillText(v.level.name, cssW / 2, cssH / 2 + 24);

  const buttons = clearLayout(cssW, cssH);
  drawBtn(ctx, buttons.replay, "Replay (R)");
  drawBtn(ctx, buttons.next, clearInfo.hasNext ? "Next (N)" : "Next —");
  drawBtn(ctx, buttons.menu, "Menu (Esc)");

  return buttons;
}

function drawBtn(ctx, b, label) {
  ctx.fillStyle = COL.card;
  roundRect(ctx, b.x, b.y, b.w, b.h, 6);
  ctx.fill();
  ctx.strokeStyle = COL.cardBorder;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = COL.hud;
  ctx.font = "12px ui-monospace, Menlo, monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, b.x + b.w / 2, b.y + b.h / 2);
  ctx.textBaseline = "alphabetic";
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} cssW
 * @param {number} cssH
 * @param {ReturnType<import('./game.js').Game['view']>} v
 */
function drawWorld(ctx, cssW, cssH, v) {
  const level = v.level;
  const scale = Math.min(cssW / level.width, cssH / level.height) * 0.88;
  const ox = (cssW - level.width * scale) / 2;
  const oy = (cssH - level.height * scale) / 2 + 8;

  ctx.fillStyle = COL.bg;
  ctx.fillRect(0, 0, cssW, cssH);

  ctx.save();
  ctx.translate(ox, oy);
  ctx.scale(scale, scale);

  ctx.fillStyle = COL.floor;
  ctx.fillRect(0, 0, level.width, level.height);

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

  for (const w of level.walls) {
    ctx.fillStyle = COL.wall;
    ctx.fillRect(w.x, w.y, w.w, w.h);
    ctx.strokeStyle = COL.wallEdge;
    ctx.lineWidth = 1;
    ctx.strokeRect(w.x + 0.5, w.y + 0.5, w.w - 1, w.h - 1);
  }

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

  const multiPlate = v.plates.length > 1;
  for (let i = 0; i < v.plates.length; i++) {
    const p = v.plates[i];
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
    ctx.fillStyle = on ? "#1a1408" : "#c8b080";
    ctx.font = "bold 9px ui-monospace, Menlo, monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const label = on ? "HELD" : multiPlate ? `P${i + 1}` : "PLATE";
    ctx.fillText(label, p.x + p.w / 2, p.y + p.h / 2);
    ctx.textBaseline = "alphabetic";
  }

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

  {
    const e = v.exit;
    ctx.fillStyle = COL.exitCore;
    ctx.font = "bold 9px ui-monospace, Menlo, monospace";
    ctx.textAlign = "center";
    ctx.fillText("EXIT", e.x + e.w / 2, e.y + e.h / 2 + 3);
  }

  for (const g of v.ghosts) {
    ctx.beginPath();
    ctx.fillStyle = COL.ghost;
    ctx.arc(g.x, g.y, PLAYER_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = COL.ghostCore;
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  ctx.beginPath();
  ctx.fillStyle = COL.playerGlow;
  ctx.arc(v.player.x, v.player.y, PLAYER_RADIUS * 1.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.fillStyle = COL.player;
  ctx.arc(v.player.x, v.player.y, PLAYER_RADIUS, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} w
 * @param {number} h
 * @param {ReturnType<import('./game.js').Game['view']>} v
 * @param {{ best: number | null }} meta
 */
function drawHud(ctx, w, h, v, meta) {
  const pad = 16;
  ctx.fillStyle = COL.hud;
  ctx.font = "600 14px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx.textAlign = "left";
  ctx.fillText("LOOPSELF", pad, pad + 12);

  ctx.fillStyle = COL.hudDim;
  ctx.font = "12px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx.fillText(`${v.level.name}`, pad, pad + 30);

  if (meta.best != null) {
    ctx.fillStyle = COL.win;
    ctx.font = "11px ui-monospace, Menlo, monospace";
    ctx.fillText(`best ${meta.best}g`, pad, pad + 46);
  }

  ctx.fillStyle = COL.hudDim;
  ctx.font = "11px ui-monospace, Menlo, monospace";
  ctx.textAlign = "right";
  ctx.fillText("Esc menu", w - pad, pad + 12);

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

  if (!v.won) {
    const boxW = Math.min(560, w - 32);
    const boxH = 56;
    const bx = (w - boxW) / 2;
    const by = h - boxH - 16;
    ctx.fillStyle = "rgba(17, 20, 31, 0.92)";
    roundRect(ctx, bx, by, boxW, boxH, 8);
    ctx.fill();
    ctx.strokeStyle =
      v.phase === 1 ? "rgba(240, 192, 96, 0.45)" : "rgba(78, 201, 208, 0.45)";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = COL.hud;
    ctx.font = "13px ui-monospace, SFMono-Regular, Menlo, monospace";
    ctx.textAlign = "center";
    wrapText(ctx, v.hint, w / 2, by + 22, boxW - 24, 16);

    ctx.fillStyle = "rgba(106,122,144,0.9)";
    ctx.font = "11px ui-monospace, SFMono-Regular, Menlo, monospace";
    ctx.fillText(
      "WASD move  ·  timer auto-loops  ·  R restart  ·  Esc menu",
      w / 2,
      by + boxH - 10
    );
  }

  if (v.maxedToast > 0) {
    ctx.fillStyle = "rgba(224, 160, 64, 0.95)";
    ctx.font = "12px ui-monospace, SFMono-Regular, Menlo, monospace";
    ctx.textAlign = "center";
    ctx.fillText("Max ghosts — win with these, or R to wipe", w / 2, 72);
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

/** Hit-test axis-aligned rect */
export function hit(rect, x, y) {
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}
