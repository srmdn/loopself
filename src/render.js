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
 * 1 column when few levels; 2 columns when many.
 * @param {number} w
 * @param {number} h
 * @param {number} count
 */
export function menuLayout(w, h, count) {
  const titleY = Math.max(40, h * 0.08);
  const cols = count > 5 ? 2 : 1;
  const gapX = 12;
  const gapY = 10;
  const cardH = count > 6 ? 52 : 58;
  const maxCardW = cols === 1 ? Math.min(440, w - 48) : Math.min(320, (w - 48 - gapX) / 2);
  const cardW = maxCardW;
  const rows = Math.ceil(count / cols);
  const totalW = cols * cardW + (cols - 1) * gapX;
  const totalH = rows * cardH + (rows - 1) * gapY;
  let startY = titleY + 52;
  if (startY + totalH > h - 36) {
    startY = Math.max(88, h - totalH - 36);
  }
  const x0 = (w - totalW) / 2;
  /** @type {{ index: number, x: number, y: number, w: number, h: number }[]} */
  const cards = [];
  for (let i = 0; i < count; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    cards.push({
      index: i,
      x: x0 + col * (cardW + gapX),
      y: startY + row * (cardH + gapY),
      w: cardW,
      h: cardH,
    });
  }
  return { titleY, cards, cols };
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
 * First-boot rule card layout.
 * @param {number} w
 * @param {number} h
 */
export function introLayout(w, h) {
  const cardW = Math.min(420, w - 48);
  const cardH = Math.min(340, h - 80);
  return {
    card: {
      x: (w - cardW) / 2,
      y: (h - cardH) / 2,
      w: cardW,
      h: cardH,
    },
    btn: {
      x: (w - 160) / 2,
      y: (h - cardH) / 2 + cardH - 56,
      w: 160,
      h: 40,
    },
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
  ctx.fillText(
    "Every loop you leave another you behind.",
    cssW / 2,
    layout.titleY + 26
  );

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
    ctx.font = "700 15px ui-monospace, Menlo, monospace";
    ctx.textAlign = "left";
    ctx.fillText(num, card.x + 14, card.y + 24);

    ctx.fillStyle = COL.hud;
    ctx.font = "600 14px ui-monospace, Menlo, monospace";
    ctx.fillText(lv.name, card.x + 46, card.y + 24);

    ctx.fillStyle = COL.hudDim;
    ctx.font = "11px ui-monospace, Menlo, monospace";
    const brief =
      lv.brief.length > 42 && layout.cols === 2
        ? lv.brief.slice(0, 40) + "…"
        : lv.brief;
    ctx.fillText(brief, card.x + 46, card.y + 42);

    const best = bests[lv.id];
    ctx.textAlign = "right";
    if (best != null) {
      ctx.fillStyle = COL.win;
      ctx.font = "11px ui-monospace, Menlo, monospace";
      ctx.fillText(`${best}g`, card.x + card.w - 14, card.y + 32);
    } else {
      ctx.fillStyle = COL.hudDim;
      ctx.font = "11px ui-monospace, Menlo, monospace";
      ctx.fillText("—", card.x + card.w - 14, card.y + 32);
    }
  }

  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(106,122,144,0.85)";
  ctx.font = "11px ui-monospace, Menlo, monospace";
  ctx.fillText("Click a level  ·  or press 1–8", cssW / 2, cssH - 16);

  return layout;
}

/**
 * First-boot rules overlay (full screen).
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} cssW
 * @param {number} cssH
 */
export function renderIntro(ctx, cssW, cssH) {
  ctx.fillStyle = COL.bg;
  ctx.fillRect(0, 0, cssW, cssH);

  const layout = introLayout(cssW, cssH);
  const { card, btn } = layout;

  ctx.fillStyle = COL.card;
  roundRect(ctx, card.x, card.y, card.w, card.h, 12);
  ctx.fill();
  ctx.strokeStyle = COL.accent;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = COL.hud;
  ctx.font = "700 22px ui-monospace, Menlo, monospace";
  ctx.textAlign = "center";
  ctx.fillText("How to play", cssW / 2, card.y + 40);

  const lines = [
    "Each level is a short loop.",
    "When the timer ends, your path replays",
    "as a cyan ghost.",
    "",
    "Ghosts hold pressure plates.",
    "You walk through open doors.",
    "Cooperate with past you — or block them.",
    "",
    "WASD move  ·  R wipe ghosts  ·  Esc menu",
    "Fewer ghosts = better score.",
  ];

  ctx.font = "13px ui-monospace, Menlo, monospace";
  let yy = card.y + 72;
  for (const line of lines) {
    ctx.fillStyle = line === "" ? COL.hudDim : COL.hudDim;
    if (
      line.startsWith("WASD") ||
      line.startsWith("Ghosts") ||
      line.startsWith("You walk") ||
      line.startsWith("Fewer")
    ) {
      ctx.fillStyle = COL.hud;
    }
    if (line) ctx.fillText(line, cssW / 2, yy);
    yy += line === "" ? 10 : 18;
  }

  ctx.fillStyle = COL.cardHot;
  roundRect(ctx, btn.x, btn.y, btn.w, btn.h, 8);
  ctx.fill();
  ctx.strokeStyle = COL.accent;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = COL.accent;
  ctx.font = "600 13px ui-monospace, Menlo, monospace";
  ctx.fillText("Got it (Enter)", cssW / 2, btn.y + btn.h / 2 + 4);

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
  drawLoopPulse(ctx, cssW, cssH, v.loopPulse);
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

  // Ghost alpha trails
  if (v.ghostTrails) {
    for (const trail of v.ghostTrails) {
      for (let i = 0; i < trail.length; i++) {
        const p = trail[i];
        const a = 0.04 + (i / Math.max(1, trail.length)) * 0.18;
        ctx.beginPath();
        ctx.fillStyle = `rgba(78, 201, 208, ${a})`;
        ctx.arc(p.x, p.y, PLAYER_RADIUS * 0.55, 0, Math.PI * 2);
        ctx.fill();
      }
    }
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

  // Win particles (world space)
  if (v.particles && v.particles.length) {
    for (const p of v.particles) {
      const a = Math.max(0, p.life / p.maxLife);
      ctx.globalAlpha = a;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  ctx.restore();
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} w
 * @param {number} h
 * @param {number} pulse 0..1
 */
function drawLoopPulse(ctx, w, h, pulse) {
  if (!pulse || pulse <= 0) return;
  ctx.fillStyle = `rgba(78, 201, 208, ${0.12 * pulse})`;
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = `rgba(78, 201, 208, ${0.35 * pulse})`;
  ctx.lineWidth = 3 + 6 * pulse;
  ctx.strokeRect(4, 4, w - 8, h - 8);
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
  const num = String((v.level.index ?? 0) + 1).padStart(2, "0");
  ctx.fillText(`${num}  ${v.level.name}`, pad, pad + 30);

  if (meta.best != null) {
    ctx.fillStyle = COL.win;
    ctx.font = "11px ui-monospace, Menlo, monospace";
    ctx.fillText(`best ${meta.best}g`, pad, pad + 46);
  }

  ctx.fillStyle = COL.hudDim;
  ctx.font = "11px ui-monospace, Menlo, monospace";
  ctx.textAlign = "right";
  // Touch UI draws MENU button; keyboard hint only on desktop
  try {
    if (
      !(
        window.matchMedia("(pointer: coarse)").matches ||
        (navigator.maxTouchPoints || 0) > 0
      )
    ) {
      ctx.fillText("Esc menu", w - pad, pad + 12);
    }
  } catch {
    ctx.fillText("Esc menu", w - pad, pad + 12);
  }

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
    let touchUi = false;
    try {
      touchUi =
        window.matchMedia("(pointer: coarse)").matches ||
        (navigator.maxTouchPoints || 0) > 0;
    } catch {
      touchUi = false;
    }
    // Leave room for virtual stick / buttons on phones
    const by = h - boxH - (touchUi ? 132 : 16);
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
    const controlsHint = touchUi
      ? "Stick move  ·  timer auto-loops  ·  R wipe  ·  MENU"
      : "WASD move  ·  timer auto-loops  ·  R restart  ·  Esc menu";
    ctx.fillText(controlsHint, w / 2, by + boxH - 10);
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
