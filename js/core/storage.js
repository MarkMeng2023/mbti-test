export const STORAGE_KEY = "mbti_quiz_v02";

export function createRunId() {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();
  return `run_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function loadState() {
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

export function saveState(state) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function clearState() {
  sessionStorage.removeItem(STORAGE_KEY);
}

export function ensureDefaults(state) {
  const s = state && typeof state === "object" ? state : {};
  s.mode = s.mode || "quick"; // quick | pro
  s.profile = s.profile || {};

  s.answers = s.answers || {};
  s.index = Number.isInteger(s.index) ? s.index : 0;

  // ✅ 新增：本次抽中的题目 id 列表（保证刷新不变）
  s.selectedIds = Array.isArray(s.selectedIds) ? s.selectedIds : [];

  // ✅ 新增：出题顺序（可以与 selectedIds 不同）
  s.order = Array.isArray(s.order) ? s.order : [];

  s.result = s.result || null;
  s.analytics = s.analytics && typeof s.analytics === "object" ? s.analytics : {};
  s.runId = typeof s.runId === "string" && s.runId ? s.runId : createRunId();
  s.countedRunIds = Array.isArray(s.countedRunIds) ? s.countedRunIds : [];
  return s;
}

export function setMode(state, mode) {
  state.mode = mode === "pro" ? "pro" : "quick";
}

export function getMode(state) {
  return state?.mode === "pro" ? "pro" : "quick";
}

export function resetRun(state, { keepProfile = true } = {}) {
  const profile = keepProfile ? (state.profile || {}) : {};
  state.profile = profile;

  state.answers = {};
  state.index = 0;
  state.result = null;
  state.analytics = {};
  state.runId = createRunId();

  // ✅ 切换模式 / 重新开始：清空抽题，下一次进入 quiz 会重新抽
  state.selectedIds = [];
  state.order = [];
}
