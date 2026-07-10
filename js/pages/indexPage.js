import { loadState, saveState, ensureDefaults, setMode, resetRun } from "../core/storage.js";
import { trackTestStart } from "../core/analytics.js";
import { formatCompletionCount, getCompletionCount } from "../core/completionCounter.js";

export function initIndexPage() {
  const state = ensureDefaults(loadState());

  // 个人信息表单（存在则绑定）
  const gender = document.getElementById("gender");
  const ageBand = document.getElementById("ageBand");
  const zodiac = document.getElementById("zodiac");
  const blood = document.getElementById("blood");

  const saveProfile = () => {
    state.profile = state.profile || {};
    if (gender) state.profile.gender = gender.value || "";
    if (ageBand) state.profile.ageBand = ageBand.value || "";
    if (zodiac) state.profile.zodiac = zodiac.value || "";
    if (blood) state.profile.blood = blood.value || "";
    saveState(state);
  };

  // 回填
  if (gender) gender.value = state.profile?.gender || "";
  if (ageBand) ageBand.value = state.profile?.ageBand || "";
  if (zodiac) zodiac.value = state.profile?.zodiac || "";
  if (blood) blood.value = state.profile?.blood || "";

  if (gender) gender.addEventListener("change", saveProfile);
  if (ageBand) ageBand.addEventListener("change", saveProfile);
  if (zodiac) zodiac.addEventListener("change", saveProfile);
  if (blood) blood.addEventListener("change", saveProfile);

  // Quick / Pro
  const startQuick = document.getElementById("startQuick");
  const startPro = document.getElementById("startPro");
  const completionCount = document.getElementById("completionCount");

  if (completionCount) {
    getCompletionCount().then((count) => {
      completionCount.textContent = formatCompletionCount(count);
    });
  }

  const go = (mode) => {
    setMode(state, mode);
    // 切换模式时，重置本次答题（保留 profile，方便解释个性化）
    resetRun(state, { keepProfile: true });
    saveState(state);
    trackTestStart(state.mode);
    location.href = "quiz.html";
  };

  if (startQuick) startQuick.addEventListener("click", () => go("quick"));
  if (startPro) startPro.addEventListener("click", () => go("pro"));

  saveState(state);
}
