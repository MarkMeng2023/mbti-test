import { SITE_CONFIG } from "../config/site.js";

function clamp01(x) {
  return Math.max(0, Math.min(1, x));
}

// 偏左为0，偏右为1（右侧占比）
export function ratioFromPair(a, b) {
  const t = a + b || 1;
  return clamp01(b / t);
}

function roundRect(ctx, x, y, w, h, r, fill, stroke) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
  if (fill) ctx.fill();
  if (stroke) ctx.stroke();
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight, maxLines) {
  if (!text) return;
  const words = text.split(/\s+/);
  let line = "";
  let lineCount = 0;

  const tokens = words.length === 1 && /[\u4e00-\u9fa5]/.test(text) ? text.split("") : words;
  const useSpace = tokens === words;

  for (let i = 0; i < tokens.length; i++) {
    const testLine = line + tokens[i] + (useSpace ? " " : "");
    const w = ctx.measureText(testLine).width;

    if (w > maxWidth && line) {
      ctx.fillText(line.trim(), x, y);
      y += lineHeight;
      line = tokens[i] + (useSpace ? " " : "");
      lineCount++;
      if (maxLines && lineCount >= maxLines) return;
    } else {
      line = testLine;
    }
  }

  if (!maxLines || lineCount < maxLines) ctx.fillText(line.trim(), x, y);
}

function drawMatchBlock(ctx, { x, y, w, title, body }) {
  const padX = 18;
  const padY = 14;
  const blockH = 140;

  ctx.fillStyle = "rgba(255,255,255,0.06)";
  roundRect(ctx, x, y, w, blockH, 18, true, false);
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.lineWidth = 2;
  roundRect(ctx, x, y, w, blockH, 18, false, true);

  ctx.textBaseline = "top";

  ctx.fillStyle = "rgba(255,255,255,0.88)";
  ctx.font =
    "700 34px system-ui, -apple-system, Segoe UI, Roboto, PingFang SC, Hiragino Sans GB, Microsoft YaHei";
  ctx.fillText(title || "", x + padX, y + padY);

  ctx.fillStyle = "rgba(255,255,255,0.72)";
  ctx.font =
    "500 30px system-ui, -apple-system, Segoe UI, Roboto, PingFang SC, Hiragino Sans GB, Microsoft YaHei";
  wrapText(ctx, body || "", x + padX, y + padY + 52, w - padX * 2, 40, 2);

  return blockH;
}

