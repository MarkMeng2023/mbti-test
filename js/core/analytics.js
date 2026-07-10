const PROGRESS_STEPS = [25, 50, 75, 100];

function cleanProperties(properties = {}) {
  return Object.fromEntries(
    Object.entries(properties).filter(([, value]) => value !== undefined && value !== null)
  );
}

function currentPage() {
  return {
    name: inferPageName(),
    path: window.location.pathname || "/",
  };
}

export function inferPageName(path = window.location.pathname || "") {
  const normalized = path.toLowerCase();

  if (normalized.endsWith("/quiz.html")) return "quiz";
  if (normalized.endsWith("/result.html")) return "result";
  if (normalized.includes("/types/")) return "personality_type";
  return "home";
}

export function trackEvent(eventName, properties = {}) {
  const payload = {
    event: eventName,
    properties: cleanProperties(properties),
    page: currentPage(),
    time: new Date().toISOString(),
  };

  console.info("[MBTI Analytics]", payload);
  return payload;
}

export function trackPageView(pageName = inferPageName()) {
  return trackEvent("page_view", {
    page_name: pageName,
    page_path: window.location.pathname || "/",
  });
}

export function trackTestStart(mode) {
  return trackEvent("test_start", { mode });
}

export function trackQuizProgress({ state, mode, answeredCount, totalCount }) {
  const total = Math.max(1, Number(totalCount) || 0);
  const percentComplete = Math.floor((Number(answeredCount) / total) * 100);
  const analytics = state.analytics || {};
  const marks = Array.isArray(analytics.progressMarks) ? analytics.progressMarks : [];
  let changed = false;

  for (const percent of PROGRESS_STEPS) {
    if (percentComplete >= percent && !marks.includes(percent)) {
      marks.push(percent);
      trackEvent("quiz_progress", { mode, percent });
      changed = true;
    }
  }

  state.analytics = {
    ...analytics,
    progressMarks: marks,
  };

  return changed;
}

export function trackTestCompleted({ mode, resultType }) {
  return trackEvent("test_completed", {
    mode,
    result_type: resultType,
  });
}

export function trackResultPreview({ mode, answeredCount, totalCount }) {
  return trackEvent("result_preview", {
    mode,
    answered_count: answeredCount,
    total_count: totalCount,
  });
}

export function trackShareImageGenerated(resultType) {
  return trackEvent("share_image_generated", {
    result_type: resultType,
  });
}

export function trackResultCopied(resultType) {
  return trackEvent("result_copied", {
    result_type: resultType,
  });
}

export function trackPersonalityDetailOpened(resultType) {
  return trackEvent("personality_detail_opened", {
    result_type: resultType,
  });
}
