import { loadState, saveState, ensureDefaults, clearState } from "../core/storage.js";
import { computeResult } from "../core/scoring.js";
import { profileHint } from "../core/profile.js";
import { ratioFromPair, drawShareCard } from "../features/shareCard.js";
import { SITE_CONFIG } from "../config/site.js";

export function initResultPage({ TEST, TYPE_TEXT }) {
  const typeTitle = document.getElementById("typeTitle");
  const typeDescEl = document.getElementById("typeDesc");
  const scoreGrid = document.getElementById("scoreGrid");

  const clearBtn = document.getElementById("clearBtn");
  const shareBtn = document.getElementById("shareBtn");
  const copyBtn = document.getElementById("copyBtn");
  const retryBtn = document.getElementById("retryBtn");
  const homeBtn = document.getElementById("homeBtn");

  const shareCanvas = document.getElementById("shareCanvas");

  const reportSummary = document.getElementById("reportSummary");
  const reportStrengths = document.getElementById("reportStrengths");
  const reportRisks = document.getElementById("reportRisks");
  const reportTips = document.getElementById("reportTips");

  const friendTypeEl = document.getElementById("friendType");
  const friendReasonEl = document.getElementById("friendReason");
  const loveTypeEl = document.getElementById("loveType");
  const loveReasonEl = document.getElementById("loveReason");

  const resultNavTitle = document.getElementById("resultNavTitle");
  const resultBadge = document.getElementById("resultBadge");

  const state = ensureDefaults(loadState());
  const answers = state.answers || {};
  const profile = state.profile || {};

  // 顶部站点信息
  if (resultNavTitle) resultNavTitle.textContent = SITE_CONFIG.resultPageTitle || "测试结果";
  if (resultBadge) {
    if (SITE_CONFIG.showVersion) {
      resultBadge.textContent = SITE_CONFIG.version || "";
      resultBadge.style.display = "";
    } else {
      resultBadge.style.display = "none";
    }
  }

  // 测试期默认允许直接进结果页：能算就算
  let result = state.result;
  if (!result || !result.type || !result.raw || !result.pairs) {
    result = computeResult(TEST, answers);
    state.result = result;
    saveState(state);
  }

  if (typeTitle) typeTitle.textContent = `你的类型：${result.type}`;

  const t = TYPE_TEXT?.[result.type];
  const hintText = profileHint(profile);

  if (typeDescEl) {
    if (t?.title) {
      typeDescEl.textContent = `${t.title}${hintText}`;
    } else {
      typeDescEl.textContent = `你的结果是 ${result.type}。${hintText}`;
    }
  }

  function fillList(el, arr) {
    if (!el) return;
    el.innerHTML = "";
    (arr || []).forEach((x) => {
      const li = document.createElement("li");
      li.textContent = x;
      el.appendChild(li);
    });
  }

  // 人格报告
  if (t) {
    if (reportSummary) reportSummary.textContent = t.summary || "";
    fillList(reportStrengths, t.strengths);
    fillList(reportRisks, t.risks);
    fillList(reportTips, t.tips);
  } else {
    if (reportSummary) {
      reportSummary.textContent = "后续将补全该类型的详细解释。";
    }
    fillList(reportStrengths, ["优势文案待补充"]);
    fillList(reportRisks, ["盲点文案待补充"]);
    fillList(reportTips, ["建议文案待补充"]);
  }

  // 匹配信息
  if (t?.friend_match?.type) {
    if (friendTypeEl) friendTypeEl.textContent = `朋友最搭：${t.friend_match.type}`;
    if (friendReasonEl) friendReasonEl.textContent = t.friend_match.reason || "";
  } else {
    if (friendTypeEl) friendTypeEl.textContent = "朋友最搭：—";
    if (friendReasonEl) friendReasonEl.textContent = "";
  }

  if (t?.love_match?.type) {
    if (loveTypeEl) loveTypeEl.textContent = `恋爱最搭：${t.love_match.type}`;
    if (loveReasonEl) loveReasonEl.textContent = t.love_match.reason || "";
  } else {
    if (loveTypeEl) loveTypeEl.textContent = "恋爱最搭：—";
    if (loveReasonEl) loveReasonEl.textContent = "";
  }

  // 四维条
  if (scoreGrid) {
    scoreGrid.innerHTML = "";

    for (const d of TEST.dimensions) {
      const leftVal = Number(result.raw?.[d.left] || 0);
      const rightVal = Number(result.raw?.[d.right] || 0);

      const total = Math.max(1, leftVal + rightVal);
      const leftPct = Math.round((leftVal / total) * 100);

      const item = document.createElement("div");
      item.className = "scoreItem";

      const top = document.createElement("div");
      top.className = "scoreTop";

      const lab = document.createElement("div");
      lab.className = "scoreLabel";
      lab.textContent = `${d.name}（${d.left}/${d.right}）`;

      const val = document.createElement("div");
      val.className = "scoreVal";

      const pair = result.pairs?.[d.id];
      const strength = pair?.strength ? `（${pair.strength}）` : "";
      val.textContent = `${d.left} ${leftVal.toFixed(1)} : ${rightVal.toFixed(1)} ${d.right}${strength}`;

      const bar = document.createElement("div");
      bar.className = "bar";

      const fill = document.createElement("div");
      fill.style.width = `${leftPct}%`;
      bar.appendChild(fill);

      top.appendChild(lab);
      top.appendChild(val);

      item.appendChild(top);
      item.appendChild(bar);

      scoreGrid.appendChild(item);
    }
  }

  // 生成分享图
  if (shareBtn) {
    shareBtn.addEventListener("click", () => {
      if (!result?.type || !result?.pairs) {
        alert("没有找到测试结果，请先完成一次测试。");
        return;
      }

      const tt = TYPE_TEXT?.[result.type] || {};
      const profileText = hintText.replace(/[（）]/g, "");

      const bars = [
        {
          name: "精力取向",
          left: "E",
          right: "I",
          a: result?.pairs?.EI?.left ?? 0,
          b: result?.pairs?.EI?.right ?? 0,
        },
        {
          name: "信息处理",
          left: "S",
          right: "N",
          a: result?.pairs?.SN?.left ?? 0,
          b: result?.pairs?.SN?.right ?? 0,
        },
        {
          name: "决策偏好",
          left: "T",
          right: "F",
          a: result?.pairs?.TF?.left ?? 0,
          b: result?.pairs?.TF?.right ?? 0,
        },
        {
          name: "生活方式",
          left: "J",
          right: "P",
          a: result?.pairs?.JP?.left ?? 0,
          b: result?.pairs?.JP?.right ?? 0,
        },
      ].map((x) => ({
        name: x.name,
        left: x.left,
        right: x.right,
        ratio: ratioFromPair(x.a, x.b),
      }));

      const canvas = drawShareCard({
        canvas: shareCanvas,
        type: result.type,
        title: tt.title || "",
        summary: tt.summary || "",
        profileText,
        bars,
        friendMatch: tt.friend_match || null,
        loveMatch: tt.love_match || null,
      });

      if (!canvas) {
        alert('没有找到 shareCanvas，请确认 result.html 里有 <canvas id="shareCanvas" ...>');
        return;
      }

      const a = document.createElement("a");
      a.download = `MBTI_${result.type}.png`;
      a.href = canvas.toDataURL("image/png");
      a.click();
    });
  }

  // 复制结果文案
  if (copyBtn) {
    copyBtn.addEventListener("click", async () => {
      const tt = TYPE_TEXT?.[result.type] || {};
      const shareUrl = SITE_CONFIG.shareBaseUrl || "";
      const tail = shareUrl ? `你也来测测👇\n${shareUrl}` : SITE_CONFIG.copyLinkPlaceholder;

      const text =
`我测出来是 ${result.type}（${tt.title || ""}）

${tt.summary || ""}

朋友最搭：${tt.friend_match?.type || "-"}
${tt.friend_match?.reason || ""}

恋爱最搭：${tt.love_match?.type || "-"}
${tt.love_match?.reason || ""}

${tail}`;

      try {
        await navigator.clipboard.writeText(text);
        alert("已复制，可以直接发朋友圈 / 小红书");
      } catch (err) {
        console.error(err);
        alert("复制失败，请手动复制");
      }
    });
  }

  // 再测一次
  if (retryBtn) {
    retryBtn.addEventListener("click", () => {
      location.href = "quiz.html";
    });
  }

  // 回到首页
  if (homeBtn) {
    homeBtn.addEventListener("click", () => {
      location.href = "index.html";
    });
  }

  // 清除本地答题记录
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      clearState();
      alert("已清除本地答题记录。");
      location.href = "index.html";
    });
  }
}