// js/pages/quizPage.js
import { loadState, saveState, ensureDefaults } from "../core/storage.js";
import { computeResult } from "../core/scoring.js";

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const r = Math.floor(Math.random() * (i + 1));
    [a[i], a[r]] = [a[r], a[i]];
  }
  return a;
}

function getQuestionById(TEST, id) {
  return (TEST.questions || []).find((q) => q.id === id) || null;
}

export function initQuizPage({ TEST }) {
  const qTitle = document.getElementById("qTitle");
  const qDesc = document.getElementById("qDesc");
  const optionsEl = document.getElementById("options");
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");
  const hint = document.getElementById("hint");
  const progressBadge = document.getElementById("progressBadge");

  // 进度条（有就更新，没有就跳过）
  const progressText = document.getElementById("progressText");
  const progressPct = document.getElementById("progressPct");
  const progressFill = document.getElementById("progressFill");

  const state = ensureDefaults(loadState());
  state.answers = state.answers || {};

  const labels = TEST.scale?.labels || ["非常不同意", "不同意", "一般", "同意", "非常同意"];

  // ✅ 初始化 order：如果没有就用当前 TEST.questions 生成一个随机顺序
  // 注意：这里的 TEST.questions 已经是 main.js 组装好的“本次抽题结果”（40/120）
  if (!Array.isArray(state.order) || state.order.length !== TEST.questions.length) {
    const ids = (TEST.questions || []).map((q) => q.id);
    state.order = shuffle(ids);
    state.index = 0;
    // 切换题组时，最好清空 result（避免旧结果影响）
    state.result = null;
    saveState(state);
  }

  // 续答提示（测试期保留）
  const hasProgress = Object.keys(state.answers).length > 0;
  const isCompleted = Object.keys(state.answers).length === TEST.questions.length;

  if (hasProgress && !isCompleted && state.index > 0) {
    const ok = confirm(
      `检测到你上次做到第 ${state.index + 1} 题。继续吗？\n点“取消”将重置并从第1题开始。`
    );
    if (!ok) {
      state.answers = {};
      state.index = 0;
      state.result = null;
      saveState(state);
    }
  }

  function updateProgress() {
    const answeredCount = Object.keys(state.answers).length;
    const totalQ = TEST.questions.length;
    const pct = Math.round((answeredCount / totalQ) * 100);

    if (progressText) progressText.textContent = `已答 ${answeredCount}/${totalQ}`;
    if (progressPct) progressPct.textContent = `${pct}%`;
    if (progressFill) progressFill.style.width = `${pct}%`;
  }

  function makeOption(qid, value, labelText, checked) {
    const label = document.createElement("label");
    label.className = "option";

    const input = document.createElement("input");
    input.type = "radio";
    input.name = "choice";
    input.value = String(value);
    input.checked = checked;

    input.addEventListener("change", () => {
      state.answers[qid] = value;
      saveState(state);
      if (hint) hint.textContent = "";
      updateProgress();
    });

    const span = document.createElement("span");
    span.textContent = labelText;

    label.appendChild(input);
    label.appendChild(span);
    return label;
  }

  function render() {
    updateProgress();

    const idx = state.index;
    const total = TEST.questions.length;
    const qid = state.order[idx];

    const q = getQuestionById(TEST, qid);
    if (!q) {
      console.error("Order mismatch:", { idx, qid, order: state.order, questions: TEST.questions });
      alert("题目加载失败：order 与题库不匹配（请点“重新测试”或清除记录）。");
      return;
    }

    if (progressBadge) progressBadge.textContent = `${idx + 1} / ${total}`;
    if (qTitle) qTitle.textContent = `第 ${idx + 1} 题`;
    if (qDesc) qDesc.textContent = q.text || "";
    if (hint) hint.textContent = "";

    if (optionsEl) optionsEl.innerHTML = "";
    const picked = Number(state.answers[q.id] || 0);

    for (let v = 1; v <= 5; v++) {
      optionsEl.appendChild(makeOption(q.id, v, labels[v - 1], picked === v));
    }

    if (prevBtn) prevBtn.disabled = idx === 0;
    if (nextBtn) nextBtn.textContent = idx === total - 1 ? "提交并查看结果" : "下一题";
  }

  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      state.index = Math.max(0, state.index - 1);
      saveState(state);
      render();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      const idx = state.index;
      const total = TEST.questions.length;
      const qid = state.order[idx];

      if (!state.answers[qid]) {
        if (hint) hint.textContent = "请选择一个选项再继续。";
        return;
      }

      if (idx === total - 1) {
        const result = computeResult(TEST, state.answers);
        state.result = result; // { type, raw, pairs } 或你 scoring.js 定义的结构
        saveState(state);
        location.href = "result.html";
        return;
      }

      state.index += 1;
      saveState(state);
      render();
    });
  }

  render();
}