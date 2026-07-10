import { SITE_CONFIG } from "../config/site.js";

const LOCAL_COUNT_KEY = "mbti_completion_count_demo";
const LOCAL_RUNS_KEY = "mbti_completion_counted_runs_demo";
const CACHE_KEY = "mbti_completion_count_cache";

function config() {
  return SITE_CONFIG.completionCounter || {};
}

function initialCount() {
  return Number(config().initialCount) || 1019;
}

function formatApiUrl(path) {
  const baseUrl = String(config().apiBaseUrl || "").replace(/\/+$/, "");
  return `${baseUrl}${path}`;
}

function readNumber(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function readLocalRuns() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_RUNS_KEY) || "[]");
  } catch {
    return [];
  }
}

function writeCachedCount(count) {
  try {
    localStorage.setItem(CACHE_KEY, String(count));
  } catch {
    // 缓存失败不影响页面展示或测试流程。
  }
}

function readCachedCount() {
  try {
    return readNumber(localStorage.getItem(CACHE_KEY), initialCount());
  } catch {
    return initialCount();
  }
}

function getLocalDemoCount() {
  try {
    const stored = localStorage.getItem(LOCAL_COUNT_KEY);
    if (stored === null) {
      localStorage.setItem(LOCAL_COUNT_KEY, String(initialCount()));
      return initialCount();
    }
    return readNumber(stored, initialCount());
  } catch {
    return initialCount();
  }
}

function incrementLocalDemoCount(runId) {
  // 本地演示模式只用于没有真实 API 时的预览：数据保存在当前浏览器 localStorage，
  // 不代表全站共享计数，也不能作为正式线上累计人数方案。
  const countedRuns = readLocalRuns();
  const currentCount = getLocalDemoCount();

  if (countedRuns.includes(runId)) {
    return { count: currentCount, incremented: false };
  }

  const nextCount = currentCount + 1;
  countedRuns.push(runId);
  localStorage.setItem(LOCAL_COUNT_KEY, String(nextCount));
  localStorage.setItem(LOCAL_RUNS_KEY, JSON.stringify(countedRuns.slice(-200)));
  return { count: nextCount, incremented: true };
}

export function formatCompletionCount(count) {
  return new Intl.NumberFormat("zh-CN").format(readNumber(count, initialCount()));
}

export async function getCompletionCount() {
  if (!config().enabled || !config().apiBaseUrl) {
    return getLocalDemoCount();
  }

  try {
    const response = await fetch(formatApiUrl("/completion-count"), {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    const count = readNumber(data?.count, readCachedCount());
    writeCachedCount(count);
    return count;
  } catch (error) {
    console.warn("[MBTI CompletionCounter] Failed to load completion count.", error);
    return readCachedCount();
  }
}

export async function incrementCompletionCount(runId, mode) {
  if (!runId) {
    console.warn("[MBTI CompletionCounter] Missing runId; completion count was not incremented.");
    return { count: await getCompletionCount(), incremented: false };
  }

  if (!config().enabled || !config().apiBaseUrl) {
    return incrementLocalDemoCount(runId);
  }

  try {
    const response = await fetch(formatApiUrl("/completion-count/increment"), {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ runId, mode }),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    const count = readNumber(data?.count, readCachedCount());
    writeCachedCount(count);
    return {
      count,
      incremented: Boolean(data?.incremented),
    };
  } catch (error) {
    console.warn("[MBTI CompletionCounter] Failed to increment completion count.", error);
    return { count: readCachedCount(), incremented: false, failed: true };
  }
}