export function drawShareCard({
  canvas,
  type,
  title,
  summary,
  profileText,
  bars,
  friendMatch = null,
  loveMatch = null,
}) {
  if (!canvas) return null;

  const c = canvas;
  const ctx = c.getContext("2d");
  const W = c.width,
    H = c.height;

  ctx.clearRect(0, 0, W, H);

  // 背景渐变
  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, "#0b1020");
  g.addColorStop(1, "#0a2a2a");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // 卡片容器
  const pad = 72;
  const cardX = pad,
    cardY = pad,
    cardW = W - pad * 2,
    cardH = H - pad * 2;

  ctx.fillStyle = "rgba(255,255,255,0.05)";
  roundRect(ctx, cardX, cardY, cardW, cardH, 36, true, false);
  ctx.strokeStyle = "rgba(255,255,255,0.10)";
  ctx.lineWidth = 2;
  roundRect(ctx, cardX, cardY, cardW, cardH, 36, false, true);

  // 标题块
  ctx.fillStyle = "rgba(124,92,255,0.20)";
  roundRect(ctx, cardX + 24, cardY + 24, 260, 68, 18, true, false);
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.font =
    "700 30px system-ui, -apple-system, Segoe UI, Roboto, PingFang SC, Hiragino Sans GB, Microsoft YaHei";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(SITE_CONFIG.siteName || "MBTI 风格测试", cardX + 44, cardY + 70);

  // 类型
  ctx.fillStyle = "rgba(255,255,255,0.95)";
  ctx.font =
    "800 112px system-ui, -apple-system, Segoe UI, Roboto, PingFang SC, Hiragino Sans GB, Microsoft YaHei";
  ctx.fillText(type || "----", cardX + 40, cardY + 220);

  // title
  ctx.fillStyle = "rgba(255,255,255,0.88)";
  ctx.font =
    "700 48px system-ui, -apple-system, Segoe UI, Roboto, PingFang SC, Hiragino Sans GB, Microsoft YaHei";
  ctx.textBaseline = "top";
  wrapText(ctx, title || "", cardX + 40, cardY + 290, cardW - 80, 60, 2);

  // summary
  ctx.fillStyle = "rgba(255,255,255,0.72)";
  ctx.font =
    "500 36px system-ui, -apple-system, Segoe UI, Roboto, PingFang SC, Hiragino Sans GB, Microsoft YaHei";
  wrapText(ctx, summary || "", cardX + 40, cardY + 420, cardW - 80, 50, 3);

  // profile
  if (profileText) {
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.font =
      "500 28px system-ui, -apple-system, Segoe UI, Roboto, PingFang SC, Hiragino Sans GB, Microsoft YaHei";
    wrapText(ctx, profileText, cardX + 40, cardY + 585, cardW - 80, 40, 2);
  }

  const fm =
    friendMatch?.type
      ? `【${friendMatch.type}】${friendMatch.reason || ""}`
      : "";
  const lm =
    loveMatch?.type
      ? `【${loveMatch.type}】${loveMatch.reason || ""}`
      : "";

  let cursorY = cardY + 690;
  const blockW = cardW - 80;

  if (fm) {
    drawMatchBlock(ctx, {
      x: cardX + 40,
      y: cursorY,
      w: blockW,
      title: "朋友最搭",
      body: fm,
    });
    cursorY += 156;
  }

  if (lm) {
    drawMatchBlock(ctx, {
      x: cardX + 40,
      y: cursorY,
      w: blockW,
      title: "恋爱最搭",
      body: lm,
    });
    cursorY += 156;
  }

  // 提示文案
  ctx.fillStyle = "rgba(255,255,255,0.56)";
  ctx.font =
    "500 26px system-ui, -apple-system, Segoe UI, Roboto, PingFang SC, Hiragino Sans GB, Microsoft YaHei";
  ctx.textBaseline = "top";
  ctx.fillText(SITE_CONFIG.shareHintText || "", cardX + 40, cursorY - 8);

  // 四维条形图
  const barLeft = cardX + 40;
  const barW = cardW - 80;
  const trackH = 26;

  ctx.textBaseline = "top";

  const rowGap = 96;
  const labelToBarGap = 44;
  const barTop = cursorY + 36;

  (bars || []).forEach((b, i) => {
    const rowY = barTop + i * rowGap;

    ctx.fillStyle = "rgba(255,255,255,0.82)";
    ctx.font =
      "700 34px system-ui, -apple-system, Segoe UI, Roboto, PingFang SC, Hiragino Sans GB, Microsoft YaHei";
    ctx.fillText(`${b.name}（${b.left}/${b.right}）`, barLeft, rowY);

    const r = b.ratio ?? 0.5;
    const pct = Math.round(r * 100);
    ctx.fillStyle = "rgba(255,255,255,0.70)";
    ctx.font =
      "700 30px system-ui, -apple-system, Segoe UI, Roboto, PingFang SC, Hiragino Sans GB, Microsoft YaHei";
    const pctText = `${pct}%`;
    const pctW = ctx.measureText(pctText).width;
    ctx.fillText(pctText, barLeft + barW - pctW, rowY + 2);

    const ty = rowY + labelToBarGap;
    ctx.fillStyle = "rgba(255,255,255,0.10)";
    roundRect(ctx, barLeft, ty, barW, trackH, 999, true, false);

    const fillW = Math.max(10, Math.round(barW * r));
    ctx.fillStyle = "rgba(124,92,255,0.72)";
    roundRect(ctx, barLeft, ty, fillW, trackH, 999, true, false);
  });

  // 底部
  const footer = SITE_CONFIG.showVersion
    ? `${SITE_CONFIG.footerText} · ${SITE_CONFIG.version}`
    : SITE_CONFIG.footerText;

  ctx.fillStyle = "rgba(255,255,255,0.45)";
  ctx.font =
    "500 26px system-ui, -apple-system, Segoe UI, Roboto, PingFang SC, Hiragino Sans GB, Microsoft YaHei";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(footer || "", cardX + 40, cardY + cardH - 46);

  return c;
}