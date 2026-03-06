// core/scoring.js

function clamp01(x) {
  return Math.max(0, Math.min(1, x));
}

/**
 * 计算某一维的倾向强度
 * ratio: 右侧占比 0~1（0.5 表示五五开）
 * 返回：强/中/弱
 */
export function strengthLabelFromRatio(ratio) {
  const r = clamp01(ratio);
  const dist = Math.abs(r - 0.5); // 0 ~ 0.5

  // 你可以后期微调阈值
  if (dist >= 0.22) return "强";
  if (dist >= 0.12) return "中";
  return "弱";
}

/**
 * 根据左右分数计算 ratio（右侧占比）
 */
export function ratioFromPair(left, right) {
  const t = (left + right) || 1;
  return clamp01(right / t);
}

/**
 * 计算 MBTI 风格结果
 * - TEST: 题库对象（包含 dimensions / questions）
 * - answers: { [qid]: 1..5 }
 *
 * 返回：
 * {
 *   type: "INTJ",
 *   raw: {E,I,S,N,T,F,J,P},
 *   pairs: {
 *     EI:{left,right,ratio,strength}, SN:{...}, TF:{...}, JP:{...}
 *   }
 * }
 */
export function computeResult(TEST, answers) {
  const a = answers || {};

  // 原始分：8个字母
  const raw = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 };

  // 维度映射：EI/SN/TF/JP -> {left, right}
  const dimMap = {};
  for (const d of TEST.dimensions || []) {
    dimMap[d.id] = d; // d.id: "EI" | "SN" | "TF" | "JP"
  }

  for (const q of TEST.questions || []) {
    const v = Number(a[q.id]);
    if (!v) continue;

    // 1..5 -> -2..+2
    const rawScore = v - 3;
    const val = q.reverse ? -rawScore : rawScore;

    const dim = dimMap[q.dimension]; // q.dimension 应该是 "EI"/"SN"/"TF"/"JP"
    if (!dim) continue;

    // 这里按：val >=0 计入 left；val <0 计入 right
    if (val >= 0) raw[dim.left] += val;
    else raw[dim.right] += Math.abs(val);
  }

  // 四维 pair
  const pairs = {
    EI: buildPair(raw.E, raw.I),
    SN: buildPair(raw.S, raw.N),
    TF: buildPair(raw.T, raw.F),
    JP: buildPair(raw.J, raw.P),
  };

  // 字母判定：left >= right 取 left，否则取 right
  const type =
    (pairs.EI.left >= pairs.EI.right ? "E" : "I") +
    (pairs.SN.left >= pairs.SN.right ? "S" : "N") +
    (pairs.TF.left >= pairs.TF.right ? "T" : "F") +
    (pairs.JP.left >= pairs.JP.right ? "J" : "P");

  return { type, raw, pairs };
}

function buildPair(left, right) {
  const ratio = ratioFromPair(left, right); // right 占比
  const strength = strengthLabelFromRatio(ratio);
  return { left: Number(left || 0), right: Number(right || 0), ratio, strength };
}