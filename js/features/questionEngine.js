// js/features/questionEngine.js

function shuffle(arr) {
  // Fisher-Yates
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const r = Math.floor(Math.random() * (i + 1));
    [a[i], a[r]] = [a[r], a[i]];
  }
  return a;
}

function indexById(questions) {
  const m = new Map();
  for (const q of questions) m.set(q.id, q);
  return m;
}

function groupByDimension(questions) {
  const pools = { EI: [], SN: [], TF: [], JP: [] };
  for (const q of questions) {
    if (pools[q.dimension]) pools[q.dimension].push(q);
  }
  return pools;
}

function pickNFromPool(pool, n) {
  const shuffled = shuffle(pool);
  return shuffled.slice(0, Math.min(n, shuffled.length));
}

/**
 * 按四维均衡抽样：
 * - base = floor(target/4)
 * - remainder 分配给题库更充足的池（优先给池大的维度，避免某维不够）
 */
function selectBalancedIds(bankQuestions, targetCount) {
  const pools = groupByDimension(bankQuestions);

  const sizes = {
    EI: pools.EI.length,
    SN: pools.SN.length,
    TF: pools.TF.length,
    JP: pools.JP.length,
  };

  const totalAvailable = sizes.EI + sizes.SN + sizes.TF + sizes.JP;
  if (totalAvailable < targetCount) {
    throw new Error(
      `题库不足：当前总题数=${totalAvailable}，但需要=${targetCount}。请先扩充 tests/bank/*.json`
    );
  }

  const base = Math.floor(targetCount / 4);
  let remain = targetCount - base * 4;

  // 先每维 base
  const plan = { EI: base, SN: base, TF: base, JP: base };

  // remainder：按池大小从大到小分配，且不能超过池容量
  const dimOrder = Object.keys(sizes).sort((a, b) => sizes[b] - sizes[a]);

  while (remain > 0) {
    let progressed = false;
    for (const d of dimOrder) {
      if (remain <= 0) break;
      if (plan[d] < sizes[d]) {
        plan[d] += 1;
        remain -= 1;
        progressed = true;
      }
    }
    if (!progressed) break;
  }

  const selected = []
    .concat(pickNFromPool(pools.EI, plan.EI))
    .concat(pickNFromPool(pools.SN, plan.SN))
    .concat(pickNFromPool(pools.TF, plan.TF))
    .concat(pickNFromPool(pools.JP, plan.JP));

  return selected.map((q) => q.id);
}

/**
 * ✅ 给 quizPage.js 用的：生成题目顺序（并把 state 里需要的字段也准备好）
 * - 复用已有 selectedIds/order（刷新不变）
 * - 切换 quick/pro 或题库变动 => 重新抽题 + 重新生成顺序
 *
 * 返回：order（题目 id 的数组，表示本次出题顺序）
 */
export function buildQuestionOrder({ bankQuestions, state, targetCount }) {
  const qMap = indexById(bankQuestions);

  const needRebuild =
    !Array.isArray(state.selectedIds) ||
    state.selectedIds.length !== targetCount ||
    state.selectedIds.some((id) => !qMap.has(id));

  if (needRebuild) {
    const ids = selectBalancedIds(bankQuestions, targetCount);
    state.selectedIds = ids;
    state.order = shuffle(ids);

    // 新一轮测试：清空答题/结果，index 从 0
    state.answers = {};
    state.index = 0;
    state.result = null;
  } else {
    if (!Array.isArray(state.order) || state.order.length !== state.selectedIds.length) {
      state.order = shuffle(state.selectedIds);
    }
  }

  return state.order;
}

/**
 * 组装成页面用的 TEST（questions 是本次抽出的子集）
 * - 如果 state 里已有 selectedIds & order 且数量匹配，则复用（刷新不改变题目）
 * - 否则重新抽样并生成顺序
 */
export function buildTestFromBank({ bankMeta, bankQuestions, state, targetCount }) {
  const qMap = indexById(bankQuestions);

  const needRebuild =
    !Array.isArray(state.selectedIds) ||
    state.selectedIds.length !== targetCount ||
    state.selectedIds.some((id) => !qMap.has(id));

  if (needRebuild) {
    const ids = selectBalancedIds(bankQuestions, targetCount);
    state.selectedIds = ids;
    state.order = shuffle(ids);

    state.answers = {};
    state.index = 0;
    state.result = null;
  } else {
    if (!Array.isArray(state.order) || state.order.length !== state.selectedIds.length) {
      state.order = shuffle(state.selectedIds);
    }
  }

  const selectedQuestions = state.selectedIds
    .map((id) => qMap.get(id))
    .filter(Boolean);

  return {
    ...bankMeta,
    questions: selectedQuestions,
  };
}